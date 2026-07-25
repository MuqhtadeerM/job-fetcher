import connectDB from "./database/connect.js";
import { createOrUpdateJob, findJobs } from "./repositories/jobRepository.js";

(async () => {
  await connectDB();

  const result1 = await createOrUpdateJob({
    title: "Backend Engineer",
    company: "Repo Test Co",
    applyUrl: "https://example.com/jobs/repo-test-1",
    source: "https://example.com/careers",
    ats: "generic",
  });
  console.log("First call — isNew should be true:", result1.isNew);

  const result2 = await createOrUpdateJob({
    title: "Backend Engineer (Updated Title)",
    company: "Repo Test Co",
    applyUrl: "https://example.com/jobs/repo-test-1", // same applyUrl
    source: "https://example.com/careers",
    ats: "generic",
  });
  console.log("Second call — isNew should be false:", result2.isNew);
  console.log('Title should now say "Updated Title":', result2.job.title);

  const { jobs, total } = await findJobs({ company: "repo test" });
  console.log(
    `Found ${total} job(s) matching filter, case-insensitive partial match.`,
  );

  process.exit(0);
})();
