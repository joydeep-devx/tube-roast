import { extractKeywords } from './keywords.js'
import { median, round, sanitizeText, topCounts } from './text.js'
import { computeTraits } from './traits.js'
import { categoryName } from './youtubeCategories.js'

const TOP_LIST_SIZE = 5
const SHORT_FORM_MAX_SECONDS = 60
const LONG_FORM_MIN_SECONDS = 40 * 60
const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000
const MIN_ITEMS_FOR_ENOUGH_DATA = 10

const share = (part, whole) => (whole > 0 ? round(part / whole) : 0)
const normalizeName = (name) => name.trim().toLowerCase()
// "Lifestyle (sociology)" → "Lifestyle"
const cleanTopic = (topic) => topic.replace(/\s*\([^)]*\)$/, '')

function analyzeChannels(videos) {
  const names = videos.map((video) => video.channelTitle).filter(Boolean)
  const top = topCounts(names, TOP_LIST_SIZE)
  return {
    topChannels: top.map(([name, likes]) => ({ name: sanitizeText(name), likes })),
    channelStats: {
      distinctChannels: new Set(names).size,
      topChannelShare: share(top[0]?.[1] ?? 0, videos.length),
    },
    likesByChannel: topCounts(names, Infinity),
  }
}

function analyzeCategories(videos) {
  const names = videos.map((video) => categoryName(video.categoryId)).filter(Boolean)
  const top = topCounts(names, TOP_LIST_SIZE)
  return {
    topCategories: top.map(([name, count]) => ({ name, share: share(count, names.length) })),
    categoryStats: { sampleSize: names.length, distinct: new Set(names).size, topShare: share(top[0]?.[1] ?? 0, names.length) },
  }
}

function analyzeTopics(videos) {
  // Each topic counts once per video.
  const topics = videos.flatMap((video) => [...new Set((video.topics ?? []).map(cleanTopic))])
  return topCounts(topics, TOP_LIST_SIZE).map(([name, count]) => ({ name: sanitizeText(name), count }))
}

function analyzeVideoLength(videos) {
  // Duration 0 means a live stream or premiere; it says nothing about attention span.
  const durations = videos.map((video) => video.durationSeconds).filter((seconds) => seconds > 0)
  return {
    sampleSize: durations.length,
    medianMinutes: durations.length ? round(median(durations) / 60, 1) : null,
    shortFormShare: share(durations.filter((s) => s <= SHORT_FORM_MAX_SECONDS).length, durations.length),
    longFormShare: share(durations.filter((s) => s >= LONG_FORM_MIN_SECONDS).length, durations.length),
  }
}

function analyzeNostalgia(videos, now) {
  const publishTimes = videos.map((video) => Date.parse(video.publishedAt)).filter((time) => !Number.isNaN(time))
  const ages = publishTimes.map((time) => Math.max(0, now.getTime() - time) / YEAR_MS)
  return {
    sampleSize: ages.length,
    medianVideoAgeYears: ages.length ? round(median(ages), 1) : null,
    olderThan10YearsShare: share(ages.filter((age) => age >= 10).length, ages.length),
    oldestVideoYear: publishTimes.length ? new Date(Math.min(...publishTimes)).getUTCFullYear() : null,
  }
}

function analyzeCommitment(likesByChannel, subscriptions) {
  const subscribed = new Set(subscriptions.map((sub) => normalizeName(sub.channelTitle)))
  const liked = new Set(likesByChannel.map(([name]) => normalizeName(name)))
  const notSubscribed = likesByChannel.filter(([name]) => !subscribed.has(normalizeName(name)))

  return {
    likedChannelsNotSubscribed: notSubscribed.length,
    subscribedNeverLiked: [...subscribed].filter((name) => !liked.has(name)).length,
    // "You liked 12 of their videos and still didn't subscribe."
    mostLikedNotSubscribed: notSubscribed
      .filter(([, likes]) => likes >= 2)
      .slice(0, 3)
      .map(([name, likes]) => ({ name: sanitizeText(name), likes })),
  }
}

function analyzePlaylists(playlists) {
  const largest = playlists.reduce((best, playlist) => (playlist.itemCount > (best?.itemCount ?? -1) ? playlist : best), null)
  return {
    totalItems: playlists.reduce((sum, playlist) => sum + playlist.itemCount, 0),
    largest: largest ? { title: sanitizeText(largest.title), items: largest.itemCount } : null,
    emptyCount: playlists.filter((playlist) => playlist.itemCount === 0).length,
    sampleTitles: playlists.slice(0, TOP_LIST_SIZE).map((playlist) => sanitizeText(playlist.title)).filter(Boolean),
  }
}

/**
 * Turns normalized YouTube activity into the compact "roast profile": aggregates, public channel names
 * and sanitized playlist titles only. No IDs, URLs or descriptions. This is all the LLM will ever see.
 *
 * Pure and deterministic: pass `now` to get the same output for the same input (tests rely on this).
 */
export function buildRoastProfile(activity, { now = new Date(), limits } = {}) {
  const { likedVideos, subscriptions, playlists } = activity
  const totals = { likedVideos: likedVideos.length, subscriptions: subscriptions.length, playlists: playlists.length }

  const { topChannels, channelStats, likesByChannel } = analyzeChannels(likedVideos)
  const { topCategories, categoryStats } = analyzeCategories(likedVideos)
  const videoLength = analyzeVideoLength(likedVideos)
  const nostalgia = analyzeNostalgia(likedVideos, now)
  const commitment = analyzeCommitment(likesByChannel, subscriptions)
  const playlistStats = analyzePlaylists(playlists)
  const likesCapped = Boolean(limits) && totals.likedVideos >= limits.likedVideos

  const traits = computeTraits({
    totals,
    channelStats,
    categoryStats,
    videoLength,
    nostalgia,
    commitment,
    playlists: playlistStats,
    likesCapped,
  })

  return {
    totals,
    topChannels,
    channelStats,
    topCategories,
    topTopics: analyzeTopics(likedVideos),
    keywords: extractKeywords(likedVideos),
    videoLength: {
      medianMinutes: videoLength.medianMinutes,
      shortFormShare: videoLength.shortFormShare,
      longFormShare: videoLength.longFormShare,
    },
    nostalgia: {
      medianVideoAgeYears: nostalgia.medianVideoAgeYears,
      olderThan10YearsShare: nostalgia.olderThan10YearsShare,
      oldestVideoYear: nostalgia.oldestVideoYear,
    },
    commitment,
    subscriptionSample: subscriptions.slice(0, 10).map((sub) => sanitizeText(sub.channelTitle)),
    playlists: playlistStats,
    traits,
    dataQuality: {
      enoughData: totals.likedVideos + totals.subscriptions >= MIN_ITEMS_FOR_ENOUGH_DATA,
      likesCapped,
    },
  }
}
