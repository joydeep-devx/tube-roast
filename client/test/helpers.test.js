import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiRequest } from '../src/lib/apiClient.js'
import { formatRelativeTime } from '../src/lib/relativeTime.js'
import { roastAsText, toRoastCard } from '../src/roast/toRoastCard.js'
import { jsonResponse, makeRoast } from './helpers.jsx'

describe('formatRelativeTime', () => {
  const now = new Date('2026-10-16T12:00:00Z')
  const ago = (ms) => new Date(now.getTime() - ms)

  it.each([
    [10 * 1000, 'just now'],
    [5 * 60 * 1000, '5 minutes ago'],
    [3 * 60 * 60 * 1000, '3 hours ago'],
    [26 * 60 * 60 * 1000, 'yesterday'],
    [9 * 24 * 60 * 60 * 1000, 'last week'],
    [400 * 24 * 60 * 60 * 1000, 'last year'],
  ])('%i ms ago → "%s"', (ms, expected) => {
    expect(formatRelativeTime(ago(ms), now)).toBe(expected)
  })
})

describe('toRoastCard', () => {
  it('maps an API roast to the card shape', () => {
    const card = toRoastCard(makeRoast())

    expect(card).toMatchObject({
      badge: 'Your roast',
      title: 'Speedrunner of Sadness',
      likedVideoCount: 200,
      subscriptionCount: 143,
      topChannels: ['Speedrun Archive'],
      verdict: 'Emotional speedrunner',
    })
    expect(card.durationLabel).toMatch(/^\d+:\d{2}$/)
  })

  it('never shows a length under 5 seconds', () => {
    expect(toRoastCard(makeRoast({ roast: 'Short.' })).durationLabel).toBe('0:05')
  })

  it('builds plain text for the clipboard', () => {
    expect(roastAsText(makeRoast())).toBe(
      'Speedrunner of Sadness\n\nYou split your likes between Minecraft speedruns and lofi beats, which is an efficient way to avoid your feelings.\n\nVerdict: Emotional speedrunner\n\nRoasted by TubeRoast',
    )
  })
})

describe('apiRequest', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends JSON and parses JSON responses', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    expect(await apiRequest('/api/x', { method: 'POST', body: { a: 1 } })).toEqual({ ok: true })
    const [, options] = fetchMock.mock.calls[0]
    expect(options).toMatchObject({ method: 'POST', credentials: 'same-origin', body: '{"a":1}' })
    expect(options.headers).toEqual({ 'Content-Type': 'application/json' })
  })

  it('returns null for 204 No Content', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 204 })))
    expect(await apiRequest('/api/x', { method: 'DELETE' })).toBeNull()
  })

  it('throws ApiError with the server message, status and code', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ error: { message: 'Roast not found', code: 'ROAST_NOT_FOUND' } }, 404)))

    const error = await apiRequest('/api/roasts/x').catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 404, code: 'ROAST_NOT_FOUND', message: 'Roast not found' })
  })

  it('falls back to a generic message for non-JSON errors (e.g. proxy pages)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>Bad gateway</html>', { status: 502 })))

    await expect(apiRequest('/api/x')).rejects.toMatchObject({ status: 502, message: 'Something went wrong' })
  })
})
