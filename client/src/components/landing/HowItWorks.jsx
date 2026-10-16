import * as m from 'motion/react-m'
import { fadeUp, hoverLift, revealOnScroll, staggerContainer } from '../../lib/motion.js'

// Styled like the chapter list under a YouTube video.
const chapters = [
  {
    timestamp: '0:00',
    title: 'Connect your Google account',
    description: 'Sign in with Google, then grant read-only YouTube access. You can disconnect any time.',
  },
  {
    timestamp: '0:15',
    title: 'We spot your patterns',
    description: 'Your top channels, recurring topics and guilty pleasures are summarized on our server.',
  },
  {
    timestamp: '0:30',
    title: 'You get roasted',
    description: 'An AI model turns that summary into a roast. Save it, laugh at it, roast again later.',
  },
]

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="scroll-mt-16 border-t border-border/60 bg-surface/40"
    >
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <m.div variants={fadeUp} {...revealOnScroll}>
          <h2 id="how-heading" className="text-3xl font-bold tracking-tight">
            How it works
          </h2>
          <p className="mt-2 text-muted">Three chapters. No skipping.</p>
        </m.div>

        <m.ol variants={staggerContainer(0.12)} {...revealOnScroll} className="mt-10 grid gap-6 md:grid-cols-3">
          {chapters.map((chapter, index) => (
            <m.li
              key={chapter.timestamp}
              variants={fadeUp}
              {...hoverLift}
              className="group rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-accent/50"
            >
              <div
                aria-hidden="true"
                className="relative flex aspect-video items-center justify-center rounded-xl bg-surface-raised"
              >
                <span className="text-5xl font-extrabold text-accent transition-transform duration-300 group-hover:scale-110">
                  {index + 1}
                </span>
                <span className="absolute right-2 bottom-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium">
                  {chapter.timestamp}
                </span>
              </div>
              <h3 className="mt-4 font-semibold">{chapter.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{chapter.description}</p>
            </m.li>
          ))}
        </m.ol>
      </div>
    </section>
  )
}

export default HowItWorks
