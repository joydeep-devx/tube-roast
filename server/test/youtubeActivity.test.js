import { describe, expect, it } from 'vitest'
import {
  normalizeActivity,
  parseIsoDuration,
  summarizeActivity,
  topicFromWikipediaUrl,
} from '../src/services/youtubeActivity.js'
import { rawYouTubeActivity } from './helpers.js'

describe('parseIsoDuration', () => {
  it.each([
    ['PT15M33S', 933],
    ['PT1H2M3S', 3723],
    ['PT45S', 45],
    ['PT2H', 7200],
    ['P1DT1S', 86_401],
    ['P0D', 0],
  ])('%s → %i seconds', (input, expected) => {
    expect(parseIsoDuration(input)).toBe(expected)
  })

  it.each([undefined, null, '', '15:33', 'PTXM'])('returns null for %s', (input) => {
    expect(parseIsoDuration(input)).toBeNull()
  })
})

describe('topicFromWikipediaUrl', () => {
  it('turns a Wikipedia URL into a readable topic', () => {
    expect(topicFromWikipediaUrl('https://en.wikipedia.org/wiki/Video_game_culture')).toBe('Video game culture')
    expect(topicFromWikipediaUrl('https://en.wikipedia.org/wiki/Hip_hop_music')).toBe('Hip hop music')
  })

  it('decodes encoded characters', () => {
    expect(topicFromWikipediaUrl('https://en.wikipedia.org/wiki/Pok%C3%A9mon')).toBe('Pokémon')
  })

  it('returns null for invalid input', () => {
    expect(topicFromWikipediaUrl('not a url')).toBeNull()
  })
})

describe('normalizeActivity', () => {
  it('keeps only the fields analysis needs', () => {
    const { likedVideos, subscriptions, playlists } = normalizeActivity(rawYouTubeActivity)

    expect(likedVideos[0]).toEqual({
      id: 'vid1',
      title: 'Speedrun any%',
      channelTitle: 'Speedrun Archive',
      categoryId: '20',
      tags: ['speedrun'],
      topics: ['Video game culture'],
      durationSeconds: 933,
      publishedAt: null,
    })
    expect(subscriptions).toEqual([{ channelTitle: 'Ten-Minute Crafts Gone Wrong' }])
    expect(playlists).toEqual([{ title: 'Watch later (for real)', itemCount: 42 }])
  })

  it('fills safe defaults for missing optional parts', () => {
    const [, sparse] = normalizeActivity(rawYouTubeActivity).likedVideos
    expect(sparse).toMatchObject({ tags: [], topics: [], durationSeconds: null, categoryId: null })
  })

  it('drops deleted or private items that come back without a snippet', () => {
    const result = normalizeActivity({
      likedVideos: [{ id: 'gone' }, null, { snippet: { title: 'no id' } }],
      subscriptions: [{ snippet: {} }],
      playlists: [{}],
    })
    expect(result).toEqual({ likedVideos: [], subscriptions: [], playlists: [] })
  })

  it('limits tags to 10 per video and ignores unknown fields', () => {
    const tags = Array.from({ length: 30 }, (_, i) => `tag${i}`)
    const [video] = normalizeActivity({
      likedVideos: [{ id: 'v', snippet: { title: 't', tags, description: 'long text', thumbnails: {} }, statistics: {} }],
    }).likedVideos

    expect(video.tags).toHaveLength(10)
    expect(video).not.toHaveProperty('description')
    expect(video).not.toHaveProperty('statistics')
  })

  it('handles completely empty input', () => {
    expect(normalizeActivity({})).toEqual({ likedVideos: [], subscriptions: [], playlists: [] })
  })
})

describe('summarizeActivity', () => {
  it('returns counts and at most three recent likes', () => {
    const activity = normalizeActivity({
      likedVideos: Array.from({ length: 5 }, (_, i) => ({ id: `v${i}`, snippet: { title: `Video ${i}`, channelTitle: 'C' } })),
    })

    const summary = summarizeActivity(activity)

    expect(summary.counts).toEqual({ likedVideos: 5, subscriptions: 0, playlists: 0 })
    expect(summary.recentLikes).toEqual([
      { title: 'Video 0', channelTitle: 'C' },
      { title: 'Video 1', channelTitle: 'C' },
      { title: 'Video 2', channelTitle: 'C' },
    ])
  })
})
