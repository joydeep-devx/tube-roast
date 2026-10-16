import { AppError } from '../utils/AppError.js'

const API_BASE = 'https://www.googleapis.com/youtube/v3'
const MAX_PAGE_SIZE = 50

// Enough for a good roast while keeping each fetch at ~9 quota units (daily default: 10,000).
export const FETCH_LIMITS = Object.freeze({ likedVideos: 200, subscriptions: 200, playlists: 50 })

const QUOTA_REASONS = new Set(['quotaExceeded', 'dailyLimitExceeded', 'rateLimitExceeded', 'userRateLimitExceeded'])

// Turns a failed YouTube response into an error with a message written for users.
function toAppError(status, reason) {
  if (status === 401 || reason === 'insufficientPermissions') {
    return new AppError(401, 'Your YouTube connection has expired. Please connect YouTube again.', {
      code: 'YOUTUBE_NOT_CONNECTED',
    })
  }
  if (status === 403 && QUOTA_REASONS.has(reason)) {
    return new AppError(503, "TubeRoast has hit YouTube's daily limit. Please try again tomorrow.", {
      code: 'YOUTUBE_QUOTA_EXCEEDED',
      expose: true,
    })
  }
  if (status === 403) {
    return new AppError(403, "YouTube didn't allow access to this data. Does this Google account have a YouTube channel?", {
      code: 'YOUTUBE_FORBIDDEN',
    })
  }
  return new AppError(502, 'YouTube returned an error. Please try again in a moment.', {
    code: 'YOUTUBE_ERROR',
    expose: true,
  })
}

/**
 * Minimal YouTube Data API v3 client built on fetch. All YouTube-specific HTTP details live here.
 * fetchImpl is injectable so tests can simulate YouTube without network access.
 */
export function createYouTubeClient({ fetchImpl = fetch, timeoutMs = 10_000 } = {}) {
  async function request(resource, params, accessToken) {
    const url = new URL(`${API_BASE}/${resource}`)
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value))
    }

    let response
    try {
      response = await fetchImpl(url, {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch (error) {
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        throw new AppError(504, 'YouTube took too long to respond. Please try again.', {
          code: 'YOUTUBE_TIMEOUT',
          expose: true,
        })
      }
      throw new AppError(502, 'Could not reach YouTube. Please try again in a moment.', {
        code: 'YOUTUBE_UNAVAILABLE',
        expose: true,
        cause: error,
      })
    }

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      const reason = body?.error?.errors?.[0]?.reason
      // Status and reason only: never the URL's headers, which carry the access token.
      console.warn(`[youtube] ${resource} request failed: ${response.status} ${reason ?? 'unknown reason'}`)
      throw toAppError(response.status, reason)
    }

    return response.json()
  }

  // Follows nextPageToken until the limit is reached or YouTube has no more pages.
  async function listUpTo(resource, params, accessToken, limit) {
    const items = []
    let pageToken

    do {
      const page = await request(
        resource,
        { ...params, maxResults: Math.min(MAX_PAGE_SIZE, limit - items.length), pageToken },
        accessToken,
      )
      items.push(...(page.items ?? []))
      pageToken = page.nextPageToken
    } while (pageToken && items.length < limit)

    return items.slice(0, limit)
  }

  return {
    // Raw API items for everything TubeRoast is allowed to read. Normalize before using.
    async fetchActivity(accessToken) {
      const [likedVideos, subscriptions, playlists] = await Promise.all([
        listUpTo(
          'videos',
          { myRating: 'like', part: 'snippet,contentDetails,topicDetails' },
          accessToken,
          FETCH_LIMITS.likedVideos,
        ),
        listUpTo('subscriptions', { mine: true, part: 'snippet' }, accessToken, FETCH_LIMITS.subscriptions),
        listUpTo('playlists', { mine: true, part: 'snippet,contentDetails' }, accessToken, FETCH_LIMITS.playlists),
      ])

      return { likedVideos, subscriptions, playlists }
    },
  }
}
