import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../lib/apiClient.js'

const INITIAL = { status: 'idle', latest: null, error: null }

/**
 * Loads the signed-in user's latest roast and creates new ones.
 * status: 'idle' (signed out or not loaded) | 'ready' | 'generating'
 * error: { message, code } from the last failed generate(), cleared on the next attempt.
 */
export function useRoasts(authStatus) {
  const [state, setState] = useState(INITIAL)
  const isSignedIn = authStatus === 'signedIn'

  useEffect(() => {
    if (!isSignedIn) return undefined
    const controller = new AbortController()
    apiRequest('/api/roasts', { signal: controller.signal })
      .then(({ roasts }) => setState({ status: 'ready', latest: roasts[0] ?? null, error: null }))
      .catch((error) => {
        // History is a nice-to-have on the landing page: if it fails, just show the sample roast.
        if (error.name !== 'AbortError') setState({ status: 'ready', latest: null, error: null })
      })
    return () => controller.abort()
  }, [isSignedIn])

  const generate = useCallback(async () => {
    setState((current) => ({ ...current, status: 'generating', error: null }))
    try {
      const { roast } = await apiRequest('/api/roasts', { method: 'POST' })
      setState({ status: 'ready', latest: roast, error: null })
    } catch (error) {
      setState((current) => ({ ...current, status: 'ready', error: { message: error.message, code: error.code } }))
    }
  }, [])

  return { ...(isSignedIn ? state : INITIAL), generate }
}
