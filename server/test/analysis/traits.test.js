import { describe, expect, it } from 'vitest'
import { computeTraits, THRESHOLDS } from '../../src/analysis/traits.js'

// Metrics for a "boring" viewer that triggers no trait; each test changes only what it needs.
const baseMetrics = () => ({
  totals: { likedVideos: 100, subscriptions: 50, playlists: 3 },
  channelStats: { distinctChannels: 60, topChannelShare: 0.05 },
  categoryStats: { sampleSize: 100, distinct: 4, topShare: 0.35 },
  videoLength: { sampleSize: 100, shortFormShare: 0.1, longFormShare: 0.05 },
  nostalgia: { sampleSize: 100, medianVideoAgeYears: 3, olderThan10YearsShare: 0.05 },
  commitment: { likedChannelsNotSubscribed: 10, subscribedNeverLiked: 20 },
  playlists: { largest: { title: 'x', items: 20 }, emptyCount: 0 },
  likesCapped: false,
})

const traitsWith = (changes) => {
  const metrics = baseMetrics()
  for (const [path, value] of Object.entries(changes)) {
    const [group, key] = path.split('.')
    if (key) metrics[group][key] = value
    else metrics[group] = value
  }
  return computeTraits(metrics)
}

describe('computeTraits', () => {
  it('returns no traits for an unremarkable viewer', () => {
    expect(computeTraits(baseMetrics())).toEqual([])
  })

  it.each([
    ['likeMachine', { likesCapped: true }],
    ['shortsAddict', { 'videoLength.shortFormShare': THRESHOLDS.shortsAddictShare }],
    ['longFormMarathoner', { 'videoLength.longFormShare': THRESHOLDS.longFormShare }],
    ['channelLoyalist', { 'channelStats.topChannelShare': THRESHOLDS.channelLoyalistShare }],
    ['genreMonogamist', { 'categoryStats.topShare': THRESHOLDS.genreMonogamistShare }],
    ['eclectic', { 'categoryStats.distinct': 6, 'categoryStats.topShare': 0.2 }],
    ['nostalgic', { 'nostalgia.olderThan10YearsShare': THRESHOLDS.nostalgicShare }],
    ['trendChaser', { 'nostalgia.medianVideoAgeYears': 0.2 }],
    ['commitmentIssues', { 'commitment.likedChannelsNotSubscribed': 40 }],
    ['subscriptionHoarder', { 'totals.subscriptions': 150 }],
    ['ghostSubscriber', { 'commitment.subscribedNeverLiked': 45 }],
    ['playlistHoarder', { 'totals.playlists': 10 }],
    ['playlistHoarder', { 'playlists.largest': { title: 'x', items: 250 } }],
    ['emptyPlaylistCollector', { 'playlists.emptyCount': 2 }],
  ])('%s fires at its threshold', (trait, changes) => {
    expect(traitsWith(changes)).toContain(trait)
  })

  it('lurker fires for very few likes, and share-based traits stay quiet without enough data', () => {
    const traits = traitsWith({
      'totals.likedVideos': 4,
      'channelStats.topChannelShare': 0.75,
      'videoLength.sampleSize': 4,
      'videoLength.shortFormShare': 1,
      'categoryStats.sampleSize': 4,
      'categoryStats.topShare': 1,
    })
    expect(traits).toEqual(['lurker'])
  })

  it('returns traits in a stable order', () => {
    const traits = traitsWith({ 'playlists.emptyCount': 3, likesCapped: true, 'videoLength.shortFormShare': 0.9 })
    expect(traits).toEqual(['likeMachine', 'shortsAddict', 'emptyPlaylistCollector'])
  })
})
