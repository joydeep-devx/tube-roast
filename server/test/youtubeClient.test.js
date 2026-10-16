import { afterEach, describe, expect, it, vi } from 'vitest'
import { createYouTubeClient } from '../src/services/youtubeClient.js'

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const errorResponse = (status, reason) => jsonResponse({ error: { code: status, errors: [{ reason }] } }, status)

const items = (count, prefix) => Array.from({ length: count }, (_, i) => ({ id: `${prefix}${i}` }))

/**
 * Fake fetch that serves `pagesPerResource` pages of `pageSize` items for each resource,
 * and records every requested URL.
 */
function createPagedFetch({ pageSize = 50, pagesPerResource = 10 } = {}) {
  const calls = []
  const fetchImpl = vi.fn(async (url, options) => {
    calls.push({ url: new URL(url), options })
    const resource = new URL(url).pathname.split('/').pop()
    const page = Number(new URL(url).searchParams.get('pageToken') ?? 0)
    const requested = Number(new URL(url).searchParams.get('maxResults'))
    const nextPageToken = page + 1 < pagesPerResource ? String(page + 1) : undefined
    return jsonResponse({ items: items(Math.min(pageSize, requested), `${resource}-${page}-`), nextPageToken })
  })
  return { fetchImpl, calls }
}

describe('YouTube client', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sends the access token as a Bearer header, not in the URL', async () => {
    const { fetchImpl, calls } = createPagedFetch({ pagesPerResource: 1 })
    await createYouTubeClient({ fetchImpl }).fetchActivity('secret-token')

    for (const { url, options } of calls) {
      expect(options.headers.Authorization).toBe('Bearer secret-token')
      expect(url.toString()).not.toContain('secret-token')
    }
  })

  it('requests the right resources and parts', async () => {
    const { fetchImpl, calls } = createPagedFetch({ pagesPerResource: 1 })
    await createYouTubeClient({ fetchImpl }).fetchActivity('token')

    const byResource = Object.fromEntries(calls.map(({ url }) => [url.pathname.split('/').pop(), url.searchParams]))
    expect(byResource.videos.get('myRating')).toBe('like')
    expect(byResource.videos.get('part')).toBe('snippet,contentDetails,topicDetails')
    expect(byResource.subscriptions.get('mine')).toBe('true')
    expect(byResource.playlists.get('mine')).toBe('true')
  })

  it('follows pages and stops at the limits (200 likes, 200 subscriptions, 50 playlists)', async () => {
    const { fetchImpl, calls } = createPagedFetch()
    const activity = await createYouTubeClient({ fetchImpl }).fetchActivity('token')

    expect(activity.likedVideos).toHaveLength(200)
    expect(activity.subscriptions).toHaveLength(200)
    expect(activity.playlists).toHaveLength(50)
    // 4 + 4 + 1 requests: about 9 quota units.
    expect(calls).toHaveLength(9)
  })

  it('stops early when YouTube has no more pages', async () => {
    const { fetchImpl } = createPagedFetch({ pageSize: 7, pagesPerResource: 1 })
    const activity = await createYouTubeClient({ fetchImpl }).fetchActivity('token')

    expect(activity.likedVideos).toHaveLength(7)
  })

  it('maps 401 to YOUTUBE_NOT_CONNECTED', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fetchImpl = vi.fn(async () => errorResponse(401, 'authError'))

    await expect(createYouTubeClient({ fetchImpl }).fetchActivity('token')).rejects.toMatchObject({
      statusCode: 401,
      code: 'YOUTUBE_NOT_CONNECTED',
    })
  })

  it('maps quota errors to a user-facing 503', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fetchImpl = vi.fn(async () => errorResponse(403, 'quotaExceeded'))

    await expect(createYouTubeClient({ fetchImpl }).fetchActivity('token')).rejects.toMatchObject({
      statusCode: 503,
      code: 'YOUTUBE_QUOTA_EXCEEDED',
      expose: true,
    })
  })

  it('maps other 403s to YOUTUBE_FORBIDDEN', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fetchImpl = vi.fn(async () => errorResponse(403, 'youtubeSignupRequired'))

    await expect(createYouTubeClient({ fetchImpl }).fetchActivity('token')).rejects.toMatchObject({
      code: 'YOUTUBE_FORBIDDEN',
    })
  })

  it('times out slow requests', async () => {
    // Never resolves on its own; only the abort signal ends it.
    const fetchImpl = vi.fn(
      (url, { signal }) => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason))),
    )

    await expect(createYouTubeClient({ fetchImpl, timeoutMs: 20 }).fetchActivity('token')).rejects.toMatchObject({
      statusCode: 504,
      code: 'YOUTUBE_TIMEOUT',
    })
  })

  it('reports network failures without leaking details', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('fetch failed')
    })

    await expect(createYouTubeClient({ fetchImpl }).fetchActivity('token')).rejects.toMatchObject({
      statusCode: 502,
      code: 'YOUTUBE_UNAVAILABLE',
      message: 'Could not reach YouTube. Please try again in a moment.',
    })
  })

  it('never logs the access token', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fetchImpl = vi.fn(async () => errorResponse(500, 'backendError'))

    await createYouTubeClient({ fetchImpl })
      .fetchActivity('secret-token')
      .catch(() => {})

    expect(warnSpy).toHaveBeenCalled()
    expect(JSON.stringify(warnSpy.mock.calls)).not.toContain('secret-token')
  })
})
