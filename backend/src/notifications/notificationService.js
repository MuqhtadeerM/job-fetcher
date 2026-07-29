import discordNotifier from "./discordNotifier.js";
import slackNotifier from "./slackNotifier.js";
import logger from "../utils/logger.js";
import telegramNotifier from "./telegramNotifier.js";
import emailNotifier from "./emailNotifier.js";

// The notification registry — exactly the same pattern as Step 10's
// providerRegistry, just for a different domain. Adding Telegram/Email
// later will mean adding one entry here, nothing else in the app changes.
const notifiers = {
  discord: discordNotifier,
  slack: slackNotifier,
  telegram: telegramNotifier,
  email: emailNotifier,
};

/**
 * Sends a message to EVERY configured channel. Channels that aren't
 * configured are silently skipped (not an error). Channels that ARE
 * configured but fail to send are logged individually — one channel's
 * failure never prevents another channel from being attempted.
 */
// notifyAll() and notifyNewJobs() below are COMPLETELY UNCHANGED from
// Step 15 — this is the concrete proof, again, that the registry pattern
// insulates the rest of the app from exactly this kind of growth.

async function notifyAll(message) {
  const results = {};
  for (const [channelName, notifier] of Object.entries(notifiers)) {
    const result = await notifier.send(message);
    results[channelName] = result;
    if (result.sent) {
      logger.info(`Notification sent via ${channelName}`);
    } else {
      logger.warn(
        `Notification skipped/failed via ${channelName}: ${result.reason}`,
      );
    }
  }
  return results;
}

/**
 * Builds a human-readable message specifically for "new jobs found" events,
 * and sends it through every configured channel. This is the function the
 * scheduler will actually call — it knows about "new job" semantics;
 * notifyAll() above stays generic and reusable for any future message type.
 */
async function notifyNewJobs(companyName, newJobsCount) {
  if (newJobsCount <= 0) return; // nothing to announce

  const message = `🔔 ${newJobsCount} new job${newJobsCount > 1 ? "s" : ""} found at ${companyName}!`;
  return notifyAll(message);
}

export { notifyAll, notifyNewJobs };
