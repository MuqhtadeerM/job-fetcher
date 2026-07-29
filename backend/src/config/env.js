import dotenv from "dotenv";
dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGO_URI,
  logLevel: process.env.LOG_LEVEL || "info",
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL || null,
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || null,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || null,
  telegramChatId: process.env.TELEGRAM_CHAT_ID || null,
  smtp: {
    host: process.env.SMTP_HOST || null,
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || null,
    pass: process.env.SMTP_PASS || null,
  },
  notifyEmailTo: process.env.NOTIFY_EMAIL_TO || null,
};

// Variables the app CANNOT function without, regardless of environment.
// Notification channels are intentionally excluded here — those are
// optional features, not core requirements (Step 15/16 already treat
// missing webhook/SMTP config as a normal, non-fatal state).
const REQUIRED_IN_ALL_ENVS = ["mongoUri"];

function validateConfig() {
  const missing = REQUIRED_IN_ALL_ENVS.filter((key) => !config[key]);

  if (missing.length > 0) {
    // We deliberately use console.error here, NOT our logger — this
    // check runs at the very top of the module, before we can even be
    // sure logger.js itself initialized cleanly. Keeping this dependency-free
    // avoids a confusing secondary failure if something upstream is broken.
    console.error(
      `FATAL: Missing required environment variables: ${missing.join(", ")}`,
    );
    process.exit(1);
  }
}

validateConfig();

export default config;
