import { buildRoastProfile } from '../analysis/buildRoastProfile.js'
import { loadYouTubeActivity } from '../services/loadYouTubeActivity.js'
import { FETCH_LIMITS } from '../services/youtubeClient.js'
import { AppError } from '../utils/AppError.js'

const SNAPSHOT_TOP_CHANNELS = 3

// The fields the browser receives. No userId, no model internals.
export function toPublicRoast(roast) {
  return {
    id: roast.id,
    headline: roast.headline,
    roast: roast.roast,
    verdict: roast.verdict,
    snapshot: {
      totals: roast.snapshot.totals,
      topChannels: roast.snapshot.topChannels,
      traits: roast.snapshot.traits,
    },
    createdAt: roast.createdAt,
  }
}

const notFound = () => new AppError(404, 'Roast not found', { code: 'ROAST_NOT_FOUND' })

export function createRoastController({ youtubeClient, roastGenerator, roastService }) {
  return {
    // POST /api/roasts: fetch fresh YouTube data → analyze → ask the LLM → validate → save.
    async createRoast(req, res) {
      const activity = await loadYouTubeActivity(req, youtubeClient)
      const profile = buildRoastProfile(activity, { limits: FETCH_LIMITS })
      const generated = await roastGenerator.generate(profile)

      const saved = await roastService.createRoast({
        userId: req.user.id,
        headline: generated.headline,
        roast: generated.roast,
        verdict: generated.verdict,
        model: generated.model,
        snapshot: {
          totals: profile.totals,
          topChannels: profile.topChannels.slice(0, SNAPSHOT_TOP_CHANNELS),
          traits: profile.traits,
        },
      })

      res.status(201).json({ roast: toPublicRoast(saved) })
    },

    // GET /api/roasts: the signed-in user's roasts, newest first.
    async listRoasts(req, res) {
      const roasts = await roastService.listRoasts(req.user.id)
      res.json({ roasts: roasts.map(toPublicRoast) })
    },

    // GET /api/roasts/:id: 404 for missing roasts AND other users' roasts, so IDs can't be probed.
    async getRoast(req, res) {
      const roast = await roastService.findRoast(req.user.id, req.params.id)
      if (!roast) throw notFound()
      res.json({ roast: toPublicRoast(roast) })
    },

    // DELETE /api/roasts/:id
    async deleteRoast(req, res) {
      const deleted = await roastService.deleteRoast(req.user.id, req.params.id)
      if (!deleted) throw notFound()
      res.status(204).end()
    },
  }
}
