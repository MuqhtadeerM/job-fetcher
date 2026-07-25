import config from "../config/env.js";
import logger from "../utils/logger.js";
import mongoose from "mongoose";

// time we will try to connect to db
const MAX_RETRIES = 5;

// how log to wait  in ms
const RETRY_DELAY_MS = 5000;

// A small helper to return a promise which resolve after ms and
// settimeout normally takes a callback and wrapping it in a promise lets us
// await inside async function instead of nesting callback
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// connect to db
async function connectDB(attempt = 1) {
  try {
    // mongoose.connect opens connection using uri from our config
    // we await it if it is successed then code below runs and next
    // if it fails it throws and we jump to the catch block instead
    await mongoose.connect(config.mongoUri);

    logger.info("MongoDB connect successfully");
  } catch (error) {
    logger.error(`Mongodb connection ${attempt} failed: ${error.message}`);

    // if our retires max then it shows this error
    if (attempt >= MAX_RETRIES) {
      logger.error("Max retries reached. Existing process.");
      process.exit(1);
    }

    logger.warn(`Retrying MongoDB connection in ${RETRY_DELAY_MS / 1000}s...`);

    await sleep(RETRY_DELAY_MS);

    // recursive call : try again and increament the attempt
    return connectDB(attempt + 1);
  }
}

// for shutdown this function called when it process is asked to terminate.

async function disconnectDB() {
  await mongoose.connect.close();
  logger.info("MongoDB connection closed gracefully");
}

//           Docker, and container orchestrators like Kubernetes during a
//           redeploy or scale-down.
process.on("SIGINT", async () => {
  await disconnectDB();
  process.exit(0); // 0 = clean, intentional exit
});

process.on("SIGTERM", async () => {
  await disconnectDB();
  process.exit(0);
});

export default connectDB;
