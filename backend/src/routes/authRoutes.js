import express from 'express';
import { register, login } from '../controllers/authController.js';
import validate from '../middlewares/validate.js';
import { registerSchema, loginSchema } from '../validators/authValidators.js';

const router = express.Router();

router.post('/register', validate(registerSchema, 'body'), register);
router.post('/login', validate(loginSchema, 'body'), login);

export default router;