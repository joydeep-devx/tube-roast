import { topCounts } from './text.js'

// Common English words plus YouTube title noise that says nothing about someone's taste.
const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'you', 'your', 'are', 'this', 'that', 'from', 'what', 'how', 'why', 'when',
  'who', 'was', 'were', 'have', 'has', 'had', 'not', 'but', 'all', 'can', 'will', 'just', 'its', 'our',
  'out', 'get', 'got', 'one', 'into', 'about', 'more', 'most', 'than', 'then', 'they', 'them', 'their',
  'his', 'her', 'she', 'him', 'too', 'very', 'ever', 'every', 'here', 'there', 'some', 'any', 'off',
  'over', 'under', 'only', 'also', 'like', 'make', 'made', 'does', 'did', 'doing', 'been', 'being',
  'official', 'video', 'videos', 'audio', 'lyrics', 'lyric', 'music', 'full', 'new', 'episode', 'part',
  'feat', 'live', 'version', 'remastered', 'remaster', 'channel', 'subscribe', 'shorts', 'short',
  '1080p', '720p', '4k', 'hd', 'hq', 'ft',
])

const MIN_WORD_LENGTH = 3

/** Splits text into lowercase words (any language's letters and digits), dropping noise. */
export function tokenize(text) {
  const words = String(text ?? '').toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []
  return words.filter((word) => word.length >= MIN_WORD_LENGTH && !STOPWORDS.has(word) && !/^\d+$/.test(word))
}

/**
 * Most repeated words across liked videos' titles and tags. Each word counts once per video,
 * so one video with 30 near-identical tags can't dominate the result.
 */
export function extractKeywords(videos, { limit = 8, minCount = 2 } = {}) {
  const wordsPerVideo = videos.flatMap((video) => [...new Set(tokenize([video.title, ...(video.tags ?? [])].join(' ')))])

  return topCounts(wordsPerVideo, Infinity)
    .filter(([, count]) => count >= minCount)
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }))
}
