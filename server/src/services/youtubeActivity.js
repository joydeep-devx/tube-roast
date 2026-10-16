// Pure functions that reduce raw YouTube API items to the few fields analysis needs.
// Anything not picked here (descriptions, thumbnails, statistics…) is dropped.

const MAX_TAGS_PER_VIDEO = 10

/** ISO 8601 duration → seconds: "PT1H2M3S" → 3723, live streams "P0D" → 0, missing/invalid → null. */
export function parseIsoDuration(value) {
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(value ?? '')
  if (!match) return null
  const [, days, hours, minutes, seconds] = match.map(Number)
  return (days || 0) * 86_400 + (hours || 0) * 3_600 + (minutes || 0) * 60 + (seconds || 0)
}

/** "https://en.wikipedia.org/wiki/Video_game_culture" → "Video game culture" */
export function topicFromWikipediaUrl(url) {
  try {
    const lastSegment = new URL(url).pathname.split('/').pop()
    return decodeURIComponent(lastSegment).replaceAll('_', ' ') || null
  } catch {
    return null
  }
}

function normalizeLikedVideo(item) {
  const snippet = item?.snippet
  if (!item?.id || !snippet?.title) return null

  return {
    id: item.id,
    title: snippet.title,
    channelTitle: snippet.channelTitle ?? null,
    categoryId: snippet.categoryId ?? null,
    tags: (snippet.tags ?? []).slice(0, MAX_TAGS_PER_VIDEO),
    topics: (item.topicDetails?.topicCategories ?? []).map(topicFromWikipediaUrl).filter(Boolean),
    durationSeconds: parseIsoDuration(item.contentDetails?.duration),
    publishedAt: snippet.publishedAt ?? null,
  }
}

function normalizeSubscription(item) {
  const title = item?.snippet?.title
  return title ? { channelTitle: title } : null
}

function normalizePlaylist(item) {
  const title = item?.snippet?.title
  return title ? { title, itemCount: item.contentDetails?.itemCount ?? 0 } : null
}

const normalizeAll = (items, normalize) => (items ?? []).map(normalize).filter(Boolean)

export function normalizeActivity(raw) {
  return {
    likedVideos: normalizeAll(raw.likedVideos, normalizeLikedVideo),
    subscriptions: normalizeAll(raw.subscriptions, normalizeSubscription),
    playlists: normalizeAll(raw.playlists, normalizePlaylist),
  }
}

/** The small, display-only summary the browser receives. */
export function summarizeActivity(activity) {
  return {
    counts: {
      likedVideos: activity.likedVideos.length,
      subscriptions: activity.subscriptions.length,
      playlists: activity.playlists.length,
    },
    recentLikes: activity.likedVideos.slice(0, 3).map(({ title, channelTitle }) => ({ title, channelTitle })),
  }
}
