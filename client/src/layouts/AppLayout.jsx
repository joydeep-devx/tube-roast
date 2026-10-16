import { Outlet } from 'react-router'
import Footer from '../components/Footer.jsx'
import Header from '../components/Header.jsx'
import StatusBanner from '../components/StatusBanner.jsx'
import ScrollManager from './ScrollManager.jsx'

/** Shared frame for every page: the current route renders where <Outlet /> is. */
function AppLayout() {
  return (
    <div id="top" className="flex min-h-dvh flex-col">
      <ScrollManager />
      {/* Lets keyboard users jump past the header straight to the content. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-20 focus:rounded-lg focus:bg-surface-raised focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        <StatusBanner />
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default AppLayout
