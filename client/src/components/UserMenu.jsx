import { useState } from 'react'
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
      <Avatar user={user} />
      <span className="hidden max-w-40 truncate text-sm font-medium md:inline">{user.displayName}</span>
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
