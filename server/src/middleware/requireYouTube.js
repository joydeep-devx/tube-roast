import { getActiveYouTubeConnection } from '../services/youtubeConnection.js'
import { AppError } from '../utils/AppError.js'

// Use after requireAuth. Puts the access token on req.youtubeAccessToken for the controller only.
export function requireYouTube(req, res, next) {
  const connection = getActiveYouTubeConnection(req.session)
  if (!connection) {
    throw new AppError(401, 'Connect your YouTube account to continue.', { code: 'YOUTUBE_NOT_CONNECTED' })
  }

  req.youtubeAccessToken = connection.accessToken
  next()
}
