import { AppError } from '../utils/AppError.js'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * CSRF defence in depth (on top of SameSite=Lax cookies): browsers always send an Origin header
 * on cross-site POST/PUT/DELETE, so a request from another site's page is rejected here.
 * Requests without Origin (curl, server-to-server) can't carry a victim's cookies via a browser, so they pass.
 */
export function verifyOrigin(allowedOrigin) {
  return function checkOrigin(req, res, next) {
    const origin = req.get('origin')

    if (!SAFE_METHODS.has(req.method) && origin && origin !== allowedOrigin) {
      throw new AppError(403, 'Request origin not allowed')
    }

    next()
  }
}
