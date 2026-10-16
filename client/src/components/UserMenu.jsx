import { useState } from 'react'
import { NavLink } from 'react-router'
import { useAuth } from '../auth/useAuth.js'
import GoogleSignInButton from './GoogleSignInButton.jsx'

function Avatar({ user }) {
  const [imageFailed, setImageFailed] = useState(false)

  if (!user.avatarUrl || imageFailed) {
    return (
      <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-accent-strong text-sm font-semibold text-white">
        {user.displayName.charAt(0).toUpperCase()}
      </span>
    )
  }

  return (
    <img
      src={user.avatarUrl}
      alt=""
      // Google profile images can refuse requests that carry a Referer header.
      referrerPolicy="no-referrer"
      onError={() => setImageFailed(true)}
      className="size-8 rounded-full object-cover"
    />
  )
}

function UserMenu() {
  const { status, user, signOut } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  if (status === 'loading') {
    return <span aria-hidden="true" className="block size-8 animate-pulse rounded-full bg-surface-raised" />
  }

  if (status !== 'signedIn') {
    return <GoogleSignInButton label="Sign in" />
  }

  async function handleSignOut() {
    setIsSigningOut(true)
    try {
      await signOut()
    } catch {
      setIsSigningOut(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <NavLink
        to="/history"
        className={({ isActive }) =>
          `rounded-md px-1 py-1 text-sm font-medium transition-colors hover:text-ink ${isActive ? 'text-ink' : 'text-muted'}`
        }
      >
        History
      </NavLink>
      <Avatar user={user} />
      <span className="hidden max-w-40 truncate text-sm font-medium lg:inline">{user.displayName}</span>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="rounded-full border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:bg-surface-raised hover:text-ink disabled:opacity-60"
      >
        {isSigningOut ? 'Signing out…' : 'Sign out'}
      </button>
    </div>
  )
}

export default UserMenu
