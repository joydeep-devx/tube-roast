import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../src/App.jsx'
import { EXTERNAL_LINKS, SITE } from '../src/config/site.js'
import { jsonResponse, mockApi } from './helpers.jsx'

const notSignedIn = jsonResponse({ error: { message: 'Not signed in' } }, 401)

function renderAppAt(path) {
  window.history.pushState(null, '', path)
  mockApi({ '/api/auth/me': notSignedIn })
  return render(<App />)
}

const linkTo = (href) => screen.getAllByRole('link').filter((link) => link.getAttribute('href') === href)

describe('site config', () => {
  // Guard: the placeholder must never reach production. Google shows these pages on the consent screen.
  it('has a real public contact email', () => {
    expect(SITE.contactEmail).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
  })
})

describe('privacy policy page', () => {
  it('is public and has the disclosures Google and YouTube expect', async () => {
    renderAppAt('/privacy')

    expect(await screen.findByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeTruthy()
    expect(document.title).toBe('Privacy Policy · TubeRoast')
    // Google API Services User Data Policy: Limited Use disclosure.
    expect(screen.getByText(/adheres to the/).textContent).toContain('including the Limited Use requirements')
    // YouTube API Services: link to YouTube ToS, Google Privacy Policy, and Google's revoke-access page.
    expect(linkTo(EXTERNAL_LINKS.youtubeTerms).length).toBeGreaterThan(0)
    expect(linkTo(EXTERNAL_LINKS.googlePrivacy).length).toBeGreaterThan(0)
    expect(linkTo(EXTERNAL_LINKS.googlePermissions).length).toBeGreaterThan(0)
    // A way to ask for deletion.
    expect(linkTo(`mailto:${SITE.contactEmail}`).length).toBeGreaterThan(0)
  })

  it('opens external links safely in a new tab', async () => {
    renderAppAt('/privacy')
    await screen.findByRole('heading', { level: 1, name: 'Privacy Policy' })

    for (const link of linkTo(EXTERNAL_LINKS.youtubeTerms)) {
      expect(link.getAttribute('target')).toBe('_blank')
      expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    }
  })

  it('has a table of contents that links to every section', async () => {
    renderAppAt('/privacy')

    const toc = await screen.findByRole('navigation', { name: 'On this page' })
    for (const link of within(toc).getAllByRole('link')) {
      const id = link.getAttribute('href').slice(1)
      expect(document.getElementById(id), `section #${id}`).toBeTruthy()
    }
  })
})

describe('terms of service page', () => {
  it('is public and binds users to the YouTube Terms of Service', async () => {
    renderAppAt('/terms')

    expect(await screen.findByRole('heading', { level: 1, name: 'Terms of Service' })).toBeTruthy()
    expect(screen.getByText(/you agree to be bound by the/).textContent).toContain('YouTube Terms of Service')
    expect(linkTo('/privacy').length).toBeGreaterThan(0)
  })
})

describe('footer', () => {
  it('links to the privacy policy and terms on every page', async () => {
    renderAppAt('/this/does/not/exist')

    const legalNav = await screen.findByRole('navigation', { name: 'Legal' })
    expect(within(legalNav).getByRole('link', { name: 'Privacy Policy' }).getAttribute('href')).toBe('/privacy')
    expect(within(legalNav).getByRole('link', { name: 'Terms of Service' }).getAttribute('href')).toBe('/terms')
  })
})
