import { saveSession } from '../config/session.js'
import { normalizeActivity } from './youtubeActivity.js'

/**
 * Fetches and normalizes the signed-in user's YouTube activity (use after requireYouTube).
 * If Google has rejected the token (e.g. revoked from the Google account page), forgets it first.
 */
export async function loadYouTubeActivity(req, youtubeClient) {
  try {
    return normalizeActivity(await youtubeClient.fetchActivity(req.youtubeAccessToken))
  } catch (error) {
    if (error.code === 'YOUTUBE_NOT_CONNECTED') {
      delete req.session.youtubeConnection
      await saveSession(req)
    }
    throw error
  }
}
