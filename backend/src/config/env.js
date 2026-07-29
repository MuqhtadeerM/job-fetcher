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

export default config;
