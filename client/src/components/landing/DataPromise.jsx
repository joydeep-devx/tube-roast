import * as m from 'motion/react-m'
import { fadeUp, revealOnScroll, staggerContainer } from '../../lib/motion.js'
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
      <m.div variants={fadeUp} {...revealOnScroll}>
        <h2 id="data-heading" className="text-3xl font-bold tracking-tight">
          Your data, plainly
        </h2>
        <p className="mt-2 max-w-2xl text-muted">
          TubeRoast asks for read-only YouTube access, and only when you ask for a roast.
        </p>
      </m.div>

      <m.div variants={staggerContainer(0.15)} {...revealOnScroll} className="mt-10 grid gap-6 md:grid-cols-2">
        <m.div variants={fadeUp} className="rounded-2xl border border-border bg-surface p-6">
          <h3 className="font-semibold">What we read</h3>
          <m.ul variants={staggerContainer(0.07, 0.2)} className="mt-4 space-y-3">
            {whatWeRead.map((item) => (
              <m.li key={item} variants={fadeUp} className="flex gap-3 text-sm leading-relaxed">
                <CheckIcon className="mt-0.5 size-5 shrink-0 text-emerald-400" />
                {item}
              </m.li>
            ))}
          </m.ul>
        </m.div>

        <m.div variants={fadeUp} className="rounded-2xl border border-border bg-surface p-6">
          <h3 className="font-semibold">What we never do</h3>
          <m.ul variants={staggerContainer(0.07, 0.2)} className="mt-4 space-y-3">
            {whatWeNeverDo.map((item) => (
              <m.li key={item} variants={fadeUp} className="flex gap-3 text-sm leading-relaxed">
                <CrossIcon className="mt-0.5 size-5 shrink-0 text-accent" />
                {item}
              </m.li>
            ))}
          </m.ul>
        </m.div>
      </m.div>
    </section>
  )
}

export default DataPromise
