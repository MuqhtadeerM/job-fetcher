import { findJobs, findJobById } from "../repositories/jobRepository.js";
import logger from "../utils/logger.js";

// Note: by the time these controller functions run, validation middleware
// (Step above) has ALREADY confirmed req.query/req.params/req.body are
// well-formed. Controllers here never re-validate — that would duplicate
// responsibility that belongs to the validation layer.

async function getJobs(req, res, next) {
  try {
    const { page, limit, ...filters } = req.validated.query;
    const result = await findJobs(filters, { page, limit });

    return res.status(200).json({
      success: true,
      total: result.total,
      page: result.page,
      limit: result.limit,
      count: result.jobs.length,
      data: result.jobs,
    });
  } catch (error) {
    logger.error(`getJobs failed: ${error.message}`);
    return next(error);
  }
}

async function getJobById(req, res, next) {
  try {
    const job = await findJobById(req.validated.params.id);

    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    return res.status(200).json({ success: true, data: job });
  } catch (error) {
    logger.error(`getJobById failed: ${error.message}`);
    return next(error);
  }
}


async function filterJobs(req, res, next) {
  try {
    const { page, limit, ...filters } = req.validated.body;
    const result = await findJobs(filters, { page, limit });

    return res.status(200).json({
      success: true,
      total: result.total,
      page: result.page,
      limit: result.limit,
      count: result.jobs.length,
      data: result.jobs,
    });
  } catch (error) {
    logger.error(`filterJobs failed: ${error.message}`);
    return next(error);
  }
}

export { getJobs, getJobById, filterJobs };
