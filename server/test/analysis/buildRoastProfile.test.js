import { describe, expect, it } from 'vitest'
import { buildRoastProfile } from '../../src/analysis/buildRoastProfile.js'

const NOW = new Date('2026-10-16T00:00:00Z')
const LIMITS = { likedVideos: 200, subscriptions: 200, playlists: 50 }

let videoCounter = 0
const video = (overrides = {}) => ({
  id: `vid${videoCounter++}`,
  title: 'Some video',
  channelTitle: 'Channel A',
  categoryId: '20',
  tags: [],
  topics: [],
  durationSeconds: 600,
  publishedAt: '2024-10-16T00:00:00Z',
  ...overrides,
})
const repeat = (count, overrides) => Array.from({ length: count }, () => video(overrides))

const build = (activity) =>
  buildRoastProfile({ likedVideos: [], subscriptions: [], playlists: [], ...activity }, { now: NOW, limits: LIMITS })

describe('buildRoastProfile', () => {
  it('ranks channels, categories and topics', () => {
    const profile = build({
      likedVideos: [
        ...repeat(6, { channelTitle: 'Speedrun Archive', categoryId: '20', topics: ['Video game culture'] }),
        ...repeat(3, { channelTitle: 'Lofi Beats', categoryId: '10', topics: ['Music', 'Lifestyle (sociology)'] }),
        video({ channelTitle: 'Cooking Daily', categoryId: '26', topics: ['Lifestyle (sociology)'] }),
      ],
    })

    expect(profile.totals).toEqual({ likedVideos: 10, subscriptions: 0, playlists: 0 })
    expect(profile.topChannels).toEqual([
      { name: 'Speedrun Archive', likes: 6 },
      { name: 'Lofi Beats', likes: 3 },
      { name: 'Cooking Daily', likes: 1 },
    ])
    expect(profile.channelStats).toEqual({ distinctChannels: 3, topChannelShare: 0.6 })
    expect(profile.topCategories).toEqual([
      { name: 'Gaming', share: 0.6 },
      { name: 'Music', share: 0.3 },
      { name: 'Howto & Style', share: 0.1 },
    ])
    expect(profile.topTopics).toEqual([
      { name: 'Video game culture', count: 6 },
      { name: 'Lifestyle', count: 4 },
      { name: 'Music', count: 3 },
    ])
    expect(profile.traits).toEqual(expect.arrayContaining(['channelLoyalist', 'genreMonogamist']))
  })

  it('measures video length, ignoring live streams and unknown durations', () => {
    const profile = build({
      likedVideos: [
        ...repeat(5, { durationSeconds: 30 }),
        ...repeat(4, { durationSeconds: 600 }),
        video({ durationSeconds: 3600 }),
        video({ durationSeconds: 0 }),
        video({ durationSeconds: null }),
      ],
    })

    expect(profile.videoLength).toEqual({ medianMinutes: 5.3, shortFormShare: 0.5, longFormShare: 0.1 })
    expect(profile.traits).toContain('shortsAddict')
  })

  it('measures how old the liked videos are', () => {
    const profile = build({
      likedVideos: [
        ...repeat(4, { publishedAt: '2008-05-01T00:00:00Z' }),
        ...repeat(6, { publishedAt: '2025-10-16T00:00:00Z' }),
        video({ publishedAt: 'not a date' }),
      ],
    })

    expect(profile.nostalgia).toEqual({ medianVideoAgeYears: 1, olderThan10YearsShare: 0.4, oldestVideoYear: 2008 })
    expect(profile.traits).toContain('nostalgic')
  })

  it('compares liked channels with subscriptions, ignoring letter case', () => {
    const profile = build({
      likedVideos: [...repeat(3, { channelTitle: 'Never Subbed' }), ...repeat(2, { channelTitle: 'speedrun archive' })],
      subscriptions: [{ channelTitle: 'Speedrun Archive' }, { channelTitle: 'Forgotten Channel' }],
    })

    expect(profile.commitment).toEqual({
      likedChannelsNotSubscribed: 1,
      subscribedNeverLiked: 1,
      mostLikedNotSubscribed: [{ name: 'Never Subbed', likes: 3 }],
    })
  })

  it('summarizes playlists and sanitizes their user-written titles', () => {
    const profile = build({
      playlists: [
        { title: 'songs for crying', itemCount: 312 },
        { title: 'todo', itemCount: 0 },
        { title: 'call me 98765 43210 https://example.com', itemCount: 0 },
      ],
    })

    expect(profile.playlists).toEqual({
      totalItems: 312,
      largest: { title: 'songs for crying', items: 312 },
      emptyCount: 2,
      sampleTitles: ['songs for crying', 'todo', 'call me'],
    })
    expect(profile.traits).toEqual(expect.arrayContaining(['playlistHoarder', 'emptyPlaylistCollector']))
  })

  it('flags thin data and capped likes', () => {
    expect(build({ likedVideos: repeat(3) }).dataQuality).toEqual({ enoughData: false, likesCapped: false })
    expect(build({ likedVideos: repeat(3) }).traits).toContain('lurker')

    const capped = build({ likedVideos: repeat(200) })
    expect(capped.dataQuality).toEqual({ enoughData: true, likesCapped: true })
    expect(capped.traits).toContain('likeMachine')
  })

  it('handles a completely empty account without crashing', () => {
    const profile = build({})

    expect(profile.totals).toEqual({ likedVideos: 0, subscriptions: 0, playlists: 0 })
    expect(profile.videoLength.medianMinutes).toBeNull()
    expect(profile.nostalgia.oldestVideoYear).toBeNull()
    expect(profile.playlists.largest).toBeNull()
    expect(profile.dataQuality.enoughData).toBe(false)
  })

  it('is deterministic: the same input always gives the same profile', () => {
    const activity = { likedVideos: repeat(20, { tags: ['minecraft', 'speedrun'] }), subscriptions: [], playlists: [] }
    expect(buildRoastProfile(activity, { now: NOW, limits: LIMITS })).toEqual(
      buildRoastProfile(structuredClone(activity), { now: NOW, limits: LIMITS }),
    )
  })

  describe('privacy and size limits', () => {
    // The largest input the YouTube client can ever return, with long, messy strings everywhere.
    const worstCase = {
      likedVideos: Array.from({ length: 200 }, (_, i) =>
        video({
          id: `secret-video-id-${i}`,
          title: `${'Long title word '.repeat(6)}${i} https://youtu.be/secret${i}`,
          channelTitle: `Channel number ${i} with a very long name that keeps going and going on`,
          categoryId: String((i % 30) + 1),
          tags: Array.from({ length: 10 }, (_, t) => `tag${i}-${t}-padding-padding`),
          topics: [`https://en.wikipedia.org/wiki/Topic_${i % 7}`.split('/').pop()],
        }),
      ),
      subscriptions: Array.from({ length: 200 }, (_, i) => ({ channelTitle: `Subscription ${i} ${'x'.repeat(90)}` })),
      playlists: Array.from({ length: 50 }, (_, i) => ({
        title: `Playlist ${i} email me at person${i}@example.com ${'y'.repeat(120)}`,
        itemCount: i,
      })),
    }
    const profile = buildRoastProfile(worstCase, { now: NOW, limits: LIMITS })
    const json = JSON.stringify(profile)

    it('stays under 4 KB even for the largest possible input', () => {
      expect(json.length).toBeLessThan(4096)
    })

    it('contains no video IDs, URLs or email addresses', () => {
      expect(json).not.toMatch(/secret-video-id|youtu\.be|https?:\/\/|@example\.com/)
    })

    it('caps every list', () => {
      expect(profile.topChannels.length).toBeLessThanOrEqual(5)
      expect(profile.topCategories.length).toBeLessThanOrEqual(5)
      expect(profile.topTopics.length).toBeLessThanOrEqual(5)
      expect(profile.keywords.length).toBeLessThanOrEqual(8)
      expect(profile.subscriptionSample.length).toBeLessThanOrEqual(10)
      expect(profile.playlists.sampleTitles.length).toBeLessThanOrEqual(5)
      expect(profile.commitment.mostLikedNotSubscribed.length).toBeLessThanOrEqual(3)
    })

    it('limits every string to 80 characters', () => {
      const strings = JSON.stringify(profile).match(/"(?:[^"\\]|\\.)*"/g)
      for (const value of strings) {
        expect(value.length - 2).toBeLessThanOrEqual(80)
      }
    })
  })
})
