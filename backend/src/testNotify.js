import {
  notifyNewJobs,
  notifyAll,
} from "./notifications/notificationService.js";

(async () => {
  const results = await notifyAll("Test message from Universal Job Fetcher 🚀");
  console.log("notifyAll results:", results);

  await notifyNewJobs("Test Company", 5);
})();
