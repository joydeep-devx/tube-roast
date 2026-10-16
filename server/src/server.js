import { createApp } from './app.js'
import { connectToDatabase, disconnectFromDatabase, redactConnectionString } from './config/database.js'
import { loadEnv } from './config/env.js'
import { createSessionStore } from './config/session.js'
import { createNvidiaProvider } from './llm/nvidiaProvider.js'
import { createRoastGenerator } from './roast/roastGenerator.js'
import { createGoogleAuth } from './services/googleAuth.js'
import { roastService } from './services/roastService.js'
import { createYouTubeClient } from './services/youtubeClient.js'
import { userService } from './services/userService.js'

let env
try {
  env = loadEnv()
} catch (error) {
  console.error(error.message)
  process.exit(1)
}

try {
  await connectToDatabase(env.MONGO_URI)
  console.log('Connected to MongoDB')
} catch (error) {
  console.error(`Could not connect to MongoDB: ${redactConnectionString(error.message)}`)
  console.error('Check MONGO_URI in server/.env and that your IP is allowed in Atlas Network Access.')
  process.exit(1)
}

const app = createApp({
  config: {
    clientUrl: env.CLIENT_URL,
    sessionSecret: env.SESSION_SECRET,
    isProduction: env.NODE_ENV === 'production',
  },
  googleAuth: createGoogleAuth({
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    redirectUri: env.GOOGLE_REDIRECT_URI,
  }),
  youtubeClient: createYouTubeClient(),
  roastGenerator: createRoastGenerator({
    provider: createNvidiaProvider({ apiKey: env.NVIDIA_API_KEY, model: env.NVIDIA_MODEL }),
  }),
  roastService,
  userService,
  sessionStore: createSessionStore({ secret: env.SESSION_SECRET }),
})

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

// Finish in-flight requests, then close the database (Ctrl+C locally, SIGTERM from hosting platforms).
function shutdown(signal) {
  console.log(`${signal} received, shutting down...`)
  server.close(async () => {
    await disconnectFromDatabase()
    process.exit(0)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
