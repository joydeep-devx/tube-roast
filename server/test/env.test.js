import { describe, expect, it } from 'vitest'
import { loadEnv } from '../src/config/env.js'

describe('loadEnv', () => {
  it('applies defaults when variables are missing', () => {
    expect(loadEnv({})).toEqual({ NODE_ENV: 'development', PORT: 5000 })
  })

  it('converts PORT from a string to a number', () => {
    expect(loadEnv({ PORT: '8080' }).PORT).toBe(8080)
  })

  it('rejects an invalid PORT and names the variable', () => {
    expect(() => loadEnv({ PORT: '99999' })).toThrow(/PORT/)
  })

  it('rejects an unknown NODE_ENV', () => {
    expect(() => loadEnv({ NODE_ENV: 'staging' })).toThrow(/NODE_ENV/)
  })

  it('does not echo the invalid value in the error message', () => {
    expect(() => loadEnv({ PORT: 'super-secret-value' })).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining('super-secret-value') }),
    )
  })

  it('returns a frozen object so config cannot be changed at runtime', () => {
    expect(Object.isFrozen(loadEnv({}))).toBe(true)
  })
})
