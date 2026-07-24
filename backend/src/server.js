import app from "./app.js";
import config from "./config/env.js";

app.listen(config.port, () => {
  console.log(
    `Server is running in ${config.nodeEnv} mode on port ${config.port}`,
  );
});
