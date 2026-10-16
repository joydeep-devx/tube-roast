import GoogleSignInButton from '../components/GoogleSignInButton.jsx'
import { useAuth } from './useAuth.js'

/**
 * Shows a friendly prompt instead of the page when nobody is signed in.
 * This is UX only: the real protection is requireAuth and the owner-filtered queries on the server.
 */
function RequireAuth({ children, title = 'Sign in to continue', message }) {
  const { status } = useAuth()

  if (status === 'loading') {
    return (
      <div aria-busy="true" aria-label="Loading" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <span aria-hidden="true" className="block h-9 w-56 animate-pulse rounded-lg bg-surface-raised" />
        <span aria-hidden="true" className="mt-4 block h-4 w-80 max-w-full animate-pulse rounded bg-surface-raised" />
      </div>
    )
  }

  if (status === 'signedIn') {
    return children
  }

  return (
    <section className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
      <title>Sign in · TubeRoast</title>
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-3 text-muted">
        {status === 'error'
          ? "We couldn't reach the TubeRoast server. Please try again in a moment."
          : (message ?? 'Sign in with Google to see this page.')}
      </p>
      {status !== 'error' && (
        <div className="mt-8 flex justify-center">
          <GoogleSignInButton size="lg" />
        </div>
      )}
    </section>
  )
}

export default RequireAuth
