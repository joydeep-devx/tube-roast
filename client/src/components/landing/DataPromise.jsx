import { CheckIcon, CrossIcon } from '../Icons.jsx'

const whatWeRead = [
  'Videos you have liked (up to the most recent 1,000)',
  'Channels you subscribe to',
  'Playlists you have created',
]

const whatWeNeverDo = [
  'See your watch history. YouTube does not share it with apps.',
  'Post, like, comment or change anything on your account.',
  'Send your Google tokens or raw video lists to the AI model.',
  'Keep your raw YouTube data. Only the roast and a short summary are saved.',
]

function DataPromise() {
  return (
    <section
      id="your-data"
      aria-labelledby="data-heading"
      className="mx-auto max-w-6xl scroll-mt-16 px-4 py-20 sm:px-6"
    >
      <h2 id="data-heading" className="text-3xl font-bold tracking-tight">
        Your data, plainly
      </h2>
      <p className="mt-2 max-w-2xl text-muted">
        TubeRoast asks for read-only YouTube access, and only when you ask for a roast.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h3 className="font-semibold">What we read</h3>
          <ul className="mt-4 space-y-3">
            {whatWeRead.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed">
                <CheckIcon className="mt-0.5 size-5 shrink-0 text-emerald-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <h3 className="font-semibold">What we never do</h3>
          <ul className="mt-4 space-y-3">
            {whatWeNeverDo.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed">
                <CrossIcon className="mt-0.5 size-5 shrink-0 text-accent" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export default DataPromise
