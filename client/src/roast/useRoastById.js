import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../lib/apiClient.js'

const LOADING = { status: 'loading', roast: null, errorMessage: null }

async function fetchRoast(id, signal) {
  try {
    const { roast } = await apiRequest(`/api/roasts/${encodeURIComponent(id)}`, { signal })
    return { status: 'ready', roast, errorMessage: null }
  } catch (error) {
    if (error.name === 'AbortError') return null
    // The server answers 404 both for missing roasts and for other people's roasts.
    if (error.status === 404) return { status: 'notFound', roast: null, errorMessage: null }
    return { status: 'error', roast: null, errorMessage: error.message }
  }
}

/** One roast by ID. status: 'loading' | 'ready' | 'notFound' | 'error' */
export function useRoastById(id) {
  // Keyed by id, so navigating between roasts shows the loading state instead of the previous roast.
  const [state, setState] = useState({ ...LOADING, id })
  const current = state.id === id ? state : { ...LOADING, id }

  useEffect(() => {
    const controller = new AbortController()
    fetchRoast(id, controller.signal).then((next) => next && setState({ ...next, id }))
    return () => controller.abort()
  }, [id])

  const retry = useCallback(() => {
    setState({ ...LOADING, id })
    fetchRoast(id).then((next) => next && setState({ ...next, id }))
  }, [id])

  const remove = useCallback(async () => {
    await apiRequest(`/api/roasts/${encodeURIComponent(id)}`, { method: 'DELETE' })
  }, [id])

  return { ...current, retry, remove }
}
