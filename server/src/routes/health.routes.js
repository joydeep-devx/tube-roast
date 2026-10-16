import { Router } from 'express'
import { getDatabaseStatus } from '../config/database.js'

export const healthRouter = Router()

// Lets you (and later a hosting platform) check that the server is up and can reach the database.
healthRouter.get('/', (req, res) => {
  res.json({
    status: 'ok',
    database: getDatabaseStatus(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})
