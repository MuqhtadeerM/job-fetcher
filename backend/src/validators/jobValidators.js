import Joi from "joi";

// Joi.object({...}) defines the shape of a valid object. Each key describes
// the type and constraints for that field. This schema describes what a
// valid QUERY STRING looks like for GET /api/jobs (e.g. ?page=2&limit=20).
const getJobsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  company: Joi.string().trim().allow("").optional(),
  country: Joi.string().trim().allow("").optional(),
  city: Joi.string().trim().allow("").optional(),
  department: Joi.string().trim().allow("").optional(),
  employmentType: Joi.string()
    .valid(
      "Full-time",
      "Part-time",
      "Contract",
      "Internship",
      "Temporary",
      "Unknown",
    )
    .optional(),
  ats: Joi.string()
    .valid(
      "greenhouse",
      "lever",
      "workday",
      "ashby",
      "smartrecruiters",
      "recruitee",
      "teamtailor",
      "bamboohr",
      "generic",
    )
    .optional(),
  remote: Joi.boolean().optional(),
  keyword: Joi.string().trim().allow("").optional(),
});

// Schema for GET /api/jobs/:id — validates the URL PARAMETER, not a query string.
const jobIdParamSchema = Joi.object({
  // Joi's built-in hex validator matches MongoDB's 24-character ObjectId format.
  // This catches a malformed ID (e.g. "abc123") BEFORE it ever reaches Mongoose,
  // which would otherwise throw a much less friendly internal cast error.
  id: Joi.string().hex().length(24).required().messages({
    "string.hex": "Invalid job ID format",
    "string.length": "Invalid job ID format",
  }),
});

// Schema for POST /api/jobs/filter — same filter fields as above, but this
// time coming from a JSON request BODY rather than a query string, since
// POST requests conventionally carry their payload in the body.
const filterJobsBodySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  company: Joi.string().trim().allow("").optional(),
  country: Joi.string().trim().allow("").optional(),
  city: Joi.string().trim().allow("").optional(),
  department: Joi.string().trim().allow("").optional(),
  employmentType: Joi.string()
    .valid(
      "Full-time",
      "Part-time",
      "Contract",
      "Internship",
      "Temporary",
      "Unknown",
    )
    .optional(),
  ats: Joi.string()
    .valid(
      "greenhouse",
      "lever",
      "workday",
      "ashby",
      "smartrecruiters",
      "recruitee",
      "teamtailor",
      "bamboohr",
      "generic",
    )
    .optional(),
  remote: Joi.boolean().optional(),
  keyword: Joi.string().trim().allow("").optional(),
});

const fetchCompanyBodySchema = Joi.object({
  careerUrl: Joi.string().uri().required().messages({
    "string.uri": "careerUrl must be a valid URL",
    "any.required": "careerUrl is required",
  }),
  companyName: Joi.string().trim().min(1).required().messages({
    "any.required": "companyName is required",
  }),
});

export {
  getJobsQuerySchema,
  jobIdParamSchema,
  filterJobsBodySchema,
  fetchCompanyBodySchema,
};
