import { randomBytes } from 'node:crypto'
import { OAuth2Client } from 'google-auth-library'

// Sign-in only needs to know who the user is. No email, no YouTube access.
export const SIGN_IN_SCOPES = ['openid', 'profile']
// Requested later, separately, only when the user chooses to connect YouTube.
export const YOUTUBE_SCOPE = 'https://www.googleapis.com/auth/youtube.readonly'

/**
 * Everything Google-specific about OAuth lives here, so controllers never touch OAuth details.
 */
export function createGoogleAuth({ clientId, clientSecret, redirectUri }) {
  const client = new OAuth2Client({ clientId, clientSecret, redirectUri })

  /**
   * Builds a Google consent URL plus the secrets we must remember until Google redirects back:
   * - state: random value echoed back by Google; proves the callback belongs to this browser (CSRF).
   * - codeVerifier: PKCE secret; only its hash goes to Google, so a stolen code can't be redeemed.
   */
  async function buildAuthRequest(options) {
    const state = randomBytes(32).toString('base64url')
    const { codeVerifier, codeChallenge } = await client.generateCodeVerifierAsync()

    const url = client.generateAuthUrl({
      access_type: 'online', // never a refresh token: we only need access while the user is here
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      ...options,
    })

    return { url, state, codeVerifier }
  }

  return {
    createAuthRequest() {
      return buildAuthRequest({ scope: SIGN_IN_SCOPES, prompt: 'select_account' })
    },

    // Incremental authorization: adds YouTube read access on top of the existing sign-in grant.
    createYouTubeAuthRequest({ loginHint } = {}) {
      return buildAuthRequest({
        scope: [YOUTUBE_SCOPE],
        include_granted_scopes: true,
        // Pre-selects the account the user signed in with.
        ...(loginHint ? { login_hint: loginHint } : {}),
      })
    },

    /**
     * Exchanges the one-time code, verifies the ID token and reports what the user actually granted.
     * Users can decline scopes, so callers must check grantedScopes rather than assume.
     */
    async exchangeCode({ code, codeVerifier }) {
      const { tokens } = await client.getToken({ code, codeVerifier })

      if (!tokens.id_token) {
        throw new Error('Google did not return an ID token')
      }

      // Checks Google's signature, expiry, issuer, and that the token was issued for OUR client ID.
      const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: clientId })
      const payload = ticket.getPayload()

      return {
        profile: {
          googleId: payload.sub,
          displayName: payload.name || 'YouTube viewer',
          avatarUrl: payload.picture,
        },
        accessToken: tokens.access_token,
        expiresAt: tokens.expiry_date,
        grantedScopes: (tokens.scope ?? '').split(' ').filter(Boolean),
      }
    },

    // Tells Google to invalidate the token, ending TubeRoast's access to the account.
    async revokeToken(token) {
      await client.revokeToken(token)
    },
  }
}
