import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../lib/apiClient.js'

const IDLE = { status: 'idle', summary: null, errorMessage: null }
const CHECKING = { status: 'checking', summary: null, errorMessage: null }
const DISCONNECTED = { status: 'disconnected', summary: null, errorMessage: null }

/** Asks the server about the connection and returns the next state. Returns null if aborted. */
async function fetchConnectionState(signal) {
  try {
    const { connected } = await apiRequest('/api/youtube/status', { signal })
    if (!connected) return DISCONNECTED

    const summary = await apiRequest('/api/youtube/activity', { signal })
    return { status: 'connected', summary, errorMessage: null }
  } catch (error) {
    if (error.name === 'AbortError') return null
    if (error.code === 'YOUTUBE_NOT_CONNECTED') return DISCONNECTED
    return { status: 'error', summary: null, errorMessage: error.message }
  }
}

/**
 * Tracks the signed-in user's YouTube connection and, once connected, the activity summary.
 * status: 'idle' (not signed in or not checked yet) | 'checking' | 'disconnected' | 'connected' | 'error'
 */
export function useYouTubeConnection(authStatus) {
  const [state, setState] = useState(IDLE)
  const isSignedIn = authStatus === 'signedIn'

  useEffect(() => {
    if (!isSignedIn) return undefined
    // Aborting on cleanup prevents a stale response from updating state.
    const controller = new AbortController()
    fetchConnectionState(controller.signal).then((next) => next && setState(next))
    return () => controller.abort()
  }, [isSignedIn])

  const disconnect = useCallback(async () => {
    await apiRequest('/api/youtube/connection', { method: 'DELETE' })
    setState(DISCONNECTED)
  }, [])

  const retry = useCallback(() => {
    setState(CHECKING)
    fetchConnectionState().then((next) => next && setState(next))
  }, [])

  // Signed out: always report idle, whatever was loaded before.
  return { ...(isSignedIn ? state : IDLE), disconnect, retry }
}
