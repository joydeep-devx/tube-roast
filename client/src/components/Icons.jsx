// Small inline SVG icons. They are decorative, so they are hidden from screen readers.

export function PlayIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`fill-current ${className}`}>
      <path d="M8 5.1v13.8a.9.9 0 0 0 1.4.8l10.7-6.9a.9.9 0 0 0 0-1.6L9.4 4.3A.9.9 0 0 0 8 5.1Z" />
    </svg>
  )
}

export function FlameIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`fill-current ${className}`}>
      <path d="M12.8 2.2a.8.8 0 0 0-1.3.6c0 2.6-1.4 4.2-2.9 5.8C7 10.3 5.3 12.1 5.3 15a6.7 6.7 0 0 0 13.4 0c0-3-1.5-5.4-3-7.2-.3-.4-.9-.2-1 .3-.2 1.1-.7 2-1.4 2.6.3-3.2-.4-6.1-.5-8.5Z" />
    </svg>
  )
}

export function CheckIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`fill-none stroke-current ${className}`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  )
}

export function CrossIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`fill-none stroke-current ${className}`} strokeWidth="2.5" strokeLinecap="round">
      <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
    </svg>
  )
}
