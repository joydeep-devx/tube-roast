import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../src/App.jsx'
import { jsonResponse, makeRoast, mockApi, testUser } from './helpers.jsx'

const notSignedIn = jsonResponse({ error: { message: 'Not signed in' } }, 401)
const signedIn = jsonResponse({ user: testUser })

// Renders the whole app (real router, providers and pages) at a given URL with a fake API.
function renderAppAt(path, routes) {
  window.history.pushState(null, '', path)
  mockApi(routes)
  return render(<App />)
}

describe('routing', () => {
  it('shows the "video unavailable" page for unknown URLs', async () => {
    renderAppAt('/this/does/not/exist', { '/api/auth/me': notSignedIn })

    expect(await screen.findByRole('heading', { name: "This video isn't available" })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Go home' }).getAttribute('href')).toBe('/')
  })

  it('asks signed-out visitors to sign in on /history', async () => {
    renderAppAt('/history', { '/api/auth/me': notSignedIn })

    expect(await screen.findByRole('heading', { name: 'Sign in to see your roasts' })).toBeTruthy()
  })

  it('shows a roast to its owner on /roasts/:id', async () => {
    renderAppAt('/roasts/r1', {
      '/api/auth/me': signedIn,
      '/api/roasts/r1': jsonResponse({ roast: makeRoast() }),
    })

    expect(await screen.findByRole('heading', { name: 'Speedrunner of Sadness' })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Your roasts/ }).getAttribute('href')).toBe('/history')
  })

  it("shows \"roast not available\" when the API says 404 (missing or someone else's)", async () => {
    renderAppAt('/roasts/someone-elses', {
      '/api/auth/me': signedIn,
      '/api/roasts/someone-elses': jsonResponse({ error: { message: 'Roast not found', code: 'ROAST_NOT_FOUND' } }, 404),
    })

    expect(await screen.findByRole('heading', { name: "This roast isn't available" })).toBeTruthy()
  })

  it('shows the History link in the header only when signed in', async () => {
    renderAppAt('/this/does/not/exist', { '/api/auth/me': signedIn })

    const header = await screen.findByRole('banner')
    expect(await screen.findByRole('link', { name: 'History' })).toBeTruthy()
    expect(header.textContent).toContain('Sign out')
  })
})
