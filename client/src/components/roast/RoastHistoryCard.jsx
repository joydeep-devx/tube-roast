import * as m from 'motion/react-m'
import { Link } from 'react-router'
import { formatFullDate, formatRelativeTime } from '../../lib/relativeTime.js'
import { fadeUp } from '../../lib/motion.js'
import { toRoastCard } from '../../roast/toRoastCard.js'
import { traitLabel } from '../../youtube/traitLabels.js'
import DeleteRoastButton from './DeleteRoastButton.jsx'

/** A roast in the history grid, styled like a video in a YouTube feed. */
function RoastHistoryCard({ roast, onDelete }) {
  const card = toRoastCard(roast)

  return (
    <m.li variants={fadeUp} className="flex min-w-0 flex-col">
      <Link
        to={`/roasts/${roast.id}`}
        className="group block rounded-2xl focus-visible:outline-offset-4"
        aria-label={`${roast.headline}. ${roast.verdict}`}
      >
        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-accent-strong via-[#5c0f16] to-surface-raised p-4 transition-transform duration-300 group-hover:scale-[1.02]">
          <p aria-hidden="true" className="line-clamp-3 text-center text-lg leading-tight font-extrabold text-balance">
            {roast.headline}
          </p>
          <span aria-hidden="true" className="absolute right-2 bottom-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium">
            {card.durationLabel}
          </span>
        </div>
        <div className="mt-3 min-w-0">
          <h2 className="line-clamp-2 leading-snug font-semibold group-hover:text-accent">{roast.headline}</h2>
          <p className="mt-1 truncate text-sm text-muted">{roast.verdict}</p>
          <p className="mt-0.5 text-sm text-muted">
            <time dateTime={roast.createdAt} title={formatFullDate(roast.createdAt)}>
              {formatRelativeTime(roast.createdAt)}
            </time>
          </p>
        </div>
      </Link>

      {/* Footer: the grid stretches every card in a row to the tallest one; mt-auto gives the leftover
          height to the space above the footer, so chips and Delete line up across cards. pt-3 keeps a minimum gap. */}
      <div data-testid="roast-card-footer" className="mt-auto pt-3">
        {roast.snapshot.traits.length > 0 && (
          <ul aria-label="Traits" className="mb-3 flex flex-wrap gap-1.5">
            {roast.snapshot.traits.slice(0, 3).map((trait) => (
              <li key={trait} className="rounded-full bg-surface-raised px-2 py-0.5 text-xs text-muted">
                {traitLabel(trait)}
              </li>
            ))}
          </ul>
        )}
        <DeleteRoastButton onDelete={onDelete} />
      </div>
    </m.li>
  )
}

export default RoastHistoryCard
