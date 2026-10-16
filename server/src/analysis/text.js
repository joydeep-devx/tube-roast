// Text helpers shared by the analysis. Everything here is deterministic and side-effect free.

const URL_PATTERN = /\b(?:https?:\/\/|www\.)\S+/gi
const EMAIL_PATTERN = /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g
// Long digit runs may be phone or account numbers.
const LONG_NUMBER_PATTERN = /\d[\d\s-]{6,}\d/g

/**
 * Removes things that look like personal data from user-written text (e.g. playlist titles)
 * and trims it, so the profile sent to the LLM stays small and impersonal.
 */
export function sanitizeText(value, maxLength = 80) {
  const cleaned = String(value ?? '')
    .replace(URL_PATTERN, '')
    .replace(EMAIL_PATTERN, '')
    .replace(LONG_NUMBER_PATTERN, '')
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength - 1).trimEnd()}…` : cleaned
}

export const round = (value, decimals = 2) => {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export function median(numbers) {
  if (numbers.length === 0) return null
  const sorted = [...numbers].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
}

/** Counts items and returns the top `limit` as [key, count], ties broken alphabetically for stable output. */
export function topCounts(keys, limit) {
  const counts = new Map()
  for (const key of keys) {
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort(([keyA, countA], [keyB, countB]) => countB - countA || keyA.localeCompare(keyB))
    .slice(0, limit)
}
