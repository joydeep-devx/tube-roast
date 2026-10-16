import * as m from 'motion/react-m'
import { Link } from 'react-router'
import RoastHistoryCard from '../components/roast/RoastHistoryCard.jsx'
import { staggerContainer } from '../lib/motion.js'
import { useRoastHistory } from '../roast/useRoastHistory.js'

// Matches MAX_ROASTS_PER_USER on the server.
const KEPT_ROASTS = 20

const primaryButton =
  'inline-flex items-center justify-center rounded-full bg-accent-strong px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-hover'

function HistorySkeleton() {
  return (
    <ul aria-hidden="true" className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, i) => (
        <li key={i}>
          <span className="block aspect-video animate-pulse rounded-2xl bg-surface-raised" />
          <span className="mt-3 block h-4 w-3/4 animate-pulse rounded bg-surface-raised" />
          <span className="mt-2 block h-3 w-1/2 animate-pulse rounded bg-surface-raised" />
        </li>
      ))}
    </ul>
  )
}

function HistoryPage() {
  const history = useRoastHistory()

  return (
    <section aria-labelledby="history-heading" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <title>Your roasts · TubeRoast</title>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 id="history-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">
            Your roasts
          </h1>
          <p className="mt-2 text-muted">
            {history.status === 'ready' && history.roasts.length > 0
              ? `${history.roasts.length} of your latest ${KEPT_ROASTS} roasts. Older ones are deleted automatically.`
              : `TubeRoast keeps your latest ${KEPT_ROASTS} roasts.`}
          </p>
        </div>
        <Link to="/" className={primaryButton}>
          New roast
        </Link>
      </div>

      {history.status === 'loading' && <HistorySkeleton />}

      {history.status === 'error' && (
        <div role="alert" className="mt-10 rounded-2xl border border-accent/40 bg-accent-strong/10 p-6">
          <p>{history.errorMessage}</p>
          <button type="button" onClick={history.retry} className="mt-4 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-surface-raised">
            Try again
          </button>
        </div>
      )}

      {history.status === 'ready' && history.roasts.length === 0 && (
        <div className="mt-10 rounded-2xl border border-border bg-surface p-10 text-center">
          <h2 className="text-xl font-semibold">No roasts yet</h2>
          <p className="mt-2 text-muted">Your YouTube taste is suspiciously un-roasted. Let&apos;s fix that.</p>
          <Link to="/" className={`${primaryButton} mt-6`}>
            Get roasted
          </Link>
        </div>
      )}

      {history.status === 'ready' && history.roasts.length > 0 && (
        <m.ul
          variants={staggerContainer(0.06)}
          initial="hidden"
          animate="visible"
          className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3"
        >
          {history.roasts.map((roast) => (
            <RoastHistoryCard key={roast.id} roast={roast} onDelete={() => history.remove(roast.id)} />
          ))}
        </m.ul>
      )}
    </section>
  )
}

export default HistoryPage
