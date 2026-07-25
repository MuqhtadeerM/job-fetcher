import axios from "axios";
import {
  isRemote,
  splitLocation,
  safeParseDate,
} from "../services/normalizer.js";
import logger from "../utils/logger.js";

const REQUEST_TIMEOUT_MS = 10000;

/**
 * Extracts the Greenhouse "board token" (company identifier) from a career URL.
 * Handles both known Greenhouse URL shapes:
 *   https://boards.greenhouse.io/airbnb
 *   https://job-boards.greenhouse.io/airbnb/jobs/123
 */
function extractBoardToken(careerUrl) {
  // A regular expression (regex): a pattern used to match/extract text.
  // Breaking this one down piece by piece:
  //   greenhouse\.io\/       — literally match "greenhouse.io/"
  //                            (the backslash before the dot means "a literal
  //                            dot character," since an unescaped `.` in
  //                            regex means "any character")
  //   ([a-zA-Z0-9_-]+)       — a CAPTURE GROUP (the parentheses): match one
  //                            or more letters, digits, underscores, or
  //                            hyphens, and remember exactly what matched.
  //                            This is the board token itself.
  //   (?:\/|$)               — a NON-capturing group: match either a "/"
  //                            (if there's more path after the token, like
  //                            "/jobs/123") OR the end of the string ($),
  //                            so the token doesn't accidentally swallow
  //                            extra path segments.
  const match = careerUrl.match(/greenhouse\.io\/([a-zA-Z0-9_-]+)(?:\/|$)/);

  // .match() returns null if there's no match at all, or an array where
  // index 0 is the full matched text and index 1 is our capture group
  // (the board token) — exactly what we want.
  return match ? match[1] : null;
}

/**
 * Fetches raw job data from Greenhouse's public JSON API for a given
 * board token. Returns Greenhouse's RAW response shape — normalization
 * happens in a separate function below, deliberately kept apart so each
 * piece can be tested/reasoned about independently.
 */
async function fetchRawJobs(boardToken) {
  const url = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`;
  // `?content=true` asks Greenhouse to include each job's full HTML
  // description in the response — without it, we'd only get titles/metadata
  // and would need a SECOND request per job to fetch descriptions, which
  // would be far slower and heavier than fetching everything in one call.

  const response = await axios.get(url, { timeout: REQUEST_TIMEOUT_MS });

  // Greenhouse's response shape is `{ jobs: [...] }` — we only care about
  // the array itself going forward.
  return response.data.jobs || [];
}

/**
 * Transforms ONE raw Greenhouse job object into our normalized Job schema
 * shape (matching src/models/Job.js from Step 5 exactly).
 */
function normalizeJob(rawJob, careerUrl) {
  // Greenhouse gives location as { name: "San Francisco, CA, US" } —
  // optional chaining (?.) safely accesses `.location.name` even if
  // `rawJob.location` itself is missing, returning undefined instead
  // of throwing "Cannot read property 'name' of undefined".
  const locationText = rawJob.location?.name || "";
  const { city, country } = splitLocation(locationText);

  // Greenhouse nests department info as an ARRAY of department objects
  // (a job can technically belong to multiple departments). We just take
  // the first one's name, if any exist, using optional chaining again.
  const department = rawJob.departments?.[0]?.name || null;

  return {
    title: rawJob.title,
    company: null, // filled in by the caller, who already knows the company name
    location: locationText || null,
    country,
    city,
    department,
    employmentType: "Unknown", // Greenhouse's public API doesn't expose this field
    experience: null,
    salary: null,
    remote: isRemote(locationText),
    // rawJob.content is raw HTML (job description) since we requested
    // ?content=true above — we store it as-is; stripping/sanitizing HTML
    // is a frontend display concern, not a normalization concern.
    description: rawJob.content || "",
    applyUrl: rawJob.absolute_url,
    source: careerUrl,
    ats: "greenhouse",
    postedDate: safeParseDate(rawJob.updated_at),
    scrapedAt: new Date(),
  };
}

/**
 * The main exported function every provider must expose: given the
 * original career URL and a company name, return an array of normalized jobs.
 * This exact function signature — (careerUrl, companyName) => normalized jobs[] —
 * is the "contract" every future provider (Lever, Workday, etc.) will also follow.
 */
async function fetchGreenhouseJobs(careerUrl, companyName) {
  const boardToken = extractBoardToken(careerUrl);

  if (!boardToken) {
    // We can't proceed without a token — this isn't a network failure,
    // it's a logic error (this URL doesn't actually look like a Greenhouse
    // board URL at all), so we throw a clear, specific error rather than
    // silently returning an empty array, which would be misleading.
    throw new Error(
      `Could not extract Greenhouse board token from URL: ${careerUrl}`,
    );
  }

  try {
    const rawJobs = await fetchRawJobs(boardToken);

    // .map() transforms every element of an array via a callback, returning
    // a brand-new array of the same length — the perfect tool for
    // "run this exact transformation on every raw job."
    const normalizedJobs = rawJobs.map((rawJob) => {
      const job = normalizeJob(rawJob, careerUrl);
      job.company = companyName; // fill in the company name we already know
      return job;
    });

    logger.info(
      `Greenhouse: fetched ${normalizedJobs.length} jobs for board "${boardToken}"`,
    );

    return normalizedJobs;
  } catch (error) {
    logger.error(
      `Greenhouse fetch failed for board "${boardToken}": ${error.message}`,
    );
    throw error; // re-throw: the caller (a service, later) decides how to handle it
  }
}

export default fetchGreenhouseJobs;
export { extractBoardToken, normalizeJob }; // exported individually too, for testing
