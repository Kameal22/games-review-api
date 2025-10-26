import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import User from "../models/User.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().min(1).max(50).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function signToken(user) {
  const secret = process.env.JWT_SECRET || "dev-insecure-secret";
  return jwt.sign({ sub: user._id.toString(), role: user.role }, secret, {
    expiresIn: "12h",
  });
}

export async function register(req, res, next) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Invalid input", issues: parsed.error.issues });
    }
    const { email, password, displayName } = parsed.data;

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ message: "Email is already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      passwordHash,
      displayName: displayName || email.split("@")[0],
      registrationIP: req.registrationIP, // Store IP for abuse prevention
    });

    const token = signToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ message: "Email is already registered" });
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Invalid input", issues: parsed.error.issues });
    }

    const { email, password } = parsed.data;
    const user = await User.findOne({ email });
    // Use a generic error to avoid user enumeration
    const INVALID = () =>
      res.status(401).json({ message: "Invalid email or password" });

    if (!user) return INVALID();

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return INVALID();

    const token = signToken(user);
    res.json({ user, token });
  } catch (err) {
    next(err);
  }
}
