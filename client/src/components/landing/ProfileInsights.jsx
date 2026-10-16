import * as m from 'motion/react-m'
import { fadeUp } from '../../lib/motion.js'
import { traitLabel } from '../../youtube/traitLabels.js'

const percent = (share) => `${Math.round(share * 100)}%`

/** What the analysis noticed, plus the exact profile the AI will receive. */
function ProfileInsights({ profile }) {
  const topChannels = profile.topChannels.slice(0, 3)

  return (
    <m.div variants={fadeUp} className="mt-5 space-y-4 border-t border-border pt-4">
      <h3 className="text-sm font-semibold">What we noticed</h3>

      {profile.traits.length > 0 && (
        <ul aria-label="Your viewing traits" className="flex flex-wrap gap-2">
          {profile.traits.map((trait) => (
            <li key={trait} className="rounded-full border border-accent/40 bg-accent-strong/10 px-3 py-1 text-xs font-medium text-ink">
              {traitLabel(trait)}
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-4 sm:grid-cols-2 [&>*]:min-w-0">
        {topChannels.length > 0 && (
          <div>
            <h4 className="text-xs font-medium tracking-wide text-muted uppercase">Most-liked channels</h4>
            <ol className="mt-2 space-y-1 text-sm">
              {topChannels.map((channel) => (
                <li key={channel.name} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate">{channel.name}</span>
                  <span className="shrink-0 text-muted">{channel.likes} likes</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {profile.topCategories.length > 0 && (
          <div>
            <h4 className="text-xs font-medium tracking-wide text-muted uppercase">Top categories</h4>
            <ul className="mt-2 space-y-1 text-sm">
              {profile.topCategories.slice(0, 3).map((category) => (
                <li key={category.name} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate">{category.name}</span>
                  <span className="shrink-0 text-muted">{percent(category.share)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Transparency: the exact data the roast generator will send to the AI model. */}
      <details className="group rounded-xl bg-surface-raised">
        <summary className="cursor-pointer list-none rounded-xl px-4 py-3 text-sm font-medium select-none hover:text-ink">
          <span className="mr-2 inline-block transition-transform group-open:rotate-90" aria-hidden="true">
            ›
          </span>
          What the AI will see
        </summary>
        <div className="px-4 pb-4">
          <p className="text-xs text-muted">
            This summary is the only YouTube data sent to the AI model, which is hosted by NVIDIA. No video IDs, links or
            account details are included.
          </p>
          <pre className="mt-3 max-h-72 overflow-auto rounded-lg bg-canvas p-3 text-xs leading-relaxed text-ink/90">
            {JSON.stringify(profile, null, 2)}
          </pre>
        </div>
      </details>
    </m.div>
  )
}

export default ProfileInsights
