import * as m from 'motion/react-m'
import { useState } from 'react'
import { fadeUp, staggerContainer } from '../../lib/motion.js'
import { CheckIcon } from '../Icons.jsx'

const STATS = [
  { key: 'likedVideos', label: 'liked videos' },
  { key: 'subscriptions', label: 'subscriptions' },
  { key: 'playlists', label: 'playlists' },
]

function YouTubeSummaryCard({ summary, onDisconnect }) {
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  async function handleDisconnect() {
    setIsDisconnecting(true)
    try {
      await onDisconnect()
    } catch {
      setIsDisconnecting(false)
    }
  }

  return (
    <m.section
      aria-labelledby="youtube-summary-heading"
      variants={staggerContainer(0.08)}
      initial="hidden"
      animate="visible"
      className="mt-6 max-w-xl rounded-2xl border border-border bg-surface p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="youtube-summary-heading" className="flex items-center gap-2 font-semibold">
          <CheckIcon className="size-5 text-emerald-400" />
          YouTube connected
        </h2>
        <button
          type="button"
          onClick={handleDisconnect}
          disabled={isDisconnecting}
          className="rounded-md px-2 py-1 text-sm text-muted underline-offset-4 hover:text-ink hover:underline disabled:opacity-60"
        >
          {isDisconnecting ? 'Disconnecting…' : 'Disconnect'}
        </button>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3">
        {STATS.map(({ key, label }) => {
          const count = summary.counts[key]
          const isCapped = count >= summary.limits[key]
          return (
            <m.div key={key} variants={fadeUp} className="rounded-xl bg-surface-raised px-3 py-3 text-center">
              <dt className="sr-only">{label}</dt>
              <dd>
                <span className="block text-2xl font-bold text-ink">
                  {count}
                  {isCapped && <span className="text-accent">+</span>}
                </span>
                <span aria-hidden="true" className="text-xs text-muted">{label}</span>
              </dd>
            </m.div>
          )
        })}
      </dl>

      {summary.recentLikes.length > 0 && (
        <m.div variants={fadeUp} className="mt-4">
          <h3 className="text-sm font-medium text-muted">Recently liked</h3>
          <ul className="mt-2 space-y-1.5">
            {summary.recentLikes.map((video) => (
              <li key={`${video.title}-${video.channelTitle}`} className="truncate text-sm">
                <span className="text-ink">{video.title}</span>
                {video.channelTitle && <span className="text-muted"> · {video.channelTitle}</span>}
              </li>
            ))}
          </ul>
        </m.div>
      )}

      <m.p variants={fadeUp} className="mt-4 text-xs text-muted">
        Read fresh from YouTube just now and not stored. Roasts arrive in the next update.
      </m.p>
    </m.section>
  )
}

export default YouTubeSummaryCard
