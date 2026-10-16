import mongoose from 'mongoose'
import { describe, expect, it } from 'vitest'
import { Roast } from '../../src/models/Roast.js'

const validRoast = () => ({
  userId: new mongoose.Types.ObjectId(),
  headline: 'Speedrunner of Sadness',
  roast: 'A roast that is long enough to be valid.',
  verdict: 'Emotional speedrunner',
  model: 'nvidia/test-model',
  snapshot: {
    totals: { likedVideos: 10, subscriptions: 2, playlists: 1 },
    topChannels: [{ name: 'Speedrun Archive', likes: 4 }],
    traits: ['shortsAddict'],
  },
})

// validate() checks the schema without a database connection.
async function errorsFor(fields) {
  try {
    await new Roast(fields).validate()
    return {}
  } catch (error) {
    return error.errors
  }
}

describe('Roast model', () => {
  it('accepts a valid roast', async () => {
    expect(await errorsFor(validRoast())).toEqual({})
  })

  it('requires an owner and the roast text', async () => {
    const errors = await errorsFor({})
    for (const field of ['userId', 'headline', 'roast', 'verdict', 'model', 'snapshot']) {
      expect(errors[field]?.kind, field).toBe('required')
    }
  })

  it('limits lengths', async () => {
    const errors = await errorsFor({ ...validRoast(), roast: 'x'.repeat(701), headline: 'x'.repeat(91) })
    expect(errors.roast?.kind).toBe('maxlength')
    expect(errors.headline?.kind).toBe('maxlength')
  })

  it('keeps at most 3 top channels in the snapshot', async () => {
    const roast = validRoast()
    roast.snapshot.topChannels = Array.from({ length: 4 }, (_, i) => ({ name: `C${i}`, likes: 1 }))
    expect(Object.keys(await errorsFor(roast))).toContain('snapshot.topChannels')
  })

  it('drops fields outside the schema', () => {
    const roast = new Roast({ ...validRoast(), profile: { secret: true }, accessToken: 'abc' })
    expect(roast.get('profile')).toBeUndefined()
    expect(roast.get('accessToken')).toBeUndefined()
  })
})
