import { useReducedMotion } from 'motion/react'
import * as m from 'motion/react-m'
import { Link } from 'react-router'
import { fadeUp, fadeUpScale, staggerContainer } from '../lib/motion.js'

// Router links with Motion's hover/tap gestures. Created once at module level, never inside a render.
const MotionLink = m.create(Link)

const primaryButton =
  'inline-flex items-center justify-center rounded-full bg-accent-strong px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-hover'
const secondaryButton =
  'inline-flex items-center justify-center rounded-full border border-border px-6 py-3 font-semibold transition-colors hover:bg-surface-raised'
const buttonMotion = { whileHover: { scale: 1.03 }, whileTap: { scale: 0.97 } }

/** A "video" that stalled: the face floats, the progress bar starts and gives up, light sweeps the screen. */
function StalledScreen() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <m.div
      aria-hidden="true"
      variants={fadeUpScale}
      className="relative flex aspect-video w-full max-w-sm items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/40"
    >
      {/* Slow diagonal light sweep, like a screen reflection. */}
      {!prefersReducedMotion && (
        <m.span
          className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          animate={{ x: ['0%', '400%'] }}
          transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
        />
      )}

      <m.svg
        viewBox="0 0 24 24"
        className="size-16 fill-none stroke-muted"
        strokeWidth="1.5"
        strokeLinecap="round"
        animate={prefersReducedMotion ? undefined : { y: [0, -6, 0], rotate: [0, -3, 0, 3, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M9 9.5h.01M15 9.5h.01M8.5 16c1.8-1.6 5.2-1.6 7 0" />
      </m.svg>

      {/* Progress bar that starts loading, then stalls and fades to grey. scaleX animates on the GPU. */}
      <span className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
        <m.span
          className="block h-full w-full origin-left"
          initial={{ scaleX: 0, backgroundColor: '#e5192b' }}
          animate={{ scaleX: 0.28, backgroundColor: '#5c5c5c' }}
          transition={{
            scaleX: { delay: 0.6, duration: 1.2, ease: [0.22, 1, 0.36, 1] },
            backgroundColor: { delay: 2, duration: 0.8 },
          }}
        />
      </span>
    </m.div>
  )
}

/** YouTube-style "video unavailable" screen, used for unknown URLs and missing roasts. */
export function UnavailableMessage({
  title = "This video isn't available",
  message = "The page you're looking for doesn't exist, or it was deleted.",
}) {
  return (
    <m.section
      variants={staggerContainer(0.12)}
      initial="hidden"
      animate="visible"
      className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center sm:px-6"
    >
      <StalledScreen />
      <m.h1 variants={fadeUp} className="mt-8 text-3xl font-bold tracking-tight">
        {title}
      </m.h1>
      <m.p variants={fadeUp} className="mt-3 text-muted">
        {message}
      </m.p>
      <m.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
        <MotionLink to="/" className={primaryButton} {...buttonMotion}>
          Go home
        </MotionLink>
        <MotionLink to="/history" className={secondaryButton} {...buttonMotion}>
          Your roasts
        </MotionLink>
      </m.div>
    </m.section>
  )
}

function NotFoundPage() {
  return (
    <>
      <title>Page not found · TubeRoast</title>
      <UnavailableMessage />
    </>
  )
}

export default NotFoundPage
