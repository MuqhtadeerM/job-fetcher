import axios from "axios";
import { splitLocation, safeParseDate } from "../services/normalizer.js";
import logger from "../utils/logger.js";

const REQUEST_TIMEOUT_MS = 10000;

/**
 * Extracts the Lever company slug from a career URL, e.g.
 *   https://jobs.lever.co/netflix        -> netflix
 *   https://jobs.lever.co/netflix/senior -> netflix
 */
function extractCompanySlug(careerUrl) {
  const match = careerUrl.match(/lever\.co\/([a-zA-Z0-9_-]+)(?:\/|$)/);
  return match ? match[1] : null;
}

/**
 * Maps Lever's `workplaceType` field directly to our boolean `remote` field.
 * Lever gives us a real structured value here, unlike Greenhouse, which
 * forced us to guess from free-text location strings (Step 9's isRemote()).
 * When a source gives you a reliable structured signal, prefer it over
 * text-guessing — text-guessing is a fallback for when nothing better exists.
 */
function isRemoteFromWorkplaceType(workplaceType) {
  return workplaceType === "remote";
}

/**
 * Maps Lever's `commitment` field (e.g. "Full-time", "Part-time") onto
 * our schema's employmentType enum. Lever's values happen to already
 * match our enum strings closely, but we still validate against our
 * own known list rather than trusting the source blindly — an external
 * API changing its wording shouldn't silently produce an enum violation
 * that crashes the save.
 */
function mapEmploymentType(commitment) {
  const known = [
    "Full-time",
    "Part-time",
    "Contract",
    "Internship",
    "Temporary",
  ];
  return known.includes(commitment) ? commitment : "Unknown";
}

async function fetchRawJobs(companySlug) {
  const url = `https://api.lever.co/v0/postings/${companySlug}?mode=json`;
  const response = await axios.get(url, { timeout: REQUEST_TIMEOUT_MS });
  // Lever's response is a plain array directly (unlike Greenhouse's
  // { jobs: [...] } wrapper object) — always check the actual shape of
  // each API's response rather than assuming every provider looks alike.
  return response.data || [];
}

function normalizeJob(rawJob, careerUrl) {
  // Lever nests location-related fields under `categories`.
  const locationText = rawJob.categories?.location || "";
  const { city, country } = splitLocation(locationText);

  return {
    title: rawJob.text, // Lever calls the job title field "text", not "title"
    company: null, // filled in by the caller, same pattern as Greenhouse
    location: locationText || null,
    country,
    city,
    department: rawJob.categories?.team || null,
    employmentType: mapEmploymentType(rawJob.categories?.commitment),
    experience: null,
    salary: null,
    remote: isRemoteFromWorkplaceType(rawJob.workplaceType),
    description: rawJob.descriptionPlain || "",
    applyUrl: rawJob.hostedUrl || rawJob.applyUrl,
    source: careerUrl,
    ats: "lever",
    postedDate: safeParseDate(rawJob.createdAt),
    scrapedAt: new Date(),
  };
}

async function fetchLeverJobs(careerUrl, companyName) {
  const companySlug = extractCompanySlug(careerUrl);

  if (!companySlug) {
    throw new Error(
      `Could not extract Lever company slug from URL: ${careerUrl}`,
    );
  }

  try {
    const rawJobs = await fetchRawJobs(companySlug);

    const normalizedJobs = rawJobs.map((rawJob) => {
      const job = normalizeJob(rawJob, careerUrl);
      job.company = companyName;
      return job;
    });

    logger.info(
      `Lever: fetched ${normalizedJobs.length} jobs for company "${companySlug}"`,
    );

    return normalizedJobs;
  } catch (error) {
    logger.error(
      `Lever fetch failed for company "${companySlug}": ${error.message}`,
    );
    throw error;
  }
}

export default fetchLeverJobs;
export { extractCompanySlug, normalizeJob };
