// The YouTube access token lives only in the server-side session (encrypted at rest by the session store).
// These helpers are the only code that reads or writes it.

// Treat tokens as expired a minute early, so a request never starts with a token about to die.
const EXPIRY_MARGIN_MS = 60 * 1000

export function storeYouTubeConnection(session, { accessToken, expiresAt }) {
  session.youtubeConnection = { accessToken, expiresAt }
}

/** Returns { accessToken, expiresAt } if usable, otherwise forgets the stale token and returns null. */
export function getActiveYouTubeConnection(session) {
  const connection = session?.youtubeConnection
  if (!connection) return null

  if (!connection.accessToken || !(connection.expiresAt > Date.now() + EXPIRY_MARGIN_MS)) {
    delete session.youtubeConnection
    return null
  }
  return connection
}

/**
 * Revokes the token at Google (best effort) and removes it from the session.
 * A failed revoke must not stop disconnect or sign-out; the token expires within an hour anyway.
 */
export async function revokeYouTubeConnection(session, googleAuth) {
  const token = session?.youtubeConnection?.accessToken
  if (session) delete session.youtubeConnection
  if (!token) return

  try {
    await googleAuth.revokeToken(token)
  } catch (error) {
    console.warn('[youtube] Token revoke failed:', error.message)
  }
}
