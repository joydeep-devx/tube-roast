import { buildRoastProfile } from '../analysis/buildRoastProfile.js'
import { saveSession } from '../config/session.js'
import { loadYouTubeActivity } from '../services/loadYouTubeActivity.js'
import { summarizeActivity } from '../services/youtubeActivity.js'
import { FETCH_LIMITS } from '../services/youtubeClient.js'
import {
  getActiveYouTubeConnection,
  revokeYouTubeConnection,
} from '../services/youtubeConnection.js'
import { OAUTH_FLOWS, redirectToGoogle } from './auth.controller.js'

export function createYouTubeController({ googleAuth, youtubeClient }) {
  return {
    // GET /api/youtube/connect: incremental consent for read-only YouTube access.
    async startConnection(req, res) {
      const authRequest = await googleAuth.createYouTubeAuthRequest({ loginHint: req.user.googleId })
      await redirectToGoogle(req, res, OAUTH_FLOWS.YOUTUBE, authRequest)
    },

    // GET /api/youtube/status: whether a usable connection exists. Never returns the token.
    async getStatus(req, res) {
      const connection = getActiveYouTubeConnection(req.session)
      res.json({ connected: Boolean(connection), expiresAt: connection?.expiresAt ?? null })
    },

    // GET /api/youtube/activity (behind requireYouTube): fetch, normalize, summarize, analyze. Nothing is stored.
    // `profile` is exactly what the roast generator will send to the LLM, shown to the user for transparency.
    async getActivity(req, res) {
      const activity = await loadYouTubeActivity(req, youtubeClient)
      res.json({
        ...summarizeActivity(activity),
        limits: FETCH_LIMITS,
        profile: buildRoastProfile(activity, { limits: FETCH_LIMITS }),
      })
    },

    // DELETE /api/youtube/connection
    async disconnect(req, res) {
      await revokeYouTubeConnection(req.session, googleAuth)
      await saveSession(req)
      res.status(204).end()
    },
  }
}
