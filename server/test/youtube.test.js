import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../src/utils/AppError.js'
import {
  createTestApp,
  FAKE_ACCESS_TOKEN,
  FAKE_STATE,
  FAKE_YOUTUBE_URL,
  fakeProfile,
  TEST_CLIENT_URL,
  youtubeGrant,
} from './helpers.js'

const callbackUrl = (params) => `/api/auth/google/callback?${new URLSearchParams(params)}`

// Signs in through the fake Google flow and returns a cookie-keeping agent.
async function signedInAgent(app) {
  const agent = request.agent(app)
  await agent.get('/api/auth/google')
  await agent.get(callbackUrl({ code: 'sign-in-code', state: FAKE_STATE }))
  return agent
}

// Signs in, then completes the YouTube consent flow with the given token exchange result.
async function connectYouTube({ app, googleAuth }, grant = youtubeGrant()) {
  const agent = await signedInAgent(app)
  await agent.get('/api/youtube/connect')
  googleAuth.exchangeCode.mockResolvedValueOnce(grant)
  const res = await agent.get(callbackUrl({ code: 'youtube-code', state: FAKE_STATE }))
  return { agent, res }
}

describe('YouTube connection', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('requires sign-in for every YouTube route', async () => {
    const { app } = createTestApp()

    for (const [method, path] of [
      ['get', '/api/youtube/connect'],
      ['get', '/api/youtube/status'],
      ['get', '/api/youtube/activity'],
      ['delete', '/api/youtube/connection'],
    ]) {
      const res = await request(app)[method](path)
      expect(res.status, `${method.toUpperCase()} ${path}`).toBe(401)
    }
  })

  it('starts incremental consent, hinting the signed-in account', async () => {
    const testApp = createTestApp()
    const agent = await signedInAgent(testApp.app)

    const res = await agent.get('/api/youtube/connect')

    expect(res.status).toBe(302)
    expect(res.headers.location).toBe(FAKE_YOUTUBE_URL)
    expect(testApp.googleAuth.createYouTubeAuthRequest).toHaveBeenCalledWith({ loginHint: fakeProfile.googleId })
  })

  it('stores the token when YouTube access is granted, without ever returning it', async () => {
    const testApp = createTestApp()
    const { agent, res } = await connectYouTube(testApp)

    expect(res.headers.location).toBe(`${TEST_CLIENT_URL}/?youtube=connected`)

    const status = await agent.get('/api/youtube/status')
    expect(status.body).toEqual({ connected: true, expiresAt: expect.any(Number) })
    expect(status.text).not.toContain(FAKE_ACCESS_TOKEN)
  })

  it('reports youtube_denied when the YouTube scope was not granted', async () => {
    const testApp = createTestApp()
    const { agent, res } = await connectYouTube(testApp, youtubeGrant({ grantedScopes: ['openid'] }))

    expect(res.headers.location).toBe(`${TEST_CLIENT_URL}/?authError=youtube_denied`)
    expect((await agent.get('/api/youtube/status')).body.connected).toBe(false)
  })

  it('reports youtube_denied when the user cancels the consent screen', async () => {
    const testApp = createTestApp()
    const agent = await signedInAgent(testApp.app)
    await agent.get('/api/youtube/connect')

    const res = await agent.get(callbackUrl({ error: 'access_denied', state: FAKE_STATE }))

    expect(res.headers.location).toBe(`${TEST_CLIENT_URL}/?authError=youtube_denied`)
  })

  it('rejects and revokes a grant from a different Google account', async () => {
    const testApp = createTestApp()
    const otherAccount = { ...fakeProfile, googleId: '555555555555555555555' }
    const { agent, res } = await connectYouTube(testApp, youtubeGrant({ profile: otherAccount }))

    expect(res.headers.location).toBe(`${TEST_CLIENT_URL}/?authError=youtube_account_mismatch`)
    expect(testApp.googleAuth.revokeToken).toHaveBeenCalledWith(FAKE_ACCESS_TOKEN)
    expect((await agent.get('/api/youtube/status')).body.connected).toBe(false)
  })

  it('does not keep the user signed in to a different account after connecting', async () => {
    const testApp = createTestApp()
    const { agent } = await connectYouTube(testApp)

    const me = await agent.get('/api/auth/me')
    expect(me.body.user.displayName).toBe(fakeProfile.displayName)
    expect(testApp.userService.users.size).toBe(1)
  })

  describe('GET /api/youtube/activity', () => {
    it('returns counts and a short preview, never the token or raw items', async () => {
      const testApp = createTestApp()
      const { agent } = await connectYouTube(testApp)

      const res = await agent.get('/api/youtube/activity')

      expect(res.status).toBe(200)
      expect(testApp.youtubeClient.fetchActivity).toHaveBeenCalledWith(FAKE_ACCESS_TOKEN)
      expect(res.body).toEqual({
        counts: { likedVideos: 2, subscriptions: 1, playlists: 1 },
        recentLikes: [
          { title: 'Speedrun any%', channelTitle: 'Speedrun Archive' },
          { title: 'Lofi beats', channelTitle: 'Lofi Beats to Procrastinate To' },
        ],
        limits: { likedVideos: 200, subscriptions: 200, playlists: 50 },
        profile: expect.objectContaining({
          totals: { likedVideos: 2, subscriptions: 1, playlists: 1 },
          topChannels: expect.any(Array),
          traits: expect.any(Array),
        }),
      })
      expect(res.text).not.toContain(FAKE_ACCESS_TOKEN)
      expect(JSON.stringify(res.body.profile)).not.toMatch(/vid1|vid2/) // no video IDs in the profile
    })

    it('returns YOUTUBE_NOT_CONNECTED when not connected', async () => {
      const testApp = createTestApp()
      const agent = await signedInAgent(testApp.app)

      const res = await agent.get('/api/youtube/activity')

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('YOUTUBE_NOT_CONNECTED')
      expect(testApp.youtubeClient.fetchActivity).not.toHaveBeenCalled()
    })

    it('treats an expired token as not connected', async () => {
      const testApp = createTestApp()
      const { agent } = await connectYouTube(testApp, youtubeGrant({ expiresAt: Date.now() - 1000 }))

      const res = await agent.get('/api/youtube/activity')

      expect(res.body.error.code).toBe('YOUTUBE_NOT_CONNECTED')
      expect((await agent.get('/api/youtube/status')).body.connected).toBe(false)
    })

    it('forgets the token when YouTube rejects it', async () => {
      const testApp = createTestApp()
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      const { agent } = await connectYouTube(testApp)
      testApp.youtubeClient.fetchActivity.mockRejectedValueOnce(
        new AppError(401, 'Your YouTube connection has expired.', { code: 'YOUTUBE_NOT_CONNECTED' }),
      )

      const res = await agent.get('/api/youtube/activity')

      expect(res.status).toBe(401)
      expect((await agent.get('/api/youtube/status')).body.connected).toBe(false)
    })

    it('passes user-facing YouTube errors through with their code', async () => {
      const testApp = createTestApp()
      const { agent } = await connectYouTube(testApp)
      testApp.youtubeClient.fetchActivity.mockRejectedValueOnce(
        new AppError(503, 'Try again tomorrow.', { code: 'YOUTUBE_QUOTA_EXCEEDED', expose: true }),
      )

      const res = await agent.get('/api/youtube/activity')

      expect(res.status).toBe(503)
      expect(res.body.error).toEqual({ message: 'Try again tomorrow.', code: 'YOUTUBE_QUOTA_EXCEEDED' })
    })
  })

  describe('disconnecting', () => {
    it('revokes the token at Google and forgets it', async () => {
      const testApp = createTestApp()
      const { agent } = await connectYouTube(testApp)

      const res = await agent.delete('/api/youtube/connection').set('Origin', TEST_CLIENT_URL)

      expect(res.status).toBe(204)
      expect(testApp.googleAuth.revokeToken).toHaveBeenCalledWith(FAKE_ACCESS_TOKEN)
      expect((await agent.get('/api/youtube/status')).body.connected).toBe(false)
      expect((await agent.get('/api/auth/me')).status).toBe(200) // still signed in to TubeRoast
    })

    it('still disconnects if Google revoke fails', async () => {
      const testApp = createTestApp()
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      testApp.googleAuth.revokeToken.mockRejectedValueOnce(new Error('network down'))
      const { agent } = await connectYouTube(testApp)

      const res = await agent.delete('/api/youtube/connection')

      expect(res.status).toBe(204)
      expect((await agent.get('/api/youtube/status')).body.connected).toBe(false)
    })

    it('rejects a disconnect from another site (CSRF)', async () => {
      const testApp = createTestApp()
      const { agent } = await connectYouTube(testApp)

      const res = await agent.delete('/api/youtube/connection').set('Origin', 'https://evil.example')

      expect(res.status).toBe(403)
      expect((await agent.get('/api/youtube/status')).body.connected).toBe(true)
    })

    it('signing out also revokes YouTube access', async () => {
      const testApp = createTestApp()
      const { agent } = await connectYouTube(testApp)

      await agent.post('/api/auth/logout').expect(204)

      expect(testApp.googleAuth.revokeToken).toHaveBeenCalledWith(FAKE_ACCESS_TOKEN)
    })
  })
})
