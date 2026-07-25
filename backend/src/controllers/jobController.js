import { findJobs, findJobById } from "../repositories/jobRepository.js";
import logger from "../utils/logger.js";

// Note: by the time these controller functions run, validation middleware
// (Step above) has ALREADY confirmed req.query/req.params/req.body are
// well-formed. Controllers here never re-validate — that would duplicate
// responsibility that belongs to the validation layer.

async function getJobs(req, res) {
  try {
    // req.query has already been validated AND transformed by Joi
    // (defaults applied, types coerced) thanks to our validate() middleware.
    const { page, limit, ...filters } = req.query;

    const result = await findJobs(filters, { page, limit });

    res.status(200).json({
      success: true,
      total: result.total,
      page: result.page,
      limit: result.limit,
      count: result.jobs.length,
      data: result.jobs,
    });
  } catch (error) {
    logger.error(`getJobs failed: ${error.message}`);
    res.status(500).json({ success: false, error: "Failed to fetch jobs" });
  }
}

async function getJobById(req, res) {
  try {
    const job = await findJobById(req.params.id);

    if (!job) {
      // A well-formed ID that simply doesn't match any document —
      // this is a legitimate 404, distinct from a 400 validation error.
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    res.status(200).json({ success: true, data: job });
  } catch (error) {
    logger.error(`getJobById failed: ${error.message}`);
    res.status(500).json({ success: false, error: "Failed to fetch job" });
  }
}

async function filterJobs(req, res) {
  try {
    const { page, limit, ...filters } = req.body;

    const result = await findJobs(filters, { page, limit });

    res.status(200).json({
      success: true,
      total: result.total,
      page: result.page,
      limit: result.limit,
      count: result.jobs.length,
      data: result.jobs,
    });
  } catch (error) {
    logger.error(`filterJobs failed: ${error.message}`);
    res.status(500).json({ success: false, error: "Failed to filter jobs" });
  }
}

export { getJobs, getJobById, filterJobs };
