import * as m from 'motion/react-m'
import { useAuth } from '../../auth/useAuth.js'
import { useYouTubeConnection } from '../../youtube/useYouTubeConnection.js'
import GoogleSignInButton from '../GoogleSignInButton.jsx'
import { FlameIcon, PlayIcon } from '../Icons.jsx'
import YouTubeSummaryCard from './YouTubeSummaryCard.jsx'

const redButton =
  'inline-flex items-center justify-center gap-2 rounded-full bg-accent-strong px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-hover'

function SampleLink() {
  return (
    <m.a
      href="#sample"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="inline-flex items-center justify-center rounded-full border border-border px-6 py-3 font-semibold transition-colors hover:bg-surface-raised"
    >
      See a sample roast
    </m.a>
  )
}

function Note({ children }) {
  return (
    <p id="cta-note" className="mt-3 min-h-5 max-w-xl text-sm text-muted">
      {children}
    </p>
  )
}

/**
 * The hero's call to action walks the user through each step:
 * sign in → connect YouTube (read-only) → see what we found → (next milestone) get roasted.
 */
function HeroActions() {
  const { status: authStatus, user } = useAuth()
  const youtube = useYouTubeConnection(authStatus)
  const firstName = user?.displayName.split(' ')[0]

  const isLoading = authStatus === 'loading' || (authStatus === 'signedIn' && ['idle', 'checking'].includes(youtube.status))

  if (isLoading) {
    return (
      <div aria-busy="true" aria-label="Loading">
        <span aria-hidden="true" className="mt-8 block h-12 w-60 animate-pulse rounded-full bg-surface-raised" />
        <Note />
      </div>
    )
  }

  if (authStatus !== 'signedIn') {
    return (
      <>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <GoogleSignInButton size="lg" />
          <SampleLink />
        </div>
        <Note>
          {authStatus === 'error'
            ? "We couldn't reach the TubeRoast server. Please try again in a moment."
            : 'Sign-in only shares your name and profile picture. YouTube access is asked for separately, later.'}
        </Note>
      </>
    )
  }

  if (youtube.status === 'error') {
    return (
      <>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button type="button" onClick={youtube.retry} className={redButton}>
            Try again
          </button>
          <SampleLink />
        </div>
        <Note>
          <span role="alert">{youtube.errorMessage}</span>
        </Note>
      </>
    )
  }

  if (youtube.status === 'disconnected') {
    return (
      <>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* A full-page link: connecting is a redirect to Google's consent screen and back. */}
          <a href="/api/youtube/connect" className={redButton} aria-describedby="cta-note">
            <PlayIcon className="size-5" />
            Connect YouTube
          </a>
          <SampleLink />
        </div>
        <Note>
          Hi {firstName}! TubeRoast gets read-only access: it can&apos;t post, like or change anything, and you can
          disconnect anytime.
        </Note>
      </>
    )
  }

  return (
    <>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Disabled until roast generation exists, so the button never pretends to work. */}
        <button type="button" disabled aria-describedby="cta-note" className={`${redButton} disabled:cursor-not-allowed disabled:opacity-60`}>
          <FlameIcon className="size-5" />
          Roast my YouTube
        </button>
        <SampleLink />
      </div>
      <Note>Your roast is almost ready to be written. That&apos;s the next feature on the way.</Note>
      <YouTubeSummaryCard summary={youtube.summary} onDisconnect={youtube.disconnect} />
    </>
  )
}

export default HeroActions
