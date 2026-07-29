import axios from "axios";
import * as cheerio from "cheerio";
import {
  isRemote,
  splitLocation,
  safeParseDate,
} from "../services/normalizer.js";
import logger from "../utils/logger.js";
import { fetchRenderedHtml } from "../services/browserService.js";

const REQUEST_TIMEOUT_MS = 10000;

async function fetchHtml(careerUrl) {
  const response = await axios.get(careerUrl, {
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    },
  });
  return response.data;
}

/**
 * TIER 2: Looks for schema.org JobPosting data embedded as JSON-LD.
 * Returns an array of raw JobPosting objects found, or an empty array
 * if none exist on this page.
 */
function extractJsonLdJobPostings($) {
  const jobPostings = [];

  // $('script[type="application/ld+json"]') selects every script tag
  // with that exact type attribute — this is the standard way structured
  // data is embedded in HTML for search engines to read.
  $('script[type="application/ld+json"]').each((_, element) => {
    // .each()'s callback receives (index, element) — we don't need the
    // index here, so we name it `_` by convention, signaling "intentionally
    // unused" to anyone reading the code.
    const rawText = $(element).contents().text();

    try {
      const parsed = JSON.parse(rawText);

      // JSON-LD can appear as a single object, an array of objects, or
      // wrapped in a "@graph" array — we normalize all three shapes into
      // one flat array to check uniformly.
      const candidates = Array.isArray(parsed)
        ? parsed
        : parsed["@graph"]
          ? parsed["@graph"]
          : [parsed];

      for (const candidate of candidates) {
        // schema.org identifies the type of structured data via "@type".
        if (candidate["@type"] === "JobPosting") {
          jobPostings.push(candidate);
        }
      }
    } catch (error) {
      // Malformed JSON-LD on someone else's website is common and not
      // our problem to fix — skip this block and keep checking others,
      // rather than letting one bad script tag abort the whole scrape.
      logger.warn(`Skipping malformed JSON-LD block: ${error.message}`);
    }
  });

  return jobPostings;
}

/**
 * Normalizes ONE schema.org JobPosting object into our Job schema shape.
 */
function normalizeFromJsonLd(posting, careerUrl, companyName) {
  // schema.org's JobPosting nests location under jobLocation.address,
  // itself following the schema.org PostalAddress format.
  const address = posting.jobLocation?.address;
  const locationText = address
    ? [address.addressLocality, address.addressRegion, address.addressCountry]
        .filter(Boolean) // removes any missing pieces (undefined/null/empty)
        .join(", ")
    : "";
  const { city, country } = splitLocation(locationText);

  return {
    title: posting.title,
    company: companyName,
    location: locationText || null,
    country,
    city,
    department: null, // schema.org JobPosting has no direct equivalent
    employmentType: posting.employmentType || "Unknown",
    experience: null,
    salary: null,
    remote: posting.jobLocationType === "TELECOMMUTE" || isRemote(locationText),
    description: posting.description || "",
    applyUrl: posting.url || careerUrl,
    source: careerUrl,
    ats: "generic",
    postedDate: safeParseDate(posting.datePosted),
    scrapedAt: new Date(),
  };
}

/**
 * TIER 3: Heuristic HTML scraping using Cheerio. Looks for anchor tags
 * that look like links to individual job postings. This is a best-effort
 * guess, not a guaranteed-correct parse — real career page markup varies
 * enormously between companies.
 */
function scrapeJobLinksHeuristically($, careerUrl) {
  const jobs = [];
  // A Set (not an array) automatically prevents duplicate entries — many
  // career pages link to the same job posting more than once on one page
  // (e.g. in a "Featured Jobs" section AND the main listing).
  const seenUrls = new Set();

  $("a").each((_, element) => {
    const href = $(element).attr("href");
    const text = $(element).text().trim();

    if (!href || !text) return; // skip links with no URL or no visible text

    // A simple heuristic: does the link's URL path suggest it points to
    // a specific job posting? Real career pages very commonly include
    // one of these words in job detail page URLs.
    const looksLikeJobLink = /\/(job|jobs|position|opening|career)s?\//i.test(
      href,
    );

    if (!looksLikeJobLink) return;

    // Resolve relative URLs (e.g. "/jobs/123") into absolute ones
    // (e.g. "https://company.com/jobs/123") using careerUrl as the base —
    // the built-in URL class handles this correctly regardless of how
    // the relative path is written.
    const absoluteUrl = new URL(href, careerUrl).toString();

    if (seenUrls.has(absoluteUrl)) return; // duplicate, skip
    seenUrls.add(absoluteUrl);

    jobs.push({
      title: text,
      company: null,
      location: null,
      country: null,
      city: null,
      department: null,
      employmentType: "Unknown",
      experience: null,
      salary: null,
      remote: isRemote(text), // only signal available at this tier is the link text itself
      description: "",
      applyUrl: absoluteUrl,
      source: careerUrl,
      ats: "generic",
      postedDate: null,
      scrapedAt: new Date(),
    });
  });

  return jobs;
}

async function fetchGenericJobs(careerUrl, companyName) {
  try {
    const html = await fetchHtml(careerUrl);
    const $ = cheerio.load(html);

    const jsonLdPostings = extractJsonLdJobPostings($);
    if (jsonLdPostings.length > 0) {
      logger.info(
        `Generic (JSON-LD): found ${jsonLdPostings.length} job postings for "${companyName}"`,
      );
      return jsonLdPostings.map((posting) =>
        normalizeFromJsonLd(posting, careerUrl, companyName),
      );
    }

    logger.warn(
      `Generic: no JSON-LD found for "${companyName}", trying heuristic HTML scraping`,
    );
    const scrapedJobs = scrapeJobLinksHeuristically($, careerUrl);

    // NEW: only reach for Puppeteer if the cheaper tiers found NOTHING.
    // This is the concrete enforcement of "never use Puppeteer unless required" —
    // it's structurally the LAST thing we try, not a parallel option.
    if (scrapedJobs.length > 0) {
      scrapedJobs.forEach((job) => {
        job.company = companyName;
      });
      logger.info(
        `Generic (HTML heuristic): found ${scrapedJobs.length} candidate job links for "${companyName}"`,
      );
      return scrapedJobs;
    }

    logger.warn(
      `Generic: no jobs found via HTML parsing for "${companyName}", falling back to Puppeteer`,
    );
    const renderedHtml = await fetchRenderedHtml(careerUrl);
    const $rendered = cheerio.load(renderedHtml);

    // Re-run BOTH cheaper extraction strategies against the rendered HTML —
    // a JS-rendered page might still embed JSON-LD once fully loaded, so
    // we don't skip straight to heuristic scraping on the rendered version.
    const renderedJsonLd = extractJsonLdJobPostings($rendered);
    if (renderedJsonLd.length > 0) {
      logger.info(
        `Generic (Puppeteer + JSON-LD): found ${renderedJsonLd.length} job postings for "${companyName}"`,
      );
      return renderedJsonLd.map((posting) =>
        normalizeFromJsonLd(posting, careerUrl, companyName),
      );
    }

    const renderedScrapedJobs = scrapeJobLinksHeuristically(
      $rendered,
      careerUrl,
    );
    renderedScrapedJobs.forEach((job) => {
      job.company = companyName;
    });
    logger.info(
      `Generic (Puppeteer + HTML heuristic): found ${renderedScrapedJobs.length} candidate job links for "${companyName}"`,
    );
    return renderedScrapedJobs;
  } catch (error) {
    logger.error(
      `Generic provider failed for "${companyName}": ${error.message}`,
    );
    throw error;
  }
}

export default fetchGenericJobs;
export {
  extractJsonLdJobPostings,
  normalizeFromJsonLd,
  scrapeJobLinksHeuristically,
};
