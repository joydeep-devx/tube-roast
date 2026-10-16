import { describe, expect, it } from 'vitest'
import { loadEnv } from '../src/config/env.js'

// Fake connection string for tests. Not a real host or password.
const validEnv = { MONGO_URI: 'mongodb+srv://test-user:test-pass@example.invalid/' }

describe('loadEnv', () => {
  it('applies defaults when optional variables are missing', () => {
    expect(loadEnv(validEnv)).toEqual({ NODE_ENV: 'development', PORT: 5000, MONGO_URI: validEnv.MONGO_URI })
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

  describe('MONGO_URI', () => {
    it('is required', () => {
      expect(() => loadEnv({})).toThrow(/MONGO_URI: is required/)
    })

    it('rejects a blank value with a single clear message', () => {
      expect(() => loadEnv({ MONGO_URI: '   ' })).toThrow(/^Invalid environment configuration:\n {2}- MONGO_URI: is required$/)
    })

    it('accepts mongodb:// for a local database', () => {
      expect(loadEnv({ MONGO_URI: 'mongodb://localhost:27017' }).MONGO_URI).toBe('mongodb://localhost:27017')
    })

    it('rejects other schemes without echoing the password', () => {
      expect(() => loadEnv({ MONGO_URI: 'https://user:hunter2@example.invalid' })).toThrow(
        expect.objectContaining({ message: expect.not.stringContaining('hunter2') }),
      )
    })
  })
})
