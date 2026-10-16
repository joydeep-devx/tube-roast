import { timingSafeEqual } from 'node:crypto'
import {
  destroySession,
  regenerateSession,
  saveSession,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from '../config/session.js'
import { YOUTUBE_SCOPE } from '../services/googleAuth.js'
import { revokeYouTubeConnection, storeYouTubeConnection } from '../services/youtubeConnection.js'

// An OAuth attempt must finish within this window, or its state is treated as stale.
const OAUTH_TIMEOUT_MS = 10 * 60 * 1000

// Both OAuth flows share one callback URL; the session remembers which one started.
export const OAUTH_FLOWS = Object.freeze({ SIGN_IN: 'signIn', YOUTUBE: 'youtube' })

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

/** Saves state + PKCE verifier for the callback, then sends the browser to Google. */
export async function redirectToGoogle(req, res, flow, { url, state, codeVerifier }) {
  req.session.oauth = { flow, state, codeVerifier, createdAt: Date.now() }
  await saveSession(req)
  res.redirect(url)
}

export function createAuthController({ googleAuth, userService, clientUrl, isProduction }) {
  const redirectWithError = (res, reason) => res.redirect(`${clientUrl}/?authError=${reason}`)

  async function completeSignIn(req, res, { profile }) {
    const user = await userService.findOrCreateUserFromGoogle(profile)

    // New session ID after login, so an ID planted before login (session fixation) becomes useless.
    await regenerateSession(req)
    req.session.userId = user.id
    await saveSession(req)

    res.redirect(`${clientUrl}/`)
  }

  async function completeYouTubeConnection(req, res, { profile, accessToken, expiresAt, grantedScopes }) {
    const user = req.session.userId ? await userService.findUserById(req.session.userId) : null
    if (!user) {
      return redirectWithError(res, 'failed')
    }

    // The user may untick or decline the YouTube permission on Google's screen.
    if (!grantedScopes.includes(YOUTUBE_SCOPE)) {
      return redirectWithError(res, 'youtube_denied')
    }

    // Stops a different Google account's YouTube from being attached to this TubeRoast account.
    if (profile.googleId !== user.googleId) {
      await googleAuth.revokeToken(accessToken).catch(() => {})
      return redirectWithError(res, 'youtube_account_mismatch')
    }

    storeYouTubeConnection(req.session, { accessToken, expiresAt })
    await saveSession(req)
    res.redirect(`${clientUrl}/?youtube=connected`)
  }

  return {
    // GET /api/auth/google
    async startGoogleSignIn(req, res) {
      await redirectToGoogle(req, res, OAUTH_FLOWS.SIGN_IN, await googleAuth.createAuthRequest())
    },

    // GET /api/auth/google/callback: Google sends the browser back here with ?code&state (or ?error).
    async handleGoogleCallback(req, res) {
      const pending = req.session.oauth
      // Single use: delete before anything else, so a replayed callback always fails.
      delete req.session.oauth

      const isYouTubeFlow = pending?.flow === OAUTH_FLOWS.YOUTUBE
      const { code, state, error } = req.query

      if (error) {
        const reason = error === 'access_denied' ? 'denied' : 'failed'
        return redirectWithError(res, isYouTubeFlow && reason === 'denied' ? 'youtube_denied' : reason)
      }

      const isValidRequest =
        pending &&
        typeof code === 'string' &&
        typeof state === 'string' &&
        Date.now() - pending.createdAt <= OAUTH_TIMEOUT_MS &&
        statesMatch(state, pending.state)

      if (!isValidRequest) {
        console.warn('[auth] Rejected Google callback: missing, expired or mismatched state')
        return redirectWithError(res, 'failed')
      }

      try {
        const result = await googleAuth.exchangeCode({ code, codeVerifier: pending.codeVerifier })
        await (isYouTubeFlow ? completeYouTubeConnection(req, res, result) : completeSignIn(req, res, result))
      } catch (err) {
        // Log the message only; error objects from HTTP clients can include request details.
        console.error('[auth] Google callback failed:', err.message)
        redirectWithError(res, 'failed')
      }
    },

    // GET /api/auth/me (behind requireAuth)
    getCurrentUser(req, res) {
      res.json({ user: toPublicUser(req.user) })
    },

    // POST /api/auth/logout: also ends YouTube access, not just the TubeRoast session.
    async logout(req, res) {
      await revokeYouTubeConnection(req.session, googleAuth)
      await destroySession(req)
      res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions(isProduction))
      res.status(204).end()
    },
  }
}
