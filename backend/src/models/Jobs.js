import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true, // automatically strips leading/trailing whitespace on save
    },
    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    location: {
      type: String,
      default: null, // explicit default when a provider can't determine it
      trim: true,
    },
    country: {
      type: String,
      default: null,
      trim: true,
    },
    city: {
      type: String,
      default: null,
      trim: true,
    },
    department: {
      type: String,
      default: null,
      trim: true,
    },
    employmentType: {
      type: String,
      // enum restricts the value to exactly one of these strings.
      // 'Unknown' is included deliberately: many ATS sources don't expose
      // this field at all, and we'd rather store an explicit "Unknown"
      // than leave it null and have every filter/query special-case null.
      enum: [
        "Full-time",
        "Part-time",
        "Contract",
        "Internship",
        "Temporary",
        "Unknown",
      ],
      default: "Unknown",
    },
    experience: {
      type: String,
      default: null,
    },
    salary: {
      type: String,
      default: null,
    },
    remote: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      default: "",
    },
    applyUrl: {
      type: String,
      required: [true, "Apply URL is required"],
      // `unique: true` tells MongoDB to build a unique index on this field —
      // the database itself will reject any attempt to insert a second
      // document with the same applyUrl. This is our primary duplicate-
      // detection mechanism: the same job posting URL should never exist twice.
      unique: true,
      trim: true,
    },
    source: {
      type: String, // the original career page URL the user provided
      required: true,
    },
    ats: {
      type: String,
      enum: [
        "greenhouse",
        "lever",
        "workday",
        "ashby",
        "smartrecruiters",
        "recruitee",
        "teamtailor",
        "bamboohr",
        "generic",
      ],
      required: true,
    },
    postedDate: {
      type: Date,
      default: null, // some sources don't expose an original posting date
    },
    scrapedAt: {
      type: Date,
      default: Date.now, // when THIS record was fetched, set automatically if not provided
    },
  },
  {
    // Mongoose automatically adds and maintains createdAt/updatedAt fields
    // for us — createdAt is set once on insert, updatedAt refreshes on every save.
    // This gives us a free audit trail without writing any extra code.
    timestamps: true,
  },
);

// Compound index (an index across MULTIPLE fields together) to speed up
// our most common query pattern: filtering jobs by company. We'll be
// querying "all jobs for company X" constantly (dashboard views, filters),
// so indexing `company` (and `ats`, often queried alongside it) makes
// those lookups fast even as the collection grows to hundreds of thousands
// # of documents, instead of MongoDB scanning every document every time.
jobSchema.index({ company: 1, ats: 1 });

// mongoose.model(name, schema) registers this schema under the name 'Job'.
// Mongoose will automatically look for (or create) a MongoDB collection
// named 'jobs' (lowercased, pluralized) to store these documents.
const Job = mongoose.model("Job", jobSchema);

export default Job;
