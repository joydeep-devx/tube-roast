import * as m from 'motion/react-m'
import { useId } from 'react'
import { hoverLift } from '../../lib/motion.js'
import { FlameIcon } from '../Icons.jsx'

// Presents a roast the way YouTube presents a video: thumbnail, title, meta line.
// Used for both the sample roast and real ones (see roast/toRoastCard.js).
function RoastPreviewCard({ roast }) {
  const titleId = useId()

  return (
    <m.article
      {...hoverLift}
      aria-labelledby={titleId}
      className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/40"
    >
      <div className="relative aspect-video bg-gradient-to-br from-accent-strong via-[#5c0f16] to-surface-raised p-5">
        <span className="absolute top-3 left-3 rounded bg-black/70 px-2 py-0.5 text-xs font-semibold tracking-wide uppercase">
          {roast.badge ?? 'Sample'}
        </span>
        <p
          aria-hidden="true"
          className="flex h-full items-center justify-center text-center text-2xl leading-tight font-extrabold text-balance sm:text-3xl"
        >
          {roast.title}
        </p>
        <span className="absolute right-3 bottom-3 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium">
          <span className="sr-only">Length </span>
          {roast.durationLabel}
        </span>
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
          {/* scaleX instead of width: transforms animate on the GPU without re-calculating layout. */}
          <m.span
            className="block h-full w-full origin-left bg-accent-hover"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 0.66 }}
            transition={{ delay: 0.9, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </span>
      </div>

      <div className="flex gap-3 p-4 sm:p-5">
        <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-raised">
          <FlameIcon className="size-5 text-accent" />
        </span>
        <div className="min-w-0">
          <h2 id={titleId} className="leading-snug font-semibold">
            {roast.title}
          </h2>
          <p className="mt-1 text-sm text-muted">
            TubeRoast · {roast.likedVideoCount} liked videos · {roast.subscriptionCount} subscriptions
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink/90">{roast.roast}</p>

          {roast.verdict && (
            <p className="mt-3 text-sm">
              <span className="font-semibold text-accent">Verdict:</span> {roast.verdict}
            </p>
          )}

          {roast.topChannels.length > 0 && (
            <>
              <h3 className="sr-only">Top channels</h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {roast.topChannels.map((channel) => (
                  <li key={channel} className="rounded-lg bg-surface-raised px-2.5 py-1 text-xs text-ink/90">
                    {channel}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </m.article>
  )
}

export default RoastPreviewCard
