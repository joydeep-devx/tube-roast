import { Link } from 'react-router'
import { sampleRoast } from '../../mocks/sampleRoast.js'
import { toRoastCard } from '../../roast/toRoastCard.js'
import { secondaryButtonClass } from '../roast/buttonStyles.js'
import CopyRoastButton from '../roast/CopyRoastButton.jsx'
import RoastCookingCard from './RoastCookingCard.jsx'
import RoastPreviewCard from './RoastPreviewCard.jsx'

/** Right side of the hero: the cooking animation, your latest roast, or the sample. */
function RoastShowcase({ roasts, canRoast }) {
  if (roasts.status === 'generating') {
    return <RoastCookingCard />
  }

  if (!roasts.latest) {
    return <RoastPreviewCard roast={sampleRoast} />
  }

  return (
    <div>
      <RoastPreviewCard roast={toRoastCard(roasts.latest)} />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <Link to="/history" className="rounded-md text-sm font-medium text-muted hover:text-ink">
          See all your roasts <span aria-hidden="true">→</span>
        </Link>
        <div className="flex flex-wrap gap-2">
          <CopyRoastButton roast={roasts.latest} />
          {canRoast && (
            <button type="button" onClick={roasts.generate} className={secondaryButtonClass}>
              Roast me again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default RoastShowcase
