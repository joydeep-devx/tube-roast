import { Link, useNavigate, useParams } from 'react-router'
import CopyRoastButton from '../components/roast/CopyRoastButton.jsx'
import DeleteRoastButton from '../components/roast/DeleteRoastButton.jsx'
import RoastPreviewCard from '../components/landing/RoastPreviewCard.jsx'
import { formatFullDate, formatRelativeTime } from '../lib/relativeTime.js'
import { toRoastCard } from '../roast/toRoastCard.js'
import { useRoastById } from '../roast/useRoastById.js'
import { traitLabel } from '../youtube/traitLabels.js'
import { UnavailableMessage } from './NotFoundPage.jsx'

function BackLink() {
  return (
    <Link to="/history" className="inline-flex items-center gap-1 rounded-md text-sm text-muted hover:text-ink">
      <span aria-hidden="true">←</span> Your roasts
    </Link>
  )
}

function RoastDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { status, roast, errorMessage, retry, remove } = useRoastById(id)

  if (status === 'notFound') {
    return (
      <>
        <title>Roast not found · TubeRoast</title>
        <UnavailableMessage title="This roast isn't available" message="It may have been deleted, or the link is wrong." />
      </>
    )
  }

  if (status === 'error') {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <BackLink />
        <div role="alert" className="mt-6 rounded-2xl border border-accent/40 bg-accent-strong/10 p-6">
          <p>{errorMessage}</p>
          <button type="button" onClick={retry} className="mt-4 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-surface-raised">
            Try again
          </button>
        </div>
      </section>
    )
  }

  if (status === 'loading') {
    return (
      <section aria-busy="true" aria-label="Loading roast" className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <BackLink />
        <span aria-hidden="true" className="mt-6 block aspect-video animate-pulse rounded-2xl bg-surface-raised" />
      </section>
    )
  }

  async function handleDelete() {
    await remove()
    navigate('/history', { replace: true })
  }

  const { totals, traits } = roast.snapshot

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <title>{`${roast.headline} · TubeRoast`}</title>
      <BackLink />

      <div className="mt-6">
        <RoastPreviewCard roast={toRoastCard(roast)} />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted">
          Roasted{' '}
          <time dateTime={roast.createdAt} title={formatFullDate(roast.createdAt)}>
            {formatRelativeTime(roast.createdAt)}
          </time>{' '}
          from {totals.likedVideos} liked videos, {totals.subscriptions} subscriptions and {totals.playlists} playlists.
        </p>
        <div className="flex flex-wrap gap-2">
          <CopyRoastButton roast={roast} />
          <DeleteRoastButton onDelete={handleDelete} />
        </div>
      </div>

      {traits.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold">What we noticed back then</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {traits.map((trait) => (
              <li key={trait} className="rounded-full border border-accent/40 bg-accent-strong/10 px-3 py-1 text-xs font-medium">
                {traitLabel(trait)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

export default RoastDetailPage
