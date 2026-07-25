import fetchGreenhouseJobs from "./providers/greenhouseProvider.js";

(async () => {
  const jobs = await fetchGreenhouseJobs(
    "https://boards.greenhouse.io/airbnb",
    "Airbnb",
  );
  console.log(`Fetched ${jobs.length} jobs`);
  console.log("First job sample:", jobs[0]);
})();
