import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { useEffect, useState } from 'react'
import { CheckIcon, CrossIcon } from './Icons.jsx'

const ERROR_MESSAGES = {
  denied: 'Sign-in was cancelled, so nothing was shared. You can try again whenever you like.',
  failed: 'Something went wrong while talking to Google. Please try again.',
  youtube_denied: "YouTube access wasn't granted, so there's nothing to roast yet. You can connect again whenever you're ready.",
  youtube_account_mismatch:
    'That YouTube account belongs to a different Google account than the one you signed in with. Please choose the same account.',
}

const SUCCESS_MESSAGES = {
  connected: "YouTube connected! Here's what TubeRoast can see.",
}

// The server redirects back with ?authError=… or ?youtube=connected after a trip to Google.
const URL_PARAMS = ['authError', 'youtube']

function readStatusFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const error = params.get('authError')
  if (error) {
    return { tone: 'error', message: ERROR_MESSAGES[error] ?? ERROR_MESSAGES.failed }
  }
  const success = SUCCESS_MESSAGES[params.get('youtube')]
  return success ? { tone: 'success', message: success } : null
}

const TONE_STYLES = {
  error: 'border-accent/40 bg-accent-strong/10',
  success: 'border-emerald-400/40 bg-emerald-400/10',
}

function StatusBanner() {
  const [status, setStatus] = useState(readStatusFromUrl)

  useEffect(() => {
    // Clean the address bar so a refresh doesn't show the message again.
    const url = new URL(window.location.href)
    if (URL_PARAMS.some((param) => url.searchParams.has(param))) {
      URL_PARAMS.forEach((param) => url.searchParams.delete(param))
      window.history.replaceState(null, '', url)
    }
  }, [])

  return (
    <AnimatePresence>
      {status && (
        <m.div
          role={status.tone === 'error' ? 'alert' : 'status'}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mx-auto mt-4 flex max-w-6xl items-start gap-3 px-4 sm:px-6"
        >
          <div className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-sm ${TONE_STYLES[status.tone]}`}>
            {status.tone === 'success' && <CheckIcon className="mt-0.5 size-4 shrink-0 text-emerald-400" />}
            <p className="flex-1">{status.message}</p>
            <button
              type="button"
              onClick={() => setStatus(null)}
              aria-label="Dismiss message"
              className="rounded-md p-0.5 text-muted hover:text-ink"
            >
              <CrossIcon className="size-4" />
            </button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  )
}

export default StatusBanner
