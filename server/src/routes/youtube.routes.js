import { Router } from 'express'
import { requireYouTube } from '../middleware/requireYouTube.js'

// Every YouTube route needs a signed-in TubeRoast user.
export function createYouTubeRouter({ controller, requireAuth, rateLimiter }) {
  const router = Router()
  router.use(requireAuth)

  router.get('/connect', rateLimiter, controller.startConnection)
  router.get('/status', controller.getStatus)
  router.get('/activity', requireYouTube, controller.getActivity)
  router.delete('/connection', controller.disconnect)

  return router
}
