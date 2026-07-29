import express from "express";
import {
  start,
  stop,
  status,
  trackCompany,
} from "../controllers/schedulerController.js";
import validate from "../middlewares/validate.js";
import {
  addCompanyBodySchema,
  startSchedulerBodySchema,
} from "../validators/companyValidators.js";
import requireAuth from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/start",
  requireAuth,
  validate(startSchedulerBodySchema, "body"),
  start,
);
router.post("/stop", requireAuth, stop);
router.get("/status", status);

// Not strictly in your original endpoint list under /api/scheduler, but
// the scheduler needs SOME way to know which companies to track — this
// is the natural home for it since it's directly scheduler-related data.
router.post(
  "/companies",
  requireAuth,
  validate(addCompanyBodySchema, "body"),
  trackCompany,
);

export default router;
