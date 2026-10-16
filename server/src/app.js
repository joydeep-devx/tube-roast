import express from 'express'
import helmet from 'helmet'
import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'
import { healthRouter } from './routes/health.routes.js'

/**
 * Builds the Express app without starting a server, so tests can send it requests in memory.
 * Middleware order matters: requests flow top to bottom, errors skip ahead to errorHandler.
 */
export function createApp() {
  const app = express()

  // Security headers, and removes the X-Powered-By header that advertises Express.
  app.use(helmet())
  // Parses JSON bodies. The small limit stops oversized payloads from tying up the server.
  app.use(express.json({ limit: '10kb' }))

  app.use('/api/health', healthRouter)

  app.use(notFound)
  app.use(errorHandler)

  return app
}
