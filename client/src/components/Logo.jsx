import { PlayIcon } from './Icons.jsx'

function Logo({ size = 'md' }) {
  const isLarge = size === 'lg'

  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className={`flex items-center justify-center rounded-lg bg-accent-strong ${isLarge ? 'size-10' : 'size-8'}`}
      >
        <PlayIcon className={`ml-0.5 text-white ${isLarge ? 'size-5' : 'size-4'}`} />
      </span>
      {/* The wordmark hides on very narrow phones so the header fits; links using the logo keep an aria-label. */}
      <span className={`hidden font-bold tracking-tight min-[400px]:inline ${isLarge ? 'text-2xl' : 'text-xl'}`}>
        Tube<span className="text-accent">Roast</span>
      </span>
    </span>
  )
}

export default Logo
