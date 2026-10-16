import express from 'express'
import helmet from 'helmet'
import { createSessionMiddleware } from './config/session.js'
import { createAuthController } from './controllers/auth.controller.js'
import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'
import { createAuthRateLimiter } from './middleware/rateLimit.js'
import { createRequireAuth } from './middleware/requireAuth.js'
import { verifyOrigin } from './middleware/verifyOrigin.js'
import { createAuthRouter } from './routes/auth.routes.js'
import { healthRouter } from './routes/health.routes.js'

/**
 * Builds the Express app without starting a server, so tests can send it requests in memory.
 *
 * Dependencies are passed in rather than imported: server.js passes the real Google client,
 * MongoDB-backed services and session store; tests pass fakes and an in-memory store.
 *
 * Middleware order matters: requests flow top to bottom, errors skip ahead to errorHandler.
 */
export function createApp({ config, googleAuth, userService, sessionStore }) {
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

  app.use('/api/health', healthRouter)
  app.use(
    '/api/auth',
    createAuthRouter({
      controller: authController,
      requireAuth: createRequireAuth(userService),
      rateLimiter: createAuthRateLimiter(),
    }),
  )

  app.use(notFound)
  app.use(errorHandler)

  return app
}
