import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    const secret = process.env.JWT_SECRET || "dev-insecure-secret";
    const payload = jwt.verify(token, secret);
    req.user = payload; // { sub, role, iat, exp }
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// If you want routes that work with/without auth:
export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) {
    try {
      const secret = process.env.JWT_SECRET || "dev-insecure-secret";
      req.user = jwt.verify(token, secret);
    } catch {
      /* ignore */
    }
  }
  next();
}

//import { requireAuth } from '../middleware/auth.js';
//router.post('/', requireAuth, createGame);
//router.patch('/:id', requireAuth, updateGame);
//router.delete('/:id', requireAuth, deleteGame); THIS IS HOW TO USE PROTECTED ROUTES
