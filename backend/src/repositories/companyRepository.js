import Company from "../models/Company.js";

async function addCompany({ name, careerUrl }) {
  // findOneAndUpdate + upsert, same pattern as Step 6's createOrUpdateJob —
  // if this careerUrl is already tracked, this call is harmless/idempotent
  // rather than throwing a duplicate-key error.
  return Company.findOneAndUpdate(
    { careerUrl },
    { $set: { name, careerUrl, isActive: true } },
    { upsert: true, returnDocument: "after", runValidators: true },
  );
}

async function getActiveCompanies() {
  return Company.find({ isActive: true });
}

async function updateLastFetched(companyId, { lastKnownAts } = {}) {
  const update = { lastFetchedAt: new Date() };
  if (lastKnownAts) update.lastKnownAts = lastKnownAts;

  return Company.findByIdAndUpdate(
    companyId,
    { $set: update },
    { returnDocument: "after" },
  );
}

async function setActive(companyId, isActive) {
  return Company.findByIdAndUpdate(
    companyId,
    { $set: { isActive } },
    { returnDocument: "after" },
  );
}

export { addCompany, getActiveCompanies, updateLastFetched, setActive };
