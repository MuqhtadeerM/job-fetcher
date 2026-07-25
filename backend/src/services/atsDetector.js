import axios from "axios";
import ATS_SIGNATURES from "../config/atsSignatures.js";
import logger from "../utils/logger.js";

// How long we'll wait for the target career page to respond before giving up.
// Without a timeout, a slow/unresponsive site could hang this request
// indefinitely, blocking whatever called detectATS().
const REQUEST_TIMEOUT_MS = 10000;

/**
 * Attempts to identify the ATS purely from the URL's hostname — no network call.
 */
function detectByHostname(careerUrl) {
  // The built-in URL class safely parses a URL string into its components
  // (protocol, hostname, pathname, etc.) — far more reliable than trying
  // to write our own regex to extract the hostname from a raw string.
  const hostname = new URL(careerUrl).hostname.toLowerCase();

  // Object.entries() turns { greenhouse: {...}, lever: {...} } into
  // [['greenhouse', {...}], ['lever', {...}]] — an array of [key, value]
  // pairs we can loop over with a standard for...of loop.
  for (const [ats, signature] of Object.entries(ATS_SIGNATURES)) {
    // .some() returns true if AT LEAST ONE element in the array satisfies
    // the callback's condition — we only need one matching fragment to
    // confidently identify the ATS.
    const matched = signature.hostnameIncludes.some((fragment) =>
      hostname.includes(fragment),
    );
    if (matched) {
      return ats;
    }
  }

  return null; // no hostname match found
}

/**
 * Attempts to identify the ATS by searching the page's raw HTML for
 * known vendor fingerprints.
 */
function detectByHtml(html) {
  const lowerHtml = html.toLowerCase();

  for (const [ats, signature] of Object.entries(ATS_SIGNATURES)) {
    const matched = signature.htmlIncludes.some((fragment) =>
      lowerHtml.includes(fragment.toLowerCase()),
    );
    if (matched) {
      return ats;
    }
  }

  return null;
}

/**
 * The main exported function: given any career page URL, determine which
 * ATS is powering it, and how confident we are in that determination.
 */
async function detectATS(careerUrl) {
  // Step 1: try the free, instant check first.
  const hostnameMatch = detectByHostname(careerUrl);
  if (hostnameMatch) {
    return { ats: hostnameMatch, confidence: "high", method: "hostname" };
  }

  // Step 2: fall back to fetching the actual page and inspecting its HTML.
  try {
    const response = await axios.get(careerUrl, {
      timeout: REQUEST_TIMEOUT_MS,
      headers: {
        // Many sites block requests that don't look like they're coming
        // from a real browser (axios's default User-Agent openly says
        // "axios/1.x.x", which some servers reject outright). Presenting
        // a browser-like User-Agent significantly reduces the chance of
        // being blocked purely for looking like a bot at this stage.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
    });

    const htmlMatch = detectByHtml(response.data);
    if (htmlMatch) {
      return { ats: htmlMatch, confidence: "medium", method: "html" };
    }

    // Neither signal recognized this page — this is a genuinely
    // unknown/custom career page. Not an error, just "we don't have a
    // dedicated provider for this, use the generic scraper."
    return { ats: "generic", confidence: "low", method: "none" };
  } catch (error) {
    // The request itself failed (site down, blocked us, DNS issue, etc.)
    // We don't want detectATS() to CRASH the caller — we log the failure
    // and still return a usable result, defaulting to 'generic' with low
    // confidence, so the rest of the pipeline can decide how to proceed
    // (e.g. try Puppeteer next, which can sometimes get through where a
    // plain axios request gets blocked).
    logger.error(`ATS detection failed for ${careerUrl}: ${error.message}`);
    return {
      ats: "generic",
      confidence: "low",
      method: "error",
      error: error.message,
    };
  }
}

export default detectATS;
