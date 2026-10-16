import { Router } from 'express'

export const healthRouter = Router()

// Lets you (and later a hosting platform) check that the server is up.
healthRouter.get('/', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})
