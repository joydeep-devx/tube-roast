import { useEffect, useState } from 'react'
import { roastAsText } from '../../roast/toRoastCard.js'
import { secondaryButtonClass } from './buttonStyles.js'

function CopyRoastButton({ roast }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return undefined
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  async function copy() {
    try {
      await navigator.clipboard.writeText(roastAsText(roast))
      setCopied(true)
    } catch {
      // Clipboard can be blocked by browser settings; the roast is still on screen to copy by hand.
    }
  }

  return (
    <button type="button" onClick={copy} className={secondaryButtonClass}>
      <span aria-live="polite">{copied ? 'Copied!' : 'Copy roast'}</span>
    </button>
  )
}

export default CopyRoastButton
