import { describe, expect, it } from 'vitest'
import { createGoogleAuth } from '../src/services/googleAuth.js'

// Builds the real consent URL. No network involved, so the values can be fake.
const googleAuth = createGoogleAuth({
  clientId: 'test-client.apps.googleusercontent.com',
  clientSecret: 'not-a-real-secret',
  redirectUri: 'http://localhost:5173/api/auth/google/callback',
})

describe('createGoogleAuth().createAuthRequest', () => {
  it('builds a Google consent URL with least-privilege scopes, state and PKCE', async () => {
    const { url, state, codeVerifier } = await googleAuth.createAuthRequest()
    const parsed = new URL(url)
    const params = parsed.searchParams

    expect(parsed.origin).toBe('https://accounts.google.com')
    expect(params.get('client_id')).toBe('test-client.apps.googleusercontent.com')
    expect(params.get('redirect_uri')).toBe('http://localhost:5173/api/auth/google/callback')
    expect(params.get('response_type')).toBe('code')
    expect(params.get('scope')).toBe('openid profile')
    expect(params.get('access_type')).toBe('online')
    expect(params.get('state')).toBe(state)
    expect(params.get('code_challenge_method')).toBe('S256')
    expect(params.get('code_challenge')).toBeTruthy()
    expect(params.get('code_challenge')).not.toBe(codeVerifier) // only the hash is sent
    expect(url).not.toContain('not-a-real-secret')
  })

  it('creates unpredictable values for every attempt', async () => {
    const first = await googleAuth.createAuthRequest()
    const second = await googleAuth.createAuthRequest()

    expect(first.state).not.toBe(second.state)
    expect(first.codeVerifier).not.toBe(second.codeVerifier)
    expect(first.state.length).toBeGreaterThanOrEqual(43) // 32 random bytes, base64url
  })
})

describe('createGoogleAuth().createYouTubeAuthRequest', () => {
  it('asks only for read-only YouTube access, on top of existing grants', async () => {
    const { url, state } = await googleAuth.createYouTubeAuthRequest({ loginHint: '109876543210987654321' })
    const params = new URL(url).searchParams

    expect(params.get('scope')).toBe('https://www.googleapis.com/auth/youtube.readonly')
    expect(params.get('include_granted_scopes')).toBe('true')
    expect(params.get('access_type')).toBe('online')
    expect(params.get('login_hint')).toBe('109876543210987654321')
    expect(params.get('state')).toBe(state)
    expect(params.get('code_challenge_method')).toBe('S256')
  })

  it('omits login_hint when none is given', async () => {
    const { url } = await googleAuth.createYouTubeAuthRequest()
    expect(new URL(url).searchParams.has('login_hint')).toBe(false)
  })
})
