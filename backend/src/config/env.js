import dotenv from "dotenv";

dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV | "development",
  mongoUri: process.env.MONGO_URI,
  logLevel: process.env.LOG_LEVEL | "info",
};

export default config;
