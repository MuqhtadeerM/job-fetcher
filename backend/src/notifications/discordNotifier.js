import axios from "axios";
import config from "../config/env.js";
import logger from "../utils/logger.js";

const REQUEST_TIMEOUT_MS = 8000;

/**
 * Sends a plain-text message to a configured Discord channel via webhook.
 * Every notifier in this folder exposes the SAME shape: an async `send(message)`
 * function returning a boolean — this uniformity is what lets
 * notificationService call any of them identically, without knowing which
 * platform it's actually talking to.
 */
async function send(message) {
  if (!config.discordWebhookUrl) {
    // Not configured — this isn't an error, it just means the user hasn't
    // set up Discord notifications. We return false (not sent) rather
    // than throwing, so notificationService can distinguish "not
    // configured, skipped" from "configured but genuinely failed."
    return { sent: false, reason: "Discord webhook not configured" };
  }

  try {
    // Discord's webhook API expects a JSON body with a "content" field
    // containing the message text — this exact shape is specific to
    // Discord; Slack's shape (below) is different, which is precisely
    // why each platform needs its own notifier file.
    await axios.post(
      config.discordWebhookUrl,
      { content: message },
      { timeout: REQUEST_TIMEOUT_MS },
    );
    return { sent: true };
  } catch (error) {
    logger.error(`Discord notification failed: ${error.message}`);
    return { sent: false, reason: error.message };
  }
}

export default { send };
