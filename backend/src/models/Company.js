import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    careerUrl: {
      type: String,
      required: [true, "Career URL is required"],
      unique: true, // don't track the same company/URL twice
      trim: true,
    },
    // We cache the last known ATS/confidence here so future scheduler
    // runs don't necessarily need to re-run full detection every time —
    // useful groundwork, even though we'll still re-detect for now and
    // revisit caching properly as a later optimization.
    lastKnownAts: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true, // companies are tracked by default once added
    },
    lastFetchedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

const Company = mongoose.model("Company", companySchema);

export default Company;
