import Logo from './Logo.jsx'

function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#top" aria-label="TubeRoast home" className="rounded-lg">
          <Logo />
        </a>
        <nav aria-label="Main">
          <ul className="flex items-center gap-1 text-sm text-muted sm:gap-4">
            <li>
              <a href="#how-it-works" className="rounded-md px-2 py-1 hover:text-ink">How it works</a>
            </li>
            <li>
              <a href="#your-data" className="rounded-md px-2 py-1 hover:text-ink">Your data</a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

export default Header
