import { randomBytes } from 'node:crypto'
import { OAuth2Client } from 'google-auth-library'

// Sign-in only needs to know who the user is. No email, no YouTube access here.
export const SIGN_IN_SCOPES = ['openid', 'profile']

/**
 * Everything Google-specific about signing in lives here, so controllers never touch OAuth details.
 */
export function createGoogleAuth({ clientId, clientSecret, redirectUri }) {
  const client = new OAuth2Client({ clientId, clientSecret, redirectUri })

  return {
    /**
     * Builds the Google consent URL plus the secrets we must remember until Google redirects back:
     * - state: random value echoed back by Google; proves the callback belongs to this browser (CSRF).
     * - codeVerifier: PKCE secret; only its hash goes to Google, so a stolen code can't be redeemed.
     */
    async createAuthRequest() {
      const state = randomBytes(32).toString('base64url')
      const { codeVerifier, codeChallenge } = await client.generateCodeVerifierAsync()

      const url = client.generateAuthUrl({
        access_type: 'online', // no refresh token: we don't need Google access after sign-in
        scope: SIGN_IN_SCOPES,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        prompt: 'select_account',
      })

      return { url, state, codeVerifier }
    },

    /**
     * Exchanges the one-time code for tokens, verifies the ID token and returns the user's profile.
     * The tokens themselves are discarded: sign-in doesn't need them again.
     */
    async getProfileFromCode({ code, codeVerifier }) {
      const { tokens } = await client.getToken({ code, codeVerifier })

      if (!tokens.id_token) {
        throw new Error('Google did not return an ID token')
      }

      // Checks Google's signature, expiry, issuer, and that the token was issued for OUR client ID.
      const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: clientId })
      const payload = ticket.getPayload()

      return {
        googleId: payload.sub,
        displayName: payload.name || 'YouTube viewer',
        avatarUrl: payload.picture,
      }
    },
  }
}
