import cron from "node-cron";
import fetchJobsForCompany from "./jobFetchService.js";
import {
  getActiveCompanies,
  updateLastFetched,
} from "../repositories/companyRepository.js";
import logger from "../utils/logger.js";

// Module-level variable holding the currently running cron task (or null
// if nothing is scheduled). Keeping this at module scope means it persists
// across every start/stop call made through the API, for the lifetime of
// the running Node process — exactly the behavior we want for something
// that should be toggleable on demand.
let scheduledTask = null;

/**
 * Runs one full pass: fetch jobs for every active tracked company,
 * sequentially, logging a summary at the end. This is the function the
 * cron schedule calls repeatedly — but it's also exported standalone so
 * it could be triggered manually/on-demand later if needed.
 */
async function runScheduledFetch() {
  const companies = await getActiveCompanies();
  logger.info(
    `Scheduler: starting fetch run for ${companies.length} active companies`,
  );

  const results = [];

  // Sequential, not parallel — same reasoning as Step 10's per-job save
  // loop, now applied per-company. One slow/failing company (especially
  // one that falls all the way to Puppeteer) should never block or
  // compete for resources with the others running at the same time.
  for (const company of companies) {
    try {
      const result = await fetchJobsForCompany(company.careerUrl, company.name);
      await updateLastFetched(company._id, { lastKnownAts: result.ats });
      results.push(result);
    } catch (error) {
      // A truly unexpected crash (not the orchestrator's own handled
      // success:false path, but something throwing past it) still
      // shouldn't stop the rest of the companies in this run.
      logger.error(
        `Scheduler: unexpected error fetching "${company.name}": ${error.message}`,
      );
      results.push({
        success: false,
        company: company.name,
        error: error.message,
      });
    }
  }

  const totalNew = results.reduce((sum, r) => sum + (r.newJobs || 0), 0);
  logger.info(
    `Scheduler: run complete. ${results.length} companies processed, ${totalNew} new jobs found overall.`,
  );

  return results;
}

// /**
//  * Starts the recurring schedule using the given cron expression
//  * (e.g. '*/15 * * * *' for every 15 minutes). If a schedule is already
//  * running, we stop it first — calling start() twice should replace the
//  * schedule, not stack two running schedules on top of each other.
//  */
function startScheduler(cronExpression) {
  if (scheduledTask) {
    scheduledTask.stop();
  }

  // cron.validate() checks the expression's syntax BEFORE we commit to
  // scheduling anything — catches a typo'd cron string immediately with
  // a clear error, rather than node-cron silently failing to ever fire.
  if (!cron.validate(cronExpression)) {
    throw new Error(`Invalid cron expression: "${cronExpression}"`);
  }

  // cron.schedule(expression, callback) registers a recurring task.
  // The callback runs automatically every time the schedule fires —
  // we don't call runScheduledFetch() ourselves, node-cron does.
  scheduledTask = cron.schedule(cronExpression, () => {
    // We don't await this here — cron callbacks aren't awaited by
    // node-cron itself, and runScheduledFetch() already handles its
    // own errors internally per-company, so a fire-and-forget call
    // here is safe and won't produce an unhandled rejection.
    runScheduledFetch();
  });

  logger.info(`Scheduler started with cron expression: "${cronExpression}"`);
  return { running: true, cronExpression };
}

function stopScheduler() {
  if (!scheduledTask) {
    return { running: false, message: "No scheduler was running" };
  }

  scheduledTask.stop();
  scheduledTask = null;

  logger.info("Scheduler stopped");
  return { running: false };
}

function getSchedulerStatus() {
  return { running: scheduledTask !== null };
}

export { startScheduler, stopScheduler, getSchedulerStatus, runScheduledFetch };
