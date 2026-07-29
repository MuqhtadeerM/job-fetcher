import Joi from "joi";

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  // A real minimum length requirement — this is validation, not security
  // by itself, but it stops obviously-too-weak passwords at the door.
  password: Joi.string().min(8).required().messages({
    "string.min": "Password must be at least 8 characters",
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export { registerSchema, loginSchema };
