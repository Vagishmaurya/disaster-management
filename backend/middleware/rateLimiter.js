const rateLimit = require("express-rate-limit")
const logger = require("../utils/logger")

// Create different rate limiters for different endpoints
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for ${req.ip} on ${req.path}`, {
        ip: req.ip,
        path: req.path,
        action: "rate_limit_exceeded",
      })
      res.status(429).json({ error: message })
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === "/health" || req.path === "/"
    },
  })
}

// General API rate limiter
const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  "Too many requests from this IP, please try again later.",
)

// Strict rate limiter for resource-intensive operations
const strictLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  10, // limit each IP to 10 requests per minute
  "Too many requests for this operation, please try again later.",
)

// Very strict limiter for AI operations
const aiLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  5, // limit each IP to 5 requests per minute
  "Too many AI requests, please try again later.",
)

module.exports = {
  general: generalLimiter,
  strict: strictLimiter,
  ai: aiLimiter,
}
