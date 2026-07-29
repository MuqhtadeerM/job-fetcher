import {
  startScheduler,
  stopScheduler,
  getSchedulerStatus,
} from "../services/schedulerService.js";
import { addCompany } from "../repositories/companyRepository.js";
import logger from "../utils/logger.js";

async function start(req, res, next) {
  try {
    const { cronExpression } = req.validated.body;
    const result = startScheduler(cronExpression);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    logger.error(`Scheduler start failed: ${error.message}`);
    // An invalid cron expression is a client input problem, not a
    // server crash — 400, not 500.
    return res.status(400).json({ success: false, error: error.message });
  }
}

async function stop(req, res, next) {
  const result = stopScheduler();
  return res.status(200).json({ success: true, ...result });
}

async function status(req, res, next) {
  const result = getSchedulerStatus();
  return res.status(200).json({ success: true, ...result });
}

async function trackCompany(req, res, next) {
  try {
    const { name, careerUrl } = req.validated.body;
    const company = await addCompany({ name, careerUrl });
    return res.status(200).json({ success: true, data: company });
  } catch (error) {
    logger.error(`trackCompany failed: ${error.message}`);
    return next(error);
  }
}

export { start, stop, status, trackCompany };
