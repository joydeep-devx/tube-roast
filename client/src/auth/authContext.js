import { createContext } from 'react'

// Holds { status, user, signOut }. status is 'loading' | 'signedIn' | 'signedOut' | 'error'.
export const AuthContext = createContext(null)
