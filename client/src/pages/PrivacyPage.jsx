import { Link } from 'react-router'
import { ExternalLink, LegalLayout } from '../components/legal/LegalLayout.jsx'
import { EXTERNAL_LINKS, SITE } from '../config/site.js'

const contactLink = <a href={`mailto:${SITE.contactEmail}`} className="text-accent underline underline-offset-4">{SITE.contactEmail}</a>

// Plain-English policy that matches what the code actually does. Update it whenever data handling changes.
const sections = [
  {
    id: 'who-we-are',
    title: 'Who runs TubeRoast',
    body: (
      <p>
        TubeRoast ({SITE.url}) is a free, non-commercial portfolio project built and run by {SITE.operator}. It is not
        affiliated with, endorsed by or sponsored by YouTube or Google. You can reach us at {contactLink}.
      </p>
    ),
  },
  {
    id: 'sign-in-data',
    title: 'Data we get when you sign in',
    body: (
      <>
        <p>When you sign in with Google, we ask only for the basic profile scopes (<code>openid</code> and <code>profile</code>) and receive:</p>
        <ul>
          <li>your Google account ID (a number that identifies your account),</li>
          <li>your name, and</li>
          <li>the address of your profile picture.</li>
        </ul>
        <p>
          We use these only to recognize your account and show your name and picture in the app. We do <strong>not</strong>{' '}
          request your email address, and we do not keep the Google tokens used for sign-in.
        </p>
      </>
    ),
  },
  {
    id: 'youtube-data',
    title: 'YouTube data we read',
    body: (
      <>
        <p>
          Connecting YouTube is optional and separate from signing in. If you connect it, you grant read-only access
          (the <code>youtube.readonly</code> scope), and TubeRoast reads:
        </p>
        <ul>
          <li>up to your 200 most recently liked videos: title, channel name, category, tags, topics, length and publish date;</li>
          <li>up to 200 channels you subscribe to: channel names;</li>
          <li>up to 50 playlists you created: titles and number of videos.</li>
        </ul>
        <p>
          TubeRoast cannot see your watch history, and it cannot post, like, comment, subscribe or change anything on
          your account. YouTube data is fetched when you view your summary or ask for a roast, processed in memory, and
          <strong> not stored</strong>.
        </p>
      </>
    ),
  },
  {
    id: 'how-we-use-data',
    title: 'How we use your data',
    body: (
      <>
        <p>We use your data only to:</p>
        <ul>
          <li>show you a summary of your YouTube activity and the patterns we found, and</li>
          <li>generate roasts for you and keep your recent roasts in your history.</li>
        </ul>
        <p>
          We do not sell your data, use it for advertising, use it to train AI models, or share it with anyone except
          the service providers described below. TubeRoast&apos;s use and transfer of information received from Google
          APIs adheres to the{' '}
          <ExternalLink href={EXTERNAL_LINKS.googleApiUserDataPolicy}>Google API Services User Data Policy</ExternalLink>,
          including the Limited Use requirements.
        </p>
      </>
    ),
  },
  {
    id: 'ai-provider',
    title: 'What we send to the AI model',
    body: (
      <>
        <p>
          Roasts are written by an AI model hosted by NVIDIA. Before anything is sent, TubeRoast turns your YouTube data
          into a short summary: counts, top channel names, categories, topics, repeated keywords, video-length and
          playlist statistics, a few playlist titles (with links, email addresses and long numbers removed) and viewing
          &quot;traits&quot;. You can see the exact summary in the app under &quot;What the AI will see&quot;.
        </p>
        <p>
          We never send your name, Google account ID, sign-in or YouTube tokens, video IDs or links. NVIDIA processes
          requests under its own terms and{' '}
          <ExternalLink href={EXTERNAL_LINKS.nvidiaPrivacy}>privacy policy</ExternalLink> and may log API usage for
          security purposes.
        </p>
      </>
    ),
  },
  {
    id: 'what-we-store',
    title: 'What we store',
    body: (
      <>
        <p>TubeRoast stores the following in a MongoDB Atlas database:</p>
        <ul>
          <li><strong>Your account:</strong> Google account ID, name and profile picture address.</li>
          <li>
            <strong>Your roasts:</strong> your 20 most recent roasts, each with a small snapshot (counts, up to three
            channel names and traits). Older roasts are deleted automatically.
          </li>
          <li>
            <strong>Your session:</strong> encrypted session data that keeps you signed in. While YouTube is connected,
            it holds a short-lived YouTube access token (valid for about one hour). Sessions expire after 7 days.
          </li>
        </ul>
        <p>The app is hosted on Render. Raw YouTube data and the full summary sent to the AI are never stored.</p>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies',
    body: (
      <p>
        TubeRoast uses a single essential cookie (<code>tuberoast.sid</code>) to keep you signed in. It cannot be read
        by scripts on the page and is only sent over HTTPS. There are no analytics, advertising or third-party tracking
        cookies.
      </p>
    ),
  },
  {
    id: 'your-choices',
    title: 'Revoking access and deleting your data',
    body: (
      <>
        <ul>
          <li><strong>Disconnect YouTube</strong> in the app at any time. This revokes the access token at Google and removes it.</li>
          <li><strong>Sign out</strong> to end your session. This also revokes any YouTube access.</li>
          <li><strong>Delete roasts</strong> individually from your history.</li>
          <li>
            Remove TubeRoast&apos;s access from your Google account at any time on Google&apos;s{' '}
            <ExternalLink href={EXTERNAL_LINKS.googlePermissions}>security settings page</ExternalLink>.
          </li>
          <li>
            To <strong>delete your account and all roasts</strong>, email {contactLink} from any address and include
            the name shown on your TubeRoast account. We will delete your data within 30 days and confirm by email.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'youtube-and-google',
    title: 'YouTube and Google',
    body: (
      <p>
        TubeRoast uses YouTube API Services. By connecting YouTube, you also agree to the{' '}
        <ExternalLink href={EXTERNAL_LINKS.youtubeTerms}>YouTube Terms of Service</ExternalLink>. Google&apos;s handling
        of your data is described in the <ExternalLink href={EXTERNAL_LINKS.googlePrivacy}>Google Privacy Policy</ExternalLink>.
      </p>
    ),
  },
  {
    id: 'security',
    title: 'Security',
    body: (
      <p>
        TubeRoast uses HTTPS, encrypted server-side sessions, read-only and least-privilege permissions, and checks that
        every roast belongs to the person requesting it. No online service can guarantee perfect security, so we keep
        as little data as possible.
      </p>
    ),
  },
  {
    id: 'children',
    title: 'Children',
    body: <p>TubeRoast is not directed at children under 13 and does not knowingly collect their data.</p>,
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: (
      <p>
        If we change how TubeRoast handles data, we will update this page and the date at the top. See also our{' '}
        <Link to="/terms" className="text-accent underline underline-offset-4">Terms of Service</Link>.
      </p>
    ),
  },
]

function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      lastUpdated={SITE.legalLastUpdated}
      intro={
        <p>
          TubeRoast roasts your YouTube taste using as little data as possible. This page explains exactly what we
          access, why, what we keep, and how to remove it.
        </p>
      }
      sections={sections}
    />
  )
}

export default PrivacyPage
