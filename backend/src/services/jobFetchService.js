import detectATS from "./atsDetector.js";
import { getProvider } from "./providerRegistry.js";
import { createOrUpdateJob } from "../repositories/jobRepository.js";
import logger from "../utils/logger.js";

/**
 * The main orchestrator: given a career URL and a company name, runs the
 * ENTIRE pipeline from your original spec — detect, fetch, normalize
 * (normalization happens inside each provider), save, and return a summary.
 */
async function fetchJobsForCompany(careerUrl, companyName) {
  // STEP 1: Detect which ATS this company uses.
  const detection = await detectATS(careerUrl);
  logger.info(
    `Detected ATS "${detection.ats}" for ${companyName} (confidence: ${detection.confidence}, method: ${detection.method})`,
  );

  // STEP 2: Look up the correct provider for that ATS.
  const provider = getProvider(detection.ats);

  // STEP 3 + 4: Fetch raw jobs AND normalize them — both happen inside
  // the provider itself (Step 9's fetchGreenhouseJobs already does both).
  // We wrap this in its own try/catch, separate from the save loop below,
  // so we can distinguish "fetching failed entirely" (nothing to save)
  // from "fetching succeeded, but saving some jobs failed" (partial success).
  let normalizedJobs;
  try {
    normalizedJobs = await provider(careerUrl, companyName);
  } catch (error) {
    logger.error(`Fetching jobs failed for ${companyName}: ${error.message}`);
    // We return a structured failure result instead of throwing further —
    // the controller calling this function should get a predictable shape
    // back regardless of success or failure, and decide the HTTP response itself.
    return {
      success: false,
      company: companyName,
      ats: detection.ats,
      confidence: detection.confidence,
      error: error.message,
      totalFetched: 0,
      newJobs: 0,
      updatedJobs: 0,
      failedJobs: 0,
    };
  }

  // STEP 5: Save each normalized job via the repository (upsert logic
  // from Step 6), tracking how many were new vs. already-existing updates.
  let newJobs = 0;
  let updatedJobs = 0;
  let failedJobs = 0;

  // We deliberately use a plain for...of loop here instead of
  // `Promise.all(normalizedJobs.map(...))`. Why NOT the parallel approach
  // we used back in Step 6's findJobs? Because here, each iteration writes
  // to the database — running potentially hundreds of concurrent writes at
  // once against MongoDB is a real risk (connection pool exhaustion, write
  // contention). Sequential writes are slightly slower but far safer for
  // a batch of database WRITES specifically (reads are a different story,
  // which is why Promise.all was fine in Step 6).
  for (const jobData of normalizedJobs) {
    try {
      const { isNew } = await createOrUpdateJob(jobData);
      if (isNew) {
        newJobs += 1;
      } else {
        updatedJobs += 1;
      }
    } catch (error) {
      // ONE malformed job (e.g. missing a required field due to a provider
      // bug) should not abort the entire batch — we log it, count it as
      // failed, and continue processing the rest.
      failedJobs += 1;
      logger.error(
        `Failed to save job "${jobData.title}" (${jobData.applyUrl}): ${error.message}`,
      );
    }
  }

  logger.info(
    `${companyName}: ${normalizedJobs.length} fetched, ${newJobs} new, ${updatedJobs} updated, ${failedJobs} failed`,
  );

  return {
    success: true,
    company: companyName,
    ats: detection.ats,
    confidence: detection.confidence,
    totalFetched: normalizedJobs.length,
    newJobs,
    updatedJobs,
    failedJobs,
  };
}

export default fetchJobsForCompany;
