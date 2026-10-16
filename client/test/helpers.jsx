import { render } from '@testing-library/react'
import { domAnimation, LazyMotion } from 'motion/react'
import { MemoryRouter } from 'react-router'
import { vi } from 'vitest'
import { AuthContext } from '../src/auth/authContext.js'

export const testUser = { id: 'u1', displayName: 'Test Viewer', avatarUrl: null }

export const authAs = (status) => ({
  status,
  user: status === 'signedIn' ? testUser : null,
  signOut: vi.fn(),
})

/** Renders UI with the same providers the app uses, but a controllable auth state and URL. */
export function renderWithProviders(ui, { auth = authAs('signedIn'), route = '/' } = {}) {
  return render(
    <LazyMotion features={domAnimation} strict>
      <AuthContext.Provider value={auth}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </AuthContext.Provider>
    </LazyMotion>,
  )
}

export const jsonResponse = (body, status = 200) =>
  new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

/**
 * Replaces fetch with a fake API. `routes` maps "METHOD /path" (or "/path" for GET) to a Response,
 * or a function returning one. Unknown requests fail loudly so tests never hit the network.
 */
export function mockApi(routes) {
  const fetchMock = vi.fn(async (input, init = {}) => {
    const path = new URL(input, 'http://localhost').pathname
    const method = (init.method ?? 'GET').toUpperCase()
    const handler = routes[`${method} ${path}`] ?? (method === 'GET' ? routes[path] : undefined)
    if (!handler) throw new Error(`Unexpected request in test: ${method} ${path}`)
    return typeof handler === 'function' ? handler() : handler.clone()
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

export const makeRoast = (overrides = {}) => ({
  id: 'r1',
  headline: 'Speedrunner of Sadness',
  roast: 'You split your likes between Minecraft speedruns and lofi beats, which is an efficient way to avoid your feelings.',
  verdict: 'Emotional speedrunner',
  snapshot: {
    totals: { likedVideos: 200, subscriptions: 143, playlists: 6 },
    topChannels: [{ name: 'Speedrun Archive', likes: 31 }],
    traits: ['shortsAddict'],
  },
  createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  ...overrides,
})
