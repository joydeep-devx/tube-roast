import { describe, expect, it } from 'vitest'
import { User } from '../src/models/User.js'

// validate() checks a document against the schema without saving it, so no database is needed.
async function validationErrors(fields) {
  try {
    await new User(fields).validate()
    return {}
  } catch (error) {
    return error.errors
  }
}

const validUser = {
  googleId: '109876543210987654321',
  displayName: 'Test Viewer',
  avatarUrl: 'https://lh3.googleusercontent.com/a/example',
}

describe('User model', () => {
  it('accepts a valid user', async () => {
    expect(await validationErrors(validUser)).toEqual({})
  })

  it('requires googleId and displayName', async () => {
    const errors = await validationErrors({})
    expect(errors.googleId?.kind).toBe('required')
    expect(errors.displayName?.kind).toBe('required')
  })

  it('treats avatarUrl as optional', async () => {
    expect(await validationErrors({ ...validUser, avatarUrl: undefined })).toEqual({})
  })

  it.each(['http://example.com/a.png', 'javascript:alert(1)', 'not a url'])('rejects non-https avatarUrl %s', async (url) => {
    expect((await validationErrors({ ...validUser, avatarUrl: url })).avatarUrl?.message).toBe('avatarUrl must be an https URL')
  })

  it('limits displayName to 100 characters', async () => {
    expect((await validationErrors({ ...validUser, displayName: 'x'.repeat(101) })).displayName?.kind).toBe('maxlength')
  })

  it('trims whitespace from displayName', () => {
    expect(new User({ ...validUser, displayName: '  Test Viewer  ' }).displayName).toBe('Test Viewer')
  })

  it('does not store fields outside the schema', () => {
    const user = new User({ ...validUser, email: 'someone@example.com', accessToken: 'abc' })
    expect(user.get('email')).toBeUndefined()
    expect(user.get('accessToken')).toBeUndefined()
  })

  it('serializes to JSON with a string id and no _id or __v', () => {
    const json = new User(validUser).toJSON()
    expect(json.id).toBeTypeOf('string')
    expect(json).not.toHaveProperty('_id')
    expect(json).not.toHaveProperty('__v')
  })
})
