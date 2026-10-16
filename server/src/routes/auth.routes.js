import { Router } from 'express'

export function createAuthRouter({ controller, requireAuth, rateLimiter }) {
  const router = Router()

  router.get('/google', rateLimiter, controller.startGoogleSignIn)
  router.get('/google/callback', rateLimiter, controller.handleGoogleCallback)
  router.get('/me', requireAuth, controller.getCurrentUser)
  router.post('/logout', controller.logout)

  return router
}
