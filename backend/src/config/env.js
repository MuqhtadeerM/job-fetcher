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
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
};

// jwtSecret is now required, since a missing/blank signing secret would
// be a serious security hole, not just a missing optional feature.
const REQUIRED_IN_ALL_ENVS = ["mongoUri", "jwtSecret"];

function validateConfig() {
  const missing = REQUIRED_IN_ALL_ENVS.filter((key) => !config[key]);
  if (missing.length > 0) {
    console.error(
      `FATAL: Missing required environment variables: ${missing.join(", ")}`,
    );
    process.exit(1);
  }
}

validateConfig();

export default config;
