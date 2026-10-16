const UNITS = [
  ['year', 365 * 24 * 60 * 60],
  ['month', 30 * 24 * 60 * 60],
  ['week', 7 * 24 * 60 * 60],
  ['day', 24 * 60 * 60],
  ['hour', 60 * 60],
  ['minute', 60],
  ['second', 1],
]

const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

/** "just now", "5 minutes ago", "yesterday", "3 weeks ago" — built into the browser, no date library. */
export function formatRelativeTime(date, now = new Date()) {
  const seconds = Math.round((new Date(date).getTime() - now.getTime()) / 1000)
  if (Math.abs(seconds) < 45) return 'just now'

  const [unit, size] = UNITS.find(([, unitSeconds]) => Math.abs(seconds) >= unitSeconds)
  return formatter.format(Math.round(seconds / size), unit)
}

export function formatFullDate(date) {
  return new Date(date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}
