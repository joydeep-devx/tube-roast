import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import RequireAuth from '../src/auth/RequireAuth.jsx'
import { authAs, renderWithProviders } from './helpers.jsx'

const renderGuard = (status) =>
  renderWithProviders(
    <RequireAuth title="Sign in to see your roasts">
      <p>Secret history</p>
    </RequireAuth>,
    { auth: authAs(status) },
  )

describe('RequireAuth', () => {
  it('shows a loading state while the session is checked', () => {
    renderGuard('loading')

    expect(screen.getByLabelText('Loading').getAttribute('aria-busy')).toBe('true')
    expect(screen.queryByText('Secret history')).toBeNull()
  })

  it('shows the page when signed in', () => {
    renderGuard('signedIn')

    expect(screen.getByText('Secret history')).toBeTruthy()
  })

  it('shows a sign-in prompt instead of the page when signed out', () => {
    renderGuard('signedOut')

    expect(screen.getByRole('heading', { name: 'Sign in to see your roasts' })).toBeTruthy()
    expect(screen.getByRole('link', { name: /sign in with google/i }).getAttribute('href')).toBe('/api/auth/google')
    expect(screen.queryByText('Secret history')).toBeNull()
  })

  it('explains a server problem without offering sign-in', () => {
    renderGuard('error')

    expect(screen.getByText(/couldn't reach the TubeRoast server/i)).toBeTruthy()
    expect(screen.queryByRole('link', { name: /sign in with google/i })).toBeNull()
  })
})
