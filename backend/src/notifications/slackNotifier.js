import axios from "axios";
import config from "../config/env.js";
import logger from "../utils/logger.js";

const REQUEST_TIMEOUT_MS = 8000;

async function send(message) {
  if (!config.slackWebhookUrl) {
    return { sent: false, reason: "Slack webhook not configured" };
  }

  try {
    // Slack's incoming webhook format uses a "text" field, not "content" —
    // a small but concrete example of why a shared generic notifier
    // couldn't work here; each platform genuinely has its own contract.
    await axios.post(
      config.slackWebhookUrl,
      { text: message },
      { timeout: REQUEST_TIMEOUT_MS },
    );
    return { sent: true };
  } catch (error) {
    logger.error(`Slack notification failed: ${error.message}`);
    return { sent: false, reason: error.message };
  }
}

export default { send };
