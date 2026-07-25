async function createOrUpdateJob(jobData) {
  //   filter: which document to look for — here, matching on applyUrl,
  //           our unique natural key from Step 5.
  //   update: the data to set on that document if found (or created).
  //   options: behavior flags, explained below line-by-line.
  const existingJob = await Job.findOne({ applyUrl: jobData.applyUrl });

  const job = await Job.findOneAndUpdate(
    { applyUrl: jobData.applyUrl },
    { $set: jobData },
    {
      // upsert: true — if no document matches the filter, INSERT a new one
      // using the update data instead of doing nothing. This is what turns
      // this single call into "create OR update," atomically, in one
      // database round-trip.
      upsert: true,
      // new: true — return the document AFTER the update/insert is applied,
      // not the old (pre-update) version. Without this, on an update you'd
      // get back the stale data from before your changes were applied.
      new: true,
      // runValidators: true — Mongoose does NOT run schema validation
      // (required fields, enum checks, etc.) on findOneAndUpdate by default,
      // only on .save()/.create(). We must explicitly opt in, or a provider
      // bug could silently save an invalid job straight through this path.
      runValidators: true,
    },
  );

  return {
    job,
    isNew: existingJob === null, // if there was nothing before, this job is brand new
  };
}

/**
 * Retrieves jobs matching a set of filter criteria, with pagination.
 * `filters` is a plain object built by the caller (controller/service) —
 * this function's only responsibility is translating it into a Mongo query.
 */
async function findJobs(filters = {}, { page = 1, limit = 20 } = {}) {
  const query = {};

  // Each `if` below only adds a condition to the query if the caller
  // actually provided that filter — we never want to accidentally filter
  // on `undefined`, which could unintentionally exclude everything.
  if (filters.company) {
    // $regex with 'i' option = case-insensitive partial match,
    // so filtering by "google" also matches "Google" or "Google LLC".
    query.company = { $regex: filters.company, $options: "i" };
  }
  if (filters.country) {
    query.country = { $regex: filters.country, $options: "i" };
  }
  if (filters.city) {
    query.city = { $regex: filters.city, $options: "i" };
  }
  if (filters.department) {
    query.department = { $regex: filters.department, $options: "i" };
  }
  if (filters.employmentType) {
    query.employmentType = filters.employmentType;
  }
  if (filters.ats) {
    query.ats = filters.ats;
  }
  if (typeof filters.remote === "boolean") {
    query.remote = filters.remote;
  }
  if (filters.keyword) {
    // $or means: match if EITHER condition is true — search the keyword
    // against both title and description fields.
    query.$or = [
      { title: { $regex: filters.keyword, $options: "i" } },
      { description: { $regex: filters.keyword, $options: "i" } },
    ];
  }

  // Pagination math: page 1 should skip 0 documents, page 2 should skip
  // `limit` documents, page 3 should skip `2 * limit`, and so on.
  const skip = (page - 1) * limit;

  // We run both queries in parallel with Promise.all — .find() to get the
  // actual page of documents, and .countDocuments() to get the total count
  // matching the filter (needed so the frontend can show "Page 1 of 12").
  // Running them in parallel instead of one after another (sequentially)
  // saves real time, since neither query depends on the other's result.
  const [jobs, total] = await Promise.all([
    Job.find(query)
      .sort({ scrapedAt: -1 }) // -1 = newest scraped jobs first
      .skip(skip)
      .limit(limit),
    Job.countDocuments(query),
  ]);

  return { jobs, total, page, limit };
}

/**
 * Retrieves a single job by its MongoDB _id.
 */
async function findJobById(id) {
  return Job.findById(id);
}

export { createOrUpdateJob, findJobs, findJobById };
