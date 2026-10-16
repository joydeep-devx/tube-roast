import { randomUUID } from 'node:crypto'
import { vi } from 'vitest'
import { createApp } from '../src/app.js'

export const TEST_CLIENT_URL = 'http://localhost:5173'
export const FAKE_GOOGLE_URL = 'https://accounts.google.com/o/oauth2/v2/auth?fake=1'
export const FAKE_STATE = 'fake-state-value'
export const FAKE_VERIFIER = 'fake-code-verifier'

export const fakeProfile = {
  googleId: '109876543210987654321',
  displayName: 'Test Viewer',
  avatarUrl: 'https://lh3.googleusercontent.com/a/example',
}

// Stands in for Google: no network calls, and every call is recorded for assertions.
export function createFakeGoogleAuth() {
  return {
    createAuthRequest: vi.fn(async () => ({ url: FAKE_GOOGLE_URL, state: FAKE_STATE, codeVerifier: FAKE_VERIFIER })),
    getProfileFromCode: vi.fn(async () => fakeProfile),
  }
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

export function createTestApp({ googleAuth = createFakeGoogleAuth(), userService = createFakeUserService() } = {}) {
  const app = createApp({
    config: {
      clientUrl: TEST_CLIENT_URL,
      sessionSecret: 'test-session-secret-that-is-at-least-32-chars',
      isProduction: false,
    },
    googleAuth,
    userService,
    sessionStore: undefined, // express-session's in-memory store
  })
  return { app, googleAuth, userService }
}

// Reads one cookie's value from a Set-Cookie response header.
export function getCookie(res, name) {
  const header = (res.headers['set-cookie'] ?? []).find((cookie) => cookie.startsWith(`${name}=`))
  return header ? { raw: header, value: header.split(';')[0].slice(name.length + 1) } : null
}
