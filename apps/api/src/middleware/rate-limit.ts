import { rateLimit } from "express-rate-limit";

export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window per IP
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests. Please try again later.",
    },
  },
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Max 15 attempts per 15 minutes
  skipSuccessfulRequests: true, // Don't count successful requests
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "AUTH_RATE_LIMIT_EXCEEDED",
      message: "Too many login/refresh attempts. Try again in 15 minutes.",
    },
  },
});
