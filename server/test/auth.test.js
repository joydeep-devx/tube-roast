import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SESSION_COOKIE_NAME } from '../src/config/session.js'
import { createTestApp, FAKE_GOOGLE_URL, FAKE_STATE, FAKE_VERIFIER, getCookie, TEST_CLIENT_URL } from './helpers.js'

const callbackUrl = (params) => `/api/auth/google/callback?${new URLSearchParams(params)}`

// Starts sign-in with a cookie-keeping agent, like a browser that was just sent to Google.
async function startSignIn(app) {
  const agent = request.agent(app)
  const res = await agent.get('/api/auth/google')
  return { agent, res }
}

describe('Google sign-in', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /api/auth/google', () => {
    it('redirects to Google and sets a protected session cookie', async () => {
      const { app } = createTestApp()
      const { res } = await startSignIn(app)

      expect(res.status).toBe(302)
      expect(res.headers.location).toBe(FAKE_GOOGLE_URL)

      const cookie = getCookie(res, SESSION_COOKIE_NAME)
      expect(cookie).not.toBeNull()
      expect(cookie.raw).toMatch(/HttpOnly/i)
      expect(cookie.raw).toMatch(/SameSite=Lax/i)
      expect(cookie.raw).not.toMatch(/Secure/i) // plain HTTP in development
    })

    it('rate limits after 20 attempts', async () => {
      const { app } = createTestApp()
      for (let i = 0; i < 20; i++) {
        await request(app).get('/api/auth/google').expect(302)
      }

      const res = await request(app).get('/api/auth/google')
      expect(res.status).toBe(429)
      expect(res.body.error.message).toMatch(/too many/i)
    })
  })

  describe('GET /api/auth/google/callback', () => {
    it('signs the user in, rotates the session ID and redirects to the app', async () => {
      const { app, googleAuth, userService } = createTestApp()
      const { agent, res: startRes } = await startSignIn(app)
      const sessionBefore = getCookie(startRes, SESSION_COOKIE_NAME).value

      const res = await agent.get(callbackUrl({ code: 'auth-code', state: FAKE_STATE }))

      expect(res.status).toBe(302)
      expect(res.headers.location).toBe(`${TEST_CLIENT_URL}/`)
      expect(googleAuth.exchangeCode).toHaveBeenCalledWith({ code: 'auth-code', codeVerifier: FAKE_VERIFIER })
      expect(userService.users.size).toBe(1)

      const sessionAfter = getCookie(res, SESSION_COOKIE_NAME).value
      expect(sessionAfter).not.toBe(sessionBefore)
    })

    it('rejects a callback with no sign-in in progress (login CSRF)', async () => {
      const { app, googleAuth } = createTestApp()
      vi.spyOn(console, 'warn').mockImplementation(() => {})

      const res = await request(app).get(callbackUrl({ code: 'auth-code', state: FAKE_STATE }))

      expect(res.headers.location).toBe(`${TEST_CLIENT_URL}/?authError=failed`)
      expect(googleAuth.exchangeCode).not.toHaveBeenCalled()
    })

    it('rejects a mismatched state', async () => {
      const { app, googleAuth } = createTestApp()
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      const { agent } = await startSignIn(app)

      const res = await agent.get(callbackUrl({ code: 'auth-code', state: 'attacker-state' }))

      expect(res.headers.location).toBe(`${TEST_CLIENT_URL}/?authError=failed`)
      expect(googleAuth.exchangeCode).not.toHaveBeenCalled()
    })

    it('rejects a missing code', async () => {
      const { app, googleAuth } = createTestApp()
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      const { agent } = await startSignIn(app)

      const res = await agent.get(callbackUrl({ state: FAKE_STATE }))

      expect(res.headers.location).toBe(`${TEST_CLIENT_URL}/?authError=failed`)
      expect(googleAuth.exchangeCode).not.toHaveBeenCalled()
    })

    it('rejects a replayed callback (state is single use)', async () => {
      const { app, googleAuth } = createTestApp()
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      const { agent } = await startSignIn(app)
      const failingAgent = request.agent(app)
      // Copy the pre-login cookie to a second "browser", then let the first one finish signing in.
      const preLoginCookie = (await agent.get('/api/auth/google')).headers['set-cookie']
      await agent.get(callbackUrl({ code: 'auth-code', state: FAKE_STATE }))

      const res = await failingAgent
        .get(callbackUrl({ code: 'auth-code', state: FAKE_STATE }))
        .set('Cookie', preLoginCookie)

      expect(res.headers.location).toBe(`${TEST_CLIENT_URL}/?authError=failed`)
      expect(googleAuth.exchangeCode).toHaveBeenCalledOnce()
    })

    it('rejects a sign-in that took longer than 10 minutes', async () => {
      const { app, googleAuth } = createTestApp()
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      const { agent } = await startSignIn(app)

      const elevenMinutesLater = Date.now() + 11 * 60 * 1000
      vi.spyOn(Date, 'now').mockReturnValue(elevenMinutesLater)
      const res = await agent.get(callbackUrl({ code: 'auth-code', state: FAKE_STATE }))

      expect(res.headers.location).toBe(`${TEST_CLIENT_URL}/?authError=failed`)
      expect(googleAuth.exchangeCode).not.toHaveBeenCalled()
    })

    it('reports a cancelled consent screen as "denied"', async () => {
      const { app } = createTestApp()
      const { agent } = await startSignIn(app)

      const res = await agent.get(callbackUrl({ error: 'access_denied', state: FAKE_STATE }))

      expect(res.headers.location).toBe(`${TEST_CLIENT_URL}/?authError=denied`)
    })

    it('reports a failed token exchange as "failed" without leaking details', async () => {
      const { app, googleAuth } = createTestApp()
      const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      googleAuth.exchangeCode.mockRejectedValueOnce(new Error('invalid_grant'))
      const { agent } = await startSignIn(app)

      const res = await agent.get(callbackUrl({ code: 'auth-code', state: FAKE_STATE }))

      expect(res.headers.location).toBe(`${TEST_CLIENT_URL}/?authError=failed`)
      expect(logSpy).toHaveBeenCalledWith('[auth] Google callback failed:', 'invalid_grant')
    })
  })

  describe('GET /api/auth/me', () => {
    it('returns 401 when not signed in', async () => {
      const res = await request(createTestApp().app).get('/api/auth/me')

      expect(res.status).toBe(401)
      expect(res.body).toEqual({ error: { message: 'Not signed in' } })
    })

    it('returns only public profile fields when signed in', async () => {
      const { app } = createTestApp()
      const { agent } = await startSignIn(app)
      await agent.get(callbackUrl({ code: 'auth-code', state: FAKE_STATE }))

      const res = await agent.get('/api/auth/me')

      expect(res.status).toBe(200)
      expect(res.body).toEqual({
        user: {
          id: expect.any(String),
          displayName: 'Test Viewer',
          avatarUrl: 'https://lh3.googleusercontent.com/a/example',
        },
      })
    })

    it('returns 401 if the user was deleted after signing in', async () => {
      const { app, userService } = createTestApp()
      const { agent } = await startSignIn(app)
      await agent.get(callbackUrl({ code: 'auth-code', state: FAKE_STATE }))
      userService.users.clear()

      const res = await agent.get('/api/auth/me')

      expect(res.status).toBe(401)
    })
  })

  describe('POST /api/auth/logout', () => {
    it('ends the session and clears the cookie', async () => {
      const { app } = createTestApp()
      const { agent } = await startSignIn(app)
      await agent.get(callbackUrl({ code: 'auth-code', state: FAKE_STATE }))

      const res = await agent.post('/api/auth/logout').set('Origin', TEST_CLIENT_URL)

      expect(res.status).toBe(204)
      expect(getCookie(res, SESSION_COOKIE_NAME).raw).toMatch(/Expires=Thu, 01 Jan 1970/)
      expect((await agent.get('/api/auth/me')).status).toBe(401)
    })

    it('rejects requests from another site (CSRF)', async () => {
      const { app } = createTestApp()
      const { agent } = await startSignIn(app)
      await agent.get(callbackUrl({ code: 'auth-code', state: FAKE_STATE }))

      const res = await agent.post('/api/auth/logout').set('Origin', 'https://evil.example')

      expect(res.status).toBe(403)
      expect((await agent.get('/api/auth/me')).status).toBe(200)
    })
  })
})
