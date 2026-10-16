import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRoastRateLimiter } from '../../src/middleware/rateLimit.js'
import { AppError } from '../../src/utils/AppError.js'
import {
  createFakeGoogleAuth,
  createFakeUserService,
  createTestApp,
  FAKE_ACCESS_TOKEN,
  FAKE_STATE,
  fakeProfile,
  fakeRoastOutput,
  TEST_CLIENT_URL,
  youtubeGrant,
} from '../helpers.js'

const callbackUrl = (params) => `/api/auth/google/callback?${new URLSearchParams(params)}`

// Signs in as `profile` and optionally connects YouTube, returning a cookie-keeping agent.
async function agentFor(testApp, { profile = fakeProfile, connectYouTube = true } = {}) {
  const agent = request.agent(testApp.app)
  testApp.googleAuth.exchangeCode.mockResolvedValueOnce({ ...youtubeGrant({ profile }), grantedScopes: ['openid'] })
  await agent.get('/api/auth/google')
  await agent.get(callbackUrl({ code: 'sign-in', state: FAKE_STATE }))

  if (connectYouTube) {
    await agent.get('/api/youtube/connect')
    testApp.googleAuth.exchangeCode.mockResolvedValueOnce(youtubeGrant({ profile }))
    await agent.get(callbackUrl({ code: 'youtube', state: FAKE_STATE }))
  }
  return agent
}

describe('roast routes', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('require sign-in', async () => {
    const { app } = createTestApp()
    for (const [method, path] of [
      ['post', '/api/roasts'],
      ['get', '/api/roasts'],
      ['get', '/api/roasts/roast1'],
      ['delete', '/api/roasts/roast1'],
    ]) {
      expect((await request(app)[method](path)).status, `${method.toUpperCase()} ${path}`).toBe(401)
    }
  })

  describe('POST /api/roasts', () => {
    it('requires a YouTube connection', async () => {
      const testApp = createTestApp()
      const agent = await agentFor(testApp, { connectYouTube: false })

      const res = await agent.post('/api/roasts')

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('YOUTUBE_NOT_CONNECTED')
      expect(testApp.roastGenerator.generate).not.toHaveBeenCalled()
    })

    it('analyzes fresh YouTube data, generates a roast and saves it for this user', async () => {
      const testApp = createTestApp()
      const agent = await agentFor(testApp)

      const res = await agent.post('/api/roasts').set('Origin', TEST_CLIENT_URL)

      expect(res.status).toBe(201)
      expect(testApp.youtubeClient.fetchActivity).toHaveBeenCalledWith(FAKE_ACCESS_TOKEN)
      // The generator receives the analyzed profile, not raw YouTube items.
      const [profileArg] = testApp.roastGenerator.generate.mock.calls[0]
      expect(profileArg).toMatchObject({ totals: { likedVideos: 2, subscriptions: 1, playlists: 1 }, traits: expect.any(Array) })
      expect(JSON.stringify(profileArg)).not.toMatch(/vid1|vid2|Test Viewer/)

      expect(res.body.roast).toEqual({
        id: expect.any(String),
        headline: fakeRoastOutput.headline,
        roast: fakeRoastOutput.roast,
        verdict: fakeRoastOutput.verdict,
        snapshot: {
          totals: { likedVideos: 2, subscriptions: 1, playlists: 1 },
          topChannels: expect.any(Array),
          traits: expect.any(Array),
        },
        createdAt: expect.any(String),
      })
      expect(res.text).not.toContain(FAKE_ACCESS_TOKEN)
      expect(res.body.roast).not.toHaveProperty('userId')
    })

    it('passes user-facing generation errors through with their code', async () => {
      const testApp = createTestApp()
      testApp.roastGenerator.generate.mockRejectedValueOnce(
        new AppError(502, 'The AI fumbled the punchline. Please try again.', { code: 'ROAST_FAILED', expose: true }),
      )
      const agent = await agentFor(testApp)

      const res = await agent.post('/api/roasts')

      expect(res.status).toBe(502)
      expect(res.body.error).toEqual({ message: 'The AI fumbled the punchline. Please try again.', code: 'ROAST_FAILED' })
      expect(testApp.roastService.roasts).toHaveLength(0)
    })

    it('rate limits each user separately', async () => {
      const testApp = createTestApp({ roastRateLimiter: createRoastRateLimiter({ limit: 2 }) })
      const alice = await agentFor(testApp)
      const bob = await agentFor(testApp, { profile: { ...fakeProfile, googleId: '222222222222222222222' } })

      await alice.post('/api/roasts').expect(201)
      await alice.post('/api/roasts').expect(201)
      const limited = await alice.post('/api/roasts')

      expect(limited.status).toBe(429)
      expect(limited.body.error.code).toBe('ROAST_RATE_LIMITED')
      await bob.post('/api/roasts').expect(201)
    })

    it('rejects a roast request from another site (CSRF)', async () => {
      const testApp = createTestApp()
      const agent = await agentFor(testApp)

      const res = await agent.post('/api/roasts').set('Origin', 'https://evil.example')

      expect(res.status).toBe(403)
      expect(testApp.roastGenerator.generate).not.toHaveBeenCalled()
    })
  })

  describe('reading and deleting roasts', () => {
    // Two users sharing one app (and one fake database).
    async function twoUsersWithRoasts() {
      const testApp = createTestApp({ googleAuth: createFakeGoogleAuth(), userService: createFakeUserService() })
      const alice = await agentFor(testApp)
      const bob = await agentFor(testApp, { profile: { ...fakeProfile, googleId: '222222222222222222222', displayName: 'Bob' } })
      const aliceRoast = (await alice.post('/api/roasts')).body.roast
      const bobRoast = (await bob.post('/api/roasts')).body.roast
      return { testApp, alice, bob, aliceRoast, bobRoast }
    }

    it('lists only your own roasts', async () => {
      const { alice, aliceRoast } = await twoUsersWithRoasts()

      const res = await alice.get('/api/roasts')

      expect(res.status).toBe(200)
      expect(res.body.roasts.map((roast) => roast.id)).toEqual([aliceRoast.id])
    })

    it('returns your roast by ID', async () => {
      const { alice, aliceRoast } = await twoUsersWithRoasts()

      const res = await alice.get(`/api/roasts/${aliceRoast.id}`)

      expect(res.status).toBe(200)
      expect(res.body.roast.headline).toBe(aliceRoast.headline)
    })

    it("returns 404 (not 403) for someone else's roast, so IDs can't be probed", async () => {
      const { alice, bobRoast } = await twoUsersWithRoasts()

      const res = await alice.get(`/api/roasts/${bobRoast.id}`)

      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe('ROAST_NOT_FOUND')
    })

    it("can't delete someone else's roast", async () => {
      const { testApp, alice, bobRoast } = await twoUsersWithRoasts()

      const res = await alice.delete(`/api/roasts/${bobRoast.id}`).set('Origin', TEST_CLIENT_URL)

      expect(res.status).toBe(404)
      expect(testApp.roastService.roasts.map((roast) => roast.id)).toContain(bobRoast.id)
    })

    it('deletes your own roast', async () => {
      const { alice, aliceRoast } = await twoUsersWithRoasts()

      await alice.delete(`/api/roasts/${aliceRoast.id}`).set('Origin', TEST_CLIENT_URL).expect(204)

      expect((await alice.get(`/api/roasts/${aliceRoast.id}`)).status).toBe(404)
    })
  })
})
