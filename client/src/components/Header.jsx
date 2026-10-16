import Logo from './Logo.jsx'
import UserMenu from './UserMenu.jsx'

function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="#top" aria-label="TubeRoast home" className="rounded-lg">
          <Logo />
        </a>
        <div className="flex items-center gap-4">
          {/* Section links hide on phones to make room for the account controls. */}
          <nav aria-label="Main" className="hidden sm:block">
            <ul className="flex items-center gap-4 text-sm text-muted">
              <li>
                <a href="#how-it-works" className="rounded-md px-2 py-1 hover:text-ink">How it works</a>
              </li>
              <li>
                <a href="#your-data" className="rounded-md px-2 py-1 hover:text-ink">Your data</a>
              </li>
            </ul>
          </nav>
          <UserMenu />
        </div>
      </div>
    </header>
  )
}

export default Header
