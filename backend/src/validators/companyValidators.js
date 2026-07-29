import Joi from "joi";

const addCompanyBodySchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
  careerUrl: Joi.string().uri().required(),
});

const startSchedulerBodySchema = Joi.object({
  // Defaults to every 30 minutes if the caller doesn't specify one —
  // matches the "30 minutes" option from your original spec as a
  // sensible middle-ground default.
  cronExpression: Joi.string().trim().default("*/30 * * * *"),
});

export { addCompanyBodySchema, startSchedulerBodySchema };
