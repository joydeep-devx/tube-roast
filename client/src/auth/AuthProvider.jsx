import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../lib/apiClient.js'
import { AuthContext } from './authContext.js'

/**
 * Asks the server who is signed in, once on page load, and shares the answer with the whole app.
 * The browser never sees tokens: the session cookie is HttpOnly, so /api/auth/me is the only way to know.
 */
function AuthProvider({ children }) {
  const [auth, setAuth] = useState({ status: 'loading', user: null })

  useEffect(() => {
    // Aborting on cleanup prevents a stale response from updating state (React StrictMode runs effects twice).
    const controller = new AbortController()

    apiRequest('/api/auth/me', { signal: controller.signal })
      .then(({ user }) => setAuth({ status: 'signedIn', user }))
      .catch((error) => {
        if (error.name === 'AbortError') return
        setAuth({ status: error.status === 401 ? 'signedOut' : 'error', user: null })
      })

    return () => controller.abort()
  }, [])

  const signOut = useCallback(async () => {
    await apiRequest('/api/auth/logout', { method: 'POST' })
    setAuth({ status: 'signedOut', user: null })
  }, [])

  const value = useMemo(() => ({ ...auth, signOut }), [auth, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
