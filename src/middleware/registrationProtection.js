import rateLimit from "express-rate-limit";
import User from "../models/User.js";

// Rate limiting for registration - very strict
const registrationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Maximum 3 registration attempts per IP per 15 minutes
  message: {
    error: "Too many registration attempts",
    message: "Please wait 15 minutes before trying to register again",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Track IP addresses that have registered recently
const registrationIPs = new Map();

// Clean up old IP entries every hour
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [ip, timestamp] of registrationIPs.entries()) {
    if (timestamp < oneHourAgo) {
      registrationIPs.delete(ip);
    }
  }
}, 60 * 60 * 1000);

// Email validation removed for testing purposes

// IP-based registration protection
export const ipRegistrationProtection = async (req, res, next) => {
  try {
    const clientIP =
      req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

    // Check if this IP has registered recently (within last hour)
    if (registrationIPs.has(clientIP)) {
      const lastRegistration = registrationIPs.get(clientIP);
      const timeSinceLastRegistration = Date.now() - lastRegistration;
      const oneHour = 60 * 60 * 1000;

      if (timeSinceLastRegistration < oneHour) {
        return res.status(429).json({
          error: "Registration blocked",
          message:
            "This IP address has already registered recently. Please wait before creating another account.",
        });
      }
    }

    // Check how many accounts exist from this IP (if we track IPs in user model)
    // This is optional - you'd need to add an IP field to your User model
    const recentRegistrations = await User.countDocuments({
      registrationIP: clientIP,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
    });

    if (recentRegistrations >= 2) {
      return res.status(429).json({
        error: "Registration blocked",
        message: "Too many accounts created from this IP address recently.",
      });
    }

    // Store this registration attempt
    registrationIPs.set(clientIP, Date.now());

    // Add IP to request for potential storage in user model
    req.registrationIP = clientIP;

    next();
  } catch (error) {
    console.error("IP registration protection error:", error);
    next(); // Continue if there's an error
  }
};

// Email validation removed for testing purposes

// Combine all protection middleware
export const registrationProtection = [
  registrationRateLimit,
  ipRegistrationProtection,
];

export default registrationProtection;
