import app from "./app.js";
import config from "./config/env.js";
import connectDB from "./database/connect.js";
import logger from "./utils/logger.js";

(async () => {
  await connectDB();
  app.listen(config.port, () => {
    logger.info(
      `Server is running in ${config.nodeEnv} mode on port ${config.port}`,
    );
  });
})();
