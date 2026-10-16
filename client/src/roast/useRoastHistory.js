import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../lib/apiClient.js'

const LOADING = { status: 'loading', roasts: [], errorMessage: null }

async function fetchHistory(signal) {
  try {
    const { roasts } = await apiRequest('/api/roasts', { signal })
    return { status: 'ready', roasts, errorMessage: null }
  } catch (error) {
    if (error.name === 'AbortError') return null
    return { status: 'error', roasts: [], errorMessage: error.message }
  }
}

/** The signed-in user's saved roasts. status: 'loading' | 'ready' | 'error' */
export function useRoastHistory() {
  const [state, setState] = useState(LOADING)

  useEffect(() => {
    const controller = new AbortController()
    fetchHistory(controller.signal).then((next) => next && setState(next))
    return () => controller.abort()
  }, [])

  const retry = useCallback(() => {
    setState(LOADING)
    fetchHistory().then((next) => next && setState(next))
  }, [])

  // Throws on failure so the delete button can show its own error.
  const remove = useCallback(async (id) => {
    await apiRequest(`/api/roasts/${encodeURIComponent(id)}`, { method: 'DELETE' })
    setState((current) => ({ ...current, roasts: current.roasts.filter((roast) => roast.id !== id) }))
  }, [])

  return { ...state, retry, remove }
}
