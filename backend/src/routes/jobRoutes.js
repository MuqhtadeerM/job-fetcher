import express from "express";
import {
  getJobs,
  getJobById,
  filterJobs,
  fetchCompanyJobs,
} from "../controllers/jobController.js";
import validate from "../middlewares/validate.js";
import {
  getJobsQuerySchema,
  jobIdParamSchema,
  filterJobsBodySchema,
  fetchCompanyBodySchema,
} from "../validators/jobValidators.js";
import requireAuth from "../middlewares/authMiddleware.js";

// express.Router() creates a mini, self-contained router instance —
// a "mini app" that only knows about job-related routes. We'll mount this
// onto the main app under a prefix (e.g. /api/jobs) in app.js, rather than
// hardcoding that prefix inside this file, so this router stays reusable
// and this file doesn't need to know its own final mounted path.
const router = express.Router();

// Route registration reads left-to-right: for THIS path and method,
// run these middleware functions in order, left to right.
// validate(schema, 'query') runs FIRST, and only if it calls next()
// does getJobs actually execute.
router.get("/", validate(getJobsQuerySchema, "query"), getJobs);

router.get("/:id", validate(jobIdParamSchema, "params"), getJobById);

router.post("/filter", validate(filterJobsBodySchema, "body"), filterJobs);

router.post(
  "/company",
  requireAuth,
  validate(fetchCompanyBodySchema, "body"),
  fetchCompanyJobs,
);

export default router;
