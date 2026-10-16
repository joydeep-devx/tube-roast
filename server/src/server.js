import { createApp } from './app.js'
import { loadEnv } from './config/env.js'

let env
try {
  env = loadEnv()
} catch (error) {
  console.error(error.message)
  process.exit(1)
}

const app = createApp()

const server = app.listen(env.PORT, () => {
  console.log(`TubeRoast API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`)
})

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${env.PORT} is already in use. Stop the other process or set a different PORT.`)
  } else {
    console.error('Server failed to start:', error)
  }
  process.exit(1)
})

// Finish in-flight requests before exiting (Ctrl+C locally, SIGTERM from hosting platforms).
function shutdown(signal) {
  console.log(`${signal} received, shutting down...`)
  server.close(() => process.exit(0))
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
