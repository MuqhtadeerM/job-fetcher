import { verifyToken } from "../services/authService.js";

/**
 * Protects a route: requires a valid JWT in the Authorization header.
 * Same higher-order-function shape as validate.js from Step 7 — this
 * IS middleware itself (no wrapping call needed), since it doesn't need
 * any per-route configuration like validate() does with a schema.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  // Expected format: "Authorization: Bearer <token>"
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "Missing or malformed Authorization header",
    });
  }

  // .slice(7) strips off the literal "Bearer " prefix (7 characters
  // including the space), leaving just the token itself.
  const token = authHeader.slice(7);

  try {
    const decoded = verifyToken(token);
    // We attach the decoded payload to req.user — a new convention,
    // just like req.validated from Step 7 — so any downstream
    // controller can read req.user.userId / req.user.role.
    req.user = decoded;
    next();
  } catch (error) {
    // jwt.verify() throws for BOTH an invalid signature and an expired
    // token — we don't need to distinguish these for the client, a
    // clean 401 is the correct response either way.
    return res
      .status(401)
      .json({ success: false, error: "Invalid or expired token" });
  }
}

export default requireAuth;
