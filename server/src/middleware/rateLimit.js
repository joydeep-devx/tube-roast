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
