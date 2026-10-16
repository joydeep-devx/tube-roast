import { randomUUID } from 'node:crypto'
import { vi } from 'vitest'
import { createApp } from '../src/app.js'
import { YOUTUBE_SCOPE } from '../src/services/googleAuth.js'

export const TEST_CLIENT_URL = 'http://localhost:5173'
export const FAKE_GOOGLE_URL = 'https://accounts.google.com/o/oauth2/v2/auth?fake=1'
export const FAKE_STATE = 'fake-state-value'
export const FAKE_VERIFIER = 'fake-code-verifier'
export const FAKE_YOUTUBE_URL = 'https://accounts.google.com/o/oauth2/v2/auth?fake=youtube'
export const FAKE_ACCESS_TOKEN = 'fake-youtube-access-token'

export const fakeProfile = {
  googleId: '109876543210987654321',
  displayName: 'Test Viewer',
  avatarUrl: 'https://lh3.googleusercontent.com/a/example',
}

// What Google's token exchange returns after the user approves YouTube access.
export const youtubeGrant = (overrides = {}) => ({
  profile: fakeProfile,
  accessToken: FAKE_ACCESS_TOKEN,
  expiresAt: Date.now() + 60 * 60 * 1000,
  grantedScopes: ['openid', 'https://www.googleapis.com/auth/userinfo.profile', YOUTUBE_SCOPE],
  ...overrides,
})

// Stands in for Google: no network calls, and every call is recorded for assertions.
export function createFakeGoogleAuth() {
  return {
    createAuthRequest: vi.fn(async () => ({ url: FAKE_GOOGLE_URL, state: FAKE_STATE, codeVerifier: FAKE_VERIFIER })),
    createYouTubeAuthRequest: vi.fn(async () => ({
      url: FAKE_YOUTUBE_URL,
      state: FAKE_STATE,
      codeVerifier: FAKE_VERIFIER,
    })),
    // Sign-in grants only identity scopes, with no access token we keep.
    exchangeCode: vi.fn(async () => ({
      profile: fakeProfile,
      accessToken: 'sign-in-token',
      expiresAt: Date.now() + 60 * 60 * 1000,
      grantedScopes: ['openid', 'https://www.googleapis.com/auth/userinfo.profile'],
    })),
    revokeToken: vi.fn(async () => {}),
  }
}

// Raw items in the shape the YouTube Data API returns them.
export const rawYouTubeActivity = {
  likedVideos: [
    {
      id: 'vid1',
      snippet: { title: 'Speedrun any%', channelTitle: 'Speedrun Archive', categoryId: '20', tags: ['speedrun'] },
      contentDetails: { duration: 'PT15M33S' },
      topicDetails: { topicCategories: ['https://en.wikipedia.org/wiki/Video_game_culture'] },
    },
    { id: 'vid2', snippet: { title: 'Lofi beats', channelTitle: 'Lofi Beats to Procrastinate To' } },
  ],
  subscriptions: [{ snippet: { title: 'Ten-Minute Crafts Gone Wrong' } }],
  playlists: [{ snippet: { title: 'Watch later (for real)' }, contentDetails: { itemCount: 42 } }],
}

export function createFakeYouTubeClient() {
  return { fetchActivity: vi.fn(async () => rawYouTubeActivity) }
}

// Stands in for MongoDB: users live in a Map for the duration of one test.
export function createFakeUserService() {
  const users = new Map()
  return {
    users,
    findOrCreateUserFromGoogle: vi.fn(async (profile) => {
      const existing = [...users.values()].find((user) => user.googleId === profile.googleId)
      const user = existing ?? { id: randomUUID(), googleId: profile.googleId }
      Object.assign(user, { displayName: profile.displayName, avatarUrl: profile.avatarUrl })
      users.set(user.id, user)
      return user
    }),
    findUserById: vi.fn(async (id) => users.get(id) ?? null),
  }
}

export function createTestApp({
  googleAuth = createFakeGoogleAuth(),
  youtubeClient = createFakeYouTubeClient(),
  userService = createFakeUserService(),
} = {}) {
  const app = createApp({
    config: {
      clientUrl: TEST_CLIENT_URL,
      sessionSecret: 'test-session-secret-that-is-at-least-32-chars',
      isProduction: false,
    },
    googleAuth,
    youtubeClient,
    userService,
    sessionStore: undefined, // express-session's in-memory store
  })
  return { app, googleAuth, youtubeClient, userService }
}

// Reads one cookie's value from a Set-Cookie response header.
export function getCookie(res, name) {
  const header = (res.headers['set-cookie'] ?? []).find((cookie) => cookie.startsWith(`${name}=`))
  return header ? { raw: header, value: header.split(';')[0].slice(name.length + 1) } : null
}
