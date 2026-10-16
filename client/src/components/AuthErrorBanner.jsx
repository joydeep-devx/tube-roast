import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { useEffect, useState } from 'react'
import { CrossIcon } from './Icons.jsx'

const MESSAGES = {
  denied: 'Sign-in was cancelled, so nothing was shared. You can try again whenever you like.',
  failed: 'Something went wrong while signing in with Google. Please try again.',
}

// The server redirects to /?authError=denied|failed when sign-in doesn't work out.
function readAuthError() {
  const reason = new URLSearchParams(window.location.search).get('authError')
  return reason ? (MESSAGES[reason] ?? MESSAGES.failed) : null
}

function AuthErrorBanner() {
  const [message, setMessage] = useState(readAuthError)

  useEffect(() => {
    // Remove ?authError from the address bar so a refresh doesn't show the message again.
    const url = new URL(window.location.href)
    if (url.searchParams.has('authError')) {
      url.searchParams.delete('authError')
      window.history.replaceState(null, '', url)
    }
  }, [])

  return (
    <AnimatePresence>
      {message && (
        <m.div
          role="alert"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mx-auto mt-4 flex max-w-6xl items-start gap-3 px-4 sm:px-6"
        >
          <div className="flex w-full items-start gap-3 rounded-xl border border-accent/40 bg-accent-strong/10 px-4 py-3 text-sm">
            <p className="flex-1">{message}</p>
            <button
              type="button"
              onClick={() => setMessage(null)}
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

export default AuthErrorBanner
