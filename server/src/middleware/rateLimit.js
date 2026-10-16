import { rateLimit } from 'express-rate-limit'
import { AppError } from '../utils/AppError.js'

// Limits how often one IP can start or complete Google sign-in. Create one per app so tests stay isolated.
export function createAuthRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res, next) => {
      next(new AppError(429, 'Too many sign-in attempts. Please wait a few minutes and try again.'))
    },
  })
}

// Each roast costs YouTube quota and an LLM call. Keyed by user (use after requireAuth), not IP,
// so people sharing a network don't block each other.
export function createRoastRateLimiter({ limit = 5, windowMs = 10 * 60 * 1000 } = {}) {
  return rateLimit({
    windowMs,
    limit,
    keyGenerator: (req) => `user:${req.user.id}`,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res, next) => {
      next(
        new AppError(429, "Easy there, that's a lot of roasting. You can roast again in a few minutes.", {
          code: 'ROAST_RATE_LIMITED',
        }),
      )
    },
  })
}
