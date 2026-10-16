import { useState } from 'react'
import { sampleRoast } from '../../mocks/sampleRoast.js'
import { roastAsText, toRoastCard } from '../../roast/toRoastCard.js'
import RoastCookingCard from './RoastCookingCard.jsx'
import RoastPreviewCard from './RoastPreviewCard.jsx'

const secondaryButton =
  'rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-raised disabled:opacity-60'

/** Right side of the hero: the cooking animation, your latest roast, or the sample. */
function RoastShowcase({ roasts, canRoast }) {
  const [copied, setCopied] = useState(false)

  if (roasts.status === 'generating') {
    return <RoastCookingCard />
  }

  if (!roasts.latest) {
    return <RoastPreviewCard roast={sampleRoast} />
  }

  async function copyRoast() {
    try {
      await navigator.clipboard.writeText(roastAsText(roasts.latest))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be blocked by browser settings; the roast is still on screen to copy by hand.
    }
  }

  return (
    <div>
      <RoastPreviewCard roast={toRoastCard(roasts.latest)} />
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={copyRoast} className={secondaryButton}>
          <span aria-live="polite">{copied ? 'Copied!' : 'Copy roast'}</span>
        </button>
        {canRoast && (
          <button type="button" onClick={roasts.generate} className={secondaryButton}>
            Roast me again
          </button>
        )}
      </div>
    </div>
  )
}

export default RoastShowcase
