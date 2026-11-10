import rateLimit from 'express-rate-limit'

const rateLimitOptions = {
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again later.',
  },
}

const loginRateLimiter = rateLimit(rateLimitOptions)
const registrationRateLimiter = rateLimit(rateLimitOptions)

export { loginRateLimiter, registrationRateLimiter }
