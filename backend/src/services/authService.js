import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import config from "../config/env.js";

// The "cost factor" for bcrypt — how many hashing rounds to perform.
// Higher = slower to compute = harder to brute-force, but also slower
// for legitimate logins. 10-12 is the standard, widely-recommended
// range balancing security and real-world login speed.
const SALT_ROUNDS = 12;

async function registerUser({ email, password }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    // A specific, deliberate error the controller can catch and map
    // to a 409 Conflict — distinct from an unexpected server error.
    throw new Error("EMAIL_ALREADY_REGISTERED");
  }

  // bcrypt.hash() does the salting AND hashing in one call — you never
  // need to generate or store a salt separately; it's embedded directly
  // inside the resulting hash string itself.
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({ email: email.toLowerCase(), passwordHash });
  return user;
}

async function loginUser({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Deliberately the SAME error for "no such user" and "wrong password"
    // below — never reveal to an attacker WHICH part was wrong, since
    // that would let them enumerate valid registered emails.
    throw new Error("INVALID_CREDENTIALS");
  }

  // bcrypt.compare() hashes the SUBMITTED password using the same salt
  // embedded in the STORED hash, then checks if the results match —
  // this is the only correct way to check a password against a bcrypt
  // hash; there is no "decrypt" operation, because hashing isn't encryption.
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const token = generateToken(user);
  return { user, token };
}

function generateToken(user) {
  // jwt.sign(payload, secret, options) creates a signed token.
  // The payload is data WE choose to embed — here just enough to
  // identify the user later (id, role), never anything sensitive
  // like the password hash itself, since JWT payloads are only
  // SIGNED, not encrypted — anyone holding the token can decode and
  // read this payload, even though they can't forge or alter it.
  return jwt.sign({ userId: user._id, role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

function verifyToken(token) {
  // jwt.verify() checks the signature AND expiry in one call. It throws
  // if the token is invalid, expired, or tampered with — we deliberately
  // let that throw propagate to the middleware's own try/catch, rather
  // than swallowing it here.
  return jwt.verify(token, config.jwtSecret);
}

export { registerUser, loginUser, generateToken, verifyToken };
