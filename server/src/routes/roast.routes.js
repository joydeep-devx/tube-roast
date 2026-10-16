import { Router } from 'express'
import { requireYouTube } from '../middleware/requireYouTube.js'

// Every roast route needs a signed-in user; creating one also needs a YouTube connection.
export function createRoastRouter({ controller, requireAuth, roastRateLimiter }) {
  const router = Router()
  router.use(requireAuth)

  router.post('/', roastRateLimiter, requireYouTube, controller.createRoast)
  router.get('/', controller.listRoasts)
  router.get('/:id', controller.getRoast)
  router.delete('/:id', controller.deleteRoast)

  return router
}
