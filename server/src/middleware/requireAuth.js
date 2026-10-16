import { destroySession } from '../config/session.js'
import { AppError } from '../utils/AppError.js'

/**
 * Lets a request through only if the session belongs to an existing user, and puts that user on req.user.
 * Ownership checks in later milestones rely on req.user, never on IDs sent by the browser.
 */
export function createRequireAuth(userService) {
  return async function requireAuth(req, res, next) {
    const userId = req.session?.userId
    if (!userId) {
      throw new AppError(401, 'Not signed in')
    }

    const user = await userService.findUserById(userId)
    if (!user) {
      // The account was deleted while the session was still alive.
      await destroySession(req)
      throw new AppError(401, 'Not signed in')
    }

    req.user = user
    next()
  }
}
