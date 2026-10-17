import * as m from 'motion/react-m'
import { fadeUp, staggerContainer } from '../../lib/motion.js'

/** Shared page frame for the privacy policy and terms: title, date, table of contents, sections. */
export function LegalLayout({ title, intro, lastUpdated, sections }) {
  return (
    <m.article
      variants={staggerContainer(0.06)}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-3xl px-4 py-12 sm:px-6"
    >
      <title>{`${title} · TubeRoast`}</title>

      <m.header variants={fadeUp}>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted">Last updated: {lastUpdated}</p>
        <div className="mt-6 space-y-3 leading-relaxed text-ink/90">{intro}</div>
      </m.header>

      <m.nav variants={fadeUp} aria-label="On this page" className="mt-8 rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold">On this page</h2>
        <ol className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
          {sections.map((section, index) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className="rounded text-muted hover:text-ink">
                {index + 1}. {section.title}
              </a>
            </li>
          ))}
        </ol>
      </m.nav>

      {sections.map((section, index) => (
        <m.section key={section.id} id={section.id} variants={fadeUp} className="mt-10 scroll-mt-24" aria-labelledby={`${section.id}-heading`}>
          <h2 id={`${section.id}-heading`} className="text-xl font-semibold">
            {index + 1}. {section.title}
          </h2>
          <div className="legal-prose mt-3 space-y-3 leading-relaxed text-ink/90">{section.body}</div>
        </m.section>
      ))}
    </m.article>
  )
}

/** A link that opens outside TubeRoast, clearly marked for screen reader users. */
export function ExternalLink({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4 hover:text-accent-hover">
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}
