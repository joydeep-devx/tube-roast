import { sampleRoast } from '../../mocks/sampleRoast.js'
import { FlameIcon } from '../Icons.jsx'
import RoastPreviewCard from './RoastPreviewCard.jsx'

function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-20 sm:px-6 lg:grid-cols-2 lg:pt-20"
    >
      <div>
        <p className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-sm text-muted">
          <FlameIcon className="size-4 text-accent" />
          AI-powered, lovingly brutal
        </p>
        <h1
          id="hero-heading"
          className="mt-5 text-4xl font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl"
        >
          Your YouTube taste, <span className="text-accent">roasted.</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
          Connect your Google account and TubeRoast reads your liked videos, subscriptions and playlists, finds the
          patterns you&apos;d rather not admit, and serves up a personalized roast.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Disabled until Google sign-in exists, so the button never pretends to work. */}
          <button
            type="button"
            disabled
            aria-describedby="cta-note"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-strong px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FlameIcon className="size-5" />
            Roast my YouTube
          </button>
          <a
            href="#sample"
            className="inline-flex items-center justify-center rounded-full border border-border px-6 py-3 font-semibold transition-colors hover:bg-surface-raised"
          >
            See a sample roast
          </a>
        </div>
        <p id="cta-note" className="mt-3 text-sm text-muted">
          Google sign-in is coming soon.
        </p>
      </div>

      <div id="sample" className="scroll-mt-24">
        <RoastPreviewCard roast={sampleRoast} />
      </div>
    </section>
  )
}

export default Hero
