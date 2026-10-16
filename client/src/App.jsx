import { domAnimation, LazyMotion, MotionConfig } from 'motion/react'
import AuthProvider from './auth/AuthProvider.jsx'
import AuthErrorBanner from './components/AuthErrorBanner.jsx'
import Footer from './components/Footer.jsx'
import Header from './components/Header.jsx'
import LandingPage from './pages/LandingPage.jsx'

function App() {
  return (
    // reducedMotion="user": if the OS asks for reduced motion, Motion skips movement and keeps simple fades.
    // LazyMotion + domAnimation loads only the features we use; `strict` errors if a full `motion.*` component sneaks in.
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </LazyMotion>
    </MotionConfig>
  )
}

function AppShell() {
  return (
    <div id="top" className="flex min-h-dvh flex-col">
      {/* Lets keyboard users jump past the header straight to the content. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-20 focus:rounded-lg focus:bg-surface-raised focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        <AuthErrorBanner />
        <LandingPage />
      </main>
      <Footer />
    </div>
  )
}

export default App
