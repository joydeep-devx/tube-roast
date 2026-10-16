import { useReducedMotion } from 'motion/react'
import * as m from 'motion/react-m'
import { useEffect, useState } from 'react'
import { FlameIcon } from '../Icons.jsx'

const MESSAGES = [
  'Preheating the roast oven…',
  'Counting your guilty pleasures…',
  'Consulting the comment section…',
  'Sharpening the punchlines…',
  'Adding a pinch of savagery…',
  'Letting it simmer…',
]

/** Shown while a roast is being generated (usually 3–6 seconds). */
function RoastCookingCard() {
  const [index, setIndex] = useState(0)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const timer = setInterval(() => setIndex((current) => (current + 1) % MESSAGES.length), 1600)
    return () => clearInterval(timer)
  }, [])

  return (
    <div
      role="status"
      aria-live="polite"
      className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/40"
    >
      <div className="relative flex aspect-video flex-col items-center justify-center gap-4 bg-gradient-to-br from-accent-strong/80 via-[#5c0f16] to-surface-raised">
        <m.span
          aria-hidden="true"
          animate={prefersReducedMotion ? undefined : { y: [0, -8, 0], scale: [1, 1.12, 1] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
        >
          <FlameIcon className="size-14 text-white" />
        </m.span>
        <m.p
          key={index}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 text-center text-lg font-semibold"
        >
          {MESSAGES[index]}
        </m.p>
      </div>
      <div aria-hidden="true" className="space-y-3 p-5">
        <span className="block h-4 w-3/4 animate-pulse rounded bg-surface-raised" />
        <span className="block h-3 w-1/2 animate-pulse rounded bg-surface-raised" />
        <span className="block h-3 w-full animate-pulse rounded bg-surface-raised" />
        <span className="block h-3 w-5/6 animate-pulse rounded bg-surface-raised" />
      </div>
    </div>
  )
}

export default RoastCookingCard
