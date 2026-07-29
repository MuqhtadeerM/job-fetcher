import {
  registerUser,
  loginUser,
  generateToken,
} from "../services/authService.js";
import logger from "../utils/logger.js";

async function register(req, res, next) {
  try {
    const { email, password } = req.validated.body;
    const user = await registerUser({ email, password });
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      token,
      user: { id: user._id, email: user.email, role: user.role },
    });
  } catch (error) {
    if (error.message === "EMAIL_ALREADY_REGISTERED") {
      return res
        .status(409)
        .json({ success: false, error: "Email is already registered" });
    }
    logger.error(`register failed: ${error.message}`);
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.validated.body;
    const { user, token } = await loginUser({ email, password });

    return res.status(200).json({
      success: true,
      token,
      user: { id: user._id, email: user.email, role: user.role },
    });
  } catch (error) {
    if (error.message === "INVALID_CREDENTIALS") {
      // 401 Unauthorized — deliberately vague message, matching the
      // deliberately-vague error from authService above.
      return res
        .status(401)
        .json({ success: false, error: "Invalid email or password" });
    }
    logger.error(`login failed: ${error.message}`);
    return next(error);
  }
}

export { register, login };
