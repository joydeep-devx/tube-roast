import { useReducedMotion } from 'motion/react'
import * as m from 'motion/react-m'
import { fadeUp, fadeUpScale, staggerContainer } from '../../lib/motion.js'
import { sampleRoast } from '../../mocks/sampleRoast.js'
import { FlameIcon } from '../Icons.jsx'
import HeroActions from './HeroActions.jsx'
import RoastPreviewCard from './RoastPreviewCard.jsx'

function Hero() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <section
      aria-labelledby="hero-heading"
      className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-20 sm:px-6 lg:grid-cols-2 lg:pt-20"
    >
      <m.div variants={staggerContainer(0.1)} initial="hidden" animate="visible">
        <m.p
          variants={fadeUp}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-sm text-muted"
        >
          <m.span
            className="inline-flex"
            animate={prefersReducedMotion ? undefined : { scale: [1, 1.15, 0.95, 1.1, 1], rotate: [0, -6, 4, -3, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' }}
          >
            <FlameIcon className="size-4 text-accent" />
          </m.span>
          AI-powered, lovingly brutal
        </m.p>
        <m.h1
          id="hero-heading"
          variants={fadeUp}
          className="mt-5 text-4xl font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl"
        >
          Your YouTube taste, <span className="text-accent">roasted.</span>
        </m.h1>
        <m.p variants={fadeUp} className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
          Connect your Google account and TubeRoast reads your liked videos, subscriptions and playlists, finds the
          patterns you&apos;d rather not admit, and serves up a personalized roast.
        </m.p>

        <m.div variants={fadeUp}>
          <HeroActions />
        </m.div>
      </m.div>

      <m.div
        id="sample"
        className="relative isolate scroll-mt-24"
        initial={fadeUpScale.hidden}
        animate={{ ...fadeUpScale.visible, transition: { ...fadeUpScale.visible.transition, delay: 0.35 } }}
      >
        {/* Soft red glow behind the card that slowly "breathes". */}
        <m.div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-accent-strong/25 blur-3xl"
          animate={prefersReducedMotion ? undefined : { opacity: [0.5, 0.9, 0.5], scale: [0.97, 1.02, 0.97] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <RoastPreviewCard roast={sampleRoast} />
      </m.div>
    </section>
  )
}

export default Hero
