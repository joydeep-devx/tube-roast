import { act, fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import HistoryPage from '../src/pages/HistoryPage.jsx'
import { jsonResponse, makeRoast, mockApi, renderWithProviders } from './helpers.jsx'

const roasts = [
  makeRoast({ id: 'r1', headline: 'Speedrunner of Sadness' }),
  makeRoast({ id: 'r2', headline: 'Lofi Beats to Avoid Responsibilities To', snapshot: { ...makeRoast().snapshot, traits: [] } }),
]

describe('HistoryPage', () => {
  it('shows a loading skeleton, then the roasts as links', async () => {
    mockApi({ '/api/roasts': jsonResponse({ roasts }) })
    const { container } = renderWithProviders(<HistoryPage />, { route: '/history' })

    expect(container.querySelector('.animate-pulse')).toBeTruthy()

    const first = await screen.findByRole('link', { name: /Speedrunner of Sadness/ })
    expect(first.getAttribute('href')).toBe('/roasts/r1')
    expect(screen.getByRole('link', { name: /Lofi Beats/ }).getAttribute('href')).toBe('/roasts/r2')
    expect(screen.getByText('2 of your latest 20 roasts. Older ones are deleted automatically.')).toBeTruthy()
    expect(screen.getAllByText('5 minutes ago')).toHaveLength(2)
  })

  it('keeps traits and Delete in a bottom-pinned footer so they align across cards', async () => {
    mockApi({ '/api/roasts': jsonResponse({ roasts }) })
    renderWithProviders(<HistoryPage />, { route: '/history' })
    await screen.findByRole('link', { name: /Speedrunner of Sadness/ })

    // jsdom can't measure layout, so this guards the structure; alignment itself was checked in a browser.
    const footers = screen.getAllByTestId('roast-card-footer')
    expect(footers).toHaveLength(2)
    for (const footer of footers) {
      expect(footer.className).toContain('mt-auto')
      expect(within(footer).getByRole('button', { name: 'Delete' })).toBeTruthy()
    }
    expect(within(footers[0]).getByRole('list', { name: 'Traits' })).toBeTruthy()
  })

  it('shows an empty state with a way to get roasted', async () => {
    mockApi({ '/api/roasts': jsonResponse({ roasts: [] }) })
    renderWithProviders(<HistoryPage />, { route: '/history' })

    expect(await screen.findByRole('heading', { name: 'No roasts yet' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Get roasted' }).getAttribute('href')).toBe('/')
  })

  it('shows an error with a working retry', async () => {
    let calls = 0
    mockApi({
      '/api/roasts': () =>
        ++calls === 1
          ? jsonResponse({ error: { message: 'Something went wrong' } }, 500)
          : jsonResponse({ roasts }),
    })
    renderWithProviders(<HistoryPage />, { route: '/history' })

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('Something went wrong')

    fireEvent.click(within(alert).getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('link', { name: /Speedrunner of Sadness/ })).toBeTruthy()
  })

  it('removes a roast from the list after deleting it', async () => {
    const fetchMock = mockApi({
      '/api/roasts': jsonResponse({ roasts }),
      'DELETE /api/roasts/r1': () => new Response(null, { status: 204 }),
    })
    renderWithProviders(<HistoryPage />, { route: '/history' })
    await screen.findByRole('link', { name: /Speedrunner of Sadness/ })

    const firstCard = screen.getByRole('link', { name: /Speedrunner of Sadness/ }).closest('li')
    fireEvent.click(within(firstCard).getByRole('button', { name: 'Delete' }))
    await act(async () => fireEvent.click(within(firstCard).getByRole('button', { name: 'Yes, delete' })))

    expect(screen.queryByRole('link', { name: /Speedrunner of Sadness/ })).toBeNull()
    expect(screen.getByRole('link', { name: /Lofi Beats/ })).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledWith('/api/roasts/r1', expect.objectContaining({ method: 'DELETE' }))
  })
})
