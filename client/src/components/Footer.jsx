import { Link } from 'react-router'

const footerLink = 'rounded hover:text-ink'

function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-1">
          <p>TubeRoast is a portfolio project, not affiliated with YouTube or Google.</p>
          <p>Roasts are AI-generated and meant to be funny, not hurtful.</p>
        </div>
        <nav aria-label="Legal">
          <ul className="flex gap-4">
            <li>
              <Link to="/privacy" className={footerLink}>
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className={footerLink}>
                Terms of Service
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  )
}

export default Footer
