import { describe, expect, it } from 'vitest'
import { median, round, sanitizeText, topCounts } from '../../src/analysis/text.js'

describe('sanitizeText', () => {
  it('removes URLs, emails and long numbers', () => {
    expect(sanitizeText('songs https://example.com/x for www.site.org/y crying')).toBe('songs for crying')
    expect(sanitizeText('send to me@example.com pls')).toBe('send to pls')
    expect(sanitizeText('call 98765 43210 now')).toBe('call now')
  })

  it('keeps short numbers like years', () => {
    expect(sanitizeText('best of 2019')).toBe('best of 2019')
  })

  it('collapses whitespace and truncates with an ellipsis', () => {
    expect(sanitizeText('  a   b  ')).toBe('a b')
    expect(sanitizeText('x'.repeat(100), 10)).toBe(`${'x'.repeat(9)}…`)
  })

  it('handles missing values', () => {
    expect(sanitizeText(undefined)).toBe('')
    expect(sanitizeText(null)).toBe('')
  })
})

describe('median', () => {
  it('handles odd and even lengths without mutating input', () => {
    const input = [5, 1, 3]
    expect(median(input)).toBe(3)
    expect(input).toEqual([5, 1, 3])
    expect(median([4, 1, 3, 2])).toBe(2.5)
  })

  it('returns null for an empty list', () => {
    expect(median([])).toBeNull()
  })
})

describe('topCounts', () => {
  it('sorts by count, then alphabetically for ties', () => {
    expect(topCounts(['b', 'a', 'c', 'c', 'b'], 3)).toEqual([
      ['b', 2],
      ['c', 2],
      ['a', 1],
    ])
  })

  it('respects the limit', () => {
    expect(topCounts(['a', 'b', 'c'], 2)).toHaveLength(2)
  })
})

describe('round', () => {
  it('rounds to the given decimals', () => {
    expect(round(0.12345)).toBe(0.12)
    expect(round(11.46, 1)).toBe(11.5)
  })
})
