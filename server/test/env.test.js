import { describe, expect, it } from 'vitest'
import { loadEnv } from '../src/config/env.js'

// Fake values for tests. Not real hosts, IDs or secrets.
const validEnv = {
  MONGO_URI: 'mongodb+srv://test-user:test-pass@example.invalid/',
  GOOGLE_CLIENT_ID: 'test-client.apps.googleusercontent.com',
  GOOGLE_CLIENT_SECRET: 'test-client-secret',
  GOOGLE_REDIRECT_URI: 'http://localhost:5173/api/auth/google/callback',
  CLIENT_URL: 'http://localhost:5173',
  SESSION_SECRET: 'x'.repeat(32),
}

const without = (key) => {
  const { [key]: _removed, ...rest } = validEnv
  return rest
}

describe('loadEnv', () => {
  it('applies defaults when optional variables are missing', () => {
    expect(loadEnv(validEnv)).toMatchObject({ NODE_ENV: 'development', PORT: 5000 })
  })

  it('converts PORT from a string to a number', () => {
    expect(loadEnv({ ...validEnv, PORT: '8080' }).PORT).toBe(8080)
  })

  it('rejects an invalid PORT and names the variable', () => {
    expect(() => loadEnv({ ...validEnv, PORT: '99999' })).toThrow(/PORT/)
  })

  it('rejects an unknown NODE_ENV', () => {
    expect(() => loadEnv({ ...validEnv, NODE_ENV: 'staging' })).toThrow(/NODE_ENV/)
  })

  it('does not echo the invalid value in the error message', () => {
    expect(() => loadEnv({ ...validEnv, PORT: 'super-secret-value' })).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining('super-secret-value') }),
    )
  })

  it('returns a frozen object so config cannot be changed at runtime', () => {
    expect(Object.isFrozen(loadEnv(validEnv))).toBe(true)
  })

  it.each(['MONGO_URI', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI', 'CLIENT_URL', 'SESSION_SECRET'])(
    'requires %s',
    (key) => {
      expect(() => loadEnv(without(key))).toThrow(new RegExp(`${key}: is required`))
    },
  )

  describe('MONGO_URI', () => {
    it('rejects a blank value with a single clear message', () => {
      expect(() => loadEnv({ ...validEnv, MONGO_URI: '   ' })).toThrow(
        /^Invalid environment configuration:\n {2}- MONGO_URI: is required$/,
      )
    })

    it('accepts mongodb:// for a local database', () => {
      expect(loadEnv({ ...validEnv, MONGO_URI: 'mongodb://localhost:27017' }).MONGO_URI).toBe(
        'mongodb://localhost:27017',
      )
    })

    it('rejects other schemes without echoing the password', () => {
      expect(() => loadEnv({ ...validEnv, MONGO_URI: 'https://user:hunter2@example.invalid' })).toThrow(
        expect.objectContaining({ message: expect.not.stringContaining('hunter2') }),
      )
    })
  })

  describe('Google and session settings', () => {
    it('rejects a client ID that is not an OAuth client ID', () => {
      expect(() => loadEnv({ ...validEnv, GOOGLE_CLIENT_ID: 'AIzaSy-looks-like-an-api-key' })).toThrow(
        /GOOGLE_CLIENT_ID/,
      )
    })

    it('rejects a SESSION_SECRET shorter than 32 characters without echoing it', () => {
      expect(() => loadEnv({ ...validEnv, SESSION_SECRET: 'short-secret' })).toThrow(
        expect.objectContaining({
          message: expect.stringContaining('SESSION_SECRET: must be at least 32 characters'),
        }),
      )
      expect(() => loadEnv({ ...validEnv, SESSION_SECRET: 'short-secret' })).toThrow(
        expect.objectContaining({ message: expect.not.stringContaining('short-secret') }),
      )
    })

    it('rejects a redirect URI that is not a URL', () => {
      expect(() => loadEnv({ ...validEnv, GOOGLE_REDIRECT_URI: 'localhost:5173/callback' })).toThrow(
        /GOOGLE_REDIRECT_URI/,
      )
    })

    it('normalizes CLIENT_URL to its origin (drops a trailing slash)', () => {
      expect(loadEnv({ ...validEnv, CLIENT_URL: 'http://localhost:5173/' }).CLIENT_URL).toBe('http://localhost:5173')
    })
  })
})
