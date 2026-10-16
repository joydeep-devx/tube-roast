import { useContext } from 'react'
import { AuthContext } from './authContext.js'

export function useAuth() {
  const auth = useContext(AuthContext)
  if (!auth) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return auth
}
