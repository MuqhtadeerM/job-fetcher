import connectDB from "./database/connect.js";
import Job from "./models/Job.js";

(async () => {
  await connectDB();
  const job = await Job.create({
    title: "Test Software Engineer",
    company: "Test Co",
    applyUrl: "https://example.com/jobs/12345",
    source: "https://example.com/careers",
    ats: "generic",
  });
  console.log("Created job:", job);
  process.exit(0);
})();
