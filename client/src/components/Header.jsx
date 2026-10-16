import { Link } from 'react-router'
import Logo from './Logo.jsx'
import UserMenu from './UserMenu.jsx'

const sectionLinks = [
  { hash: '#how-it-works', label: 'How it works' },
  { hash: '#your-data', label: 'Your data' },
]

function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/" aria-label="TubeRoast home" className="shrink-0 rounded-lg">
          <Logo />
        </Link>
        <div className="flex min-w-0 items-center gap-4">
          {/* Section links hide on phones to make room for the account controls. */}
          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex items-center gap-4 text-sm text-muted">
              {sectionLinks.map(({ hash, label }) => (
                <li key={hash}>
                  {/* Works from any page: goes home, then ScrollManager scrolls to the section. */}
                  <Link to={{ pathname: '/', hash }} className="rounded-md px-2 py-1 hover:text-ink">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <UserMenu />
        </div>
      </div>
    </header>
  )
}

export default Header
