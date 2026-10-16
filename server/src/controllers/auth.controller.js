import { timingSafeEqual } from 'node:crypto'
import {
  destroySession,
  regenerateSession,
  saveSession,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from '../config/session.js'

// A sign-in attempt must finish within this window, or its state is treated as stale.
const SIGN_IN_TIMEOUT_MS = 10 * 60 * 1000

// Compares in constant time so response timing doesn't reveal how much of the state matched.
function statesMatch(received, expected) {
  const a = Buffer.from(received)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

// Only these fields ever leave the server. No googleId, no tokens.
export function toPublicUser(user) {
  return { id: user.id, displayName: user.displayName, avatarUrl: user.avatarUrl ?? null }
}

export function createAuthController({ googleAuth, userService, clientUrl, isProduction }) {
  const redirectWithError = (res, reason) => res.redirect(`${clientUrl}/?authError=${reason}`)

  return {
    // GET /api/auth/google: remember state + PKCE verifier in the session, then send the browser to Google.
    async startGoogleSignIn(req, res) {
      const { url, state, codeVerifier } = await googleAuth.createAuthRequest()
      req.session.oauth = { state, codeVerifier, createdAt: Date.now() }
      await saveSession(req)
      res.redirect(url)
    },

    // GET /api/auth/google/callback: Google sends the browser back here with ?code&state (or ?error).
    async handleGoogleCallback(req, res) {
      const pending = req.session.oauth
      // Single use: delete before anything else, so a replayed callback always fails.
      delete req.session.oauth

      const { code, state, error } = req.query

      if (error) {
        return redirectWithError(res, error === 'access_denied' ? 'denied' : 'failed')
      }

      const isValidRequest =
        pending &&
        typeof code === 'string' &&
        typeof state === 'string' &&
        Date.now() - pending.createdAt <= SIGN_IN_TIMEOUT_MS &&
        statesMatch(state, pending.state)

      if (!isValidRequest) {
        console.warn('[auth] Rejected Google callback: missing, expired or mismatched state')
        return redirectWithError(res, 'failed')
      }

      try {
        const profile = await googleAuth.getProfileFromCode({ code, codeVerifier: pending.codeVerifier })
        const user = await userService.findOrCreateUserFromGoogle(profile)

        // New session ID after login, so an ID planted before login (session fixation) becomes useless.
        await regenerateSession(req)
        req.session.userId = user.id
        await saveSession(req)

        res.redirect(`${clientUrl}/`)
      } catch (err) {
        // Log the message only; error objects from HTTP clients can include request details.
        console.error('[auth] Google sign-in failed:', err.message)
        redirectWithError(res, 'failed')
      }
    },

    // GET /api/auth/me (behind requireAuth)
    getCurrentUser(req, res) {
      res.json({ user: toPublicUser(req.user) })
    },

    // POST /api/auth/logout
    async logout(req, res) {
      await destroySession(req)
      res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions(isProduction))
      res.status(204).end()
    },
  }
}
