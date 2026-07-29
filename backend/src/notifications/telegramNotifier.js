import axios from "axios";
import config from "../config/env.js";
import logger from "../utils/logger.js";

const REQUEST_TIMEOUT_MS = 8000;

async function send(message) {
  // Telegram needs BOTH pieces of config — a bot token AND a chat ID —
  // unlike Discord/Slack's single webhook URL. We check both explicitly
  // and report which is actually missing, rather than a vague "not configured."
  if (!config.telegramBotToken || !config.telegramChatId) {
    return {
      sent: false,
      reason: "Telegram bot token or chat ID not configured",
    };
  }

  try {
    // Telegram's Bot API is a REST API, not a fixed webhook URL — the
    // token is embedded directly in the URL path itself, a pattern
    // specific to how Telegram's bot API is designed.
    const url = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;

    await axios.post(
      url,
      {
        chat_id: config.telegramChatId,
        text: message,
      },
      { timeout: REQUEST_TIMEOUT_MS },
    );

    return { sent: true };
  } catch (error) {
    logger.error(`Telegram notification failed: ${error.message}`);
    return { sent: false, reason: error.message };
  }
}

export default { send };
