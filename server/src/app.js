import express from 'express'
import helmet from 'helmet'
import { createSessionMiddleware } from './config/session.js'
import { createAuthController } from './controllers/auth.controller.js'
import { createRoastController } from './controllers/roast.controller.js'
import { createYouTubeController } from './controllers/youtube.controller.js'
import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'
import { createAuthRateLimiter, createRoastRateLimiter } from './middleware/rateLimit.js'
import { createRequireAuth } from './middleware/requireAuth.js'
import { verifyOrigin } from './middleware/verifyOrigin.js'
import { createAuthRouter } from './routes/auth.routes.js'
import { healthRouter } from './routes/health.routes.js'
import { createRoastRouter } from './routes/roast.routes.js'
import { createYouTubeRouter } from './routes/youtube.routes.js'

/**
 * Builds the Express app without starting a server, so tests can send it requests in memory.
 *
 * Dependencies are passed in rather than imported: server.js passes the real Google, YouTube and LLM
 * clients, MongoDB-backed services and session store; tests pass fakes and an in-memory store.
 *
 * Middleware order matters: requests flow top to bottom, errors skip ahead to errorHandler.
 */
export function createApp({
  config,
  googleAuth,
  youtubeClient,
  roastGenerator,
  roastService,
  userService,
  sessionStore,
  roastRateLimiter = createRoastRateLimiter(),
}) {
  const app = express()

  // Security headers, and removes the X-Powered-By header that advertises Express.
  app.use(helmet())
  // Parses JSON bodies. The small limit stops oversized payloads from tying up the server.
  app.use(express.json({ limit: '10kb' }))
  app.use(
    createSessionMiddleware({ secret: config.sessionSecret, store: sessionStore, isProduction: config.isProduction }),
  )
  app.use(verifyOrigin(config.clientUrl))

  const authController = createAuthController({
    googleAuth,
    userService,
    clientUrl: config.clientUrl,
    isProduction: config.isProduction,
  })

  const requireAuth = createRequireAuth(userService)
  // One limiter shared by every route that redirects to Google.
  const oauthRateLimiter = createAuthRateLimiter()

  app.use('/api/health', healthRouter)
  app.use('/api/auth', createAuthRouter({ controller: authController, requireAuth, rateLimiter: oauthRateLimiter }))
  app.use(
    '/api/youtube',
    createYouTubeRouter({
      controller: createYouTubeController({ googleAuth, youtubeClient }),
      requireAuth,
      rateLimiter: oauthRateLimiter,
    }),
  )

  app.use(
    '/api/roasts',
    createRoastRouter({
      controller: createRoastController({ youtubeClient, roastGenerator, roastService }),
      requireAuth,
      roastRateLimiter,
    }),
  )

  app.use(notFound)
  app.use(errorHandler)

  return app
}
