import { domAnimation, LazyMotion, MotionConfig } from 'motion/react'
import { BrowserRouter, Route, Routes } from 'react-router'
import AuthProvider from './auth/AuthProvider.jsx'
import RequireAuth from './auth/RequireAuth.jsx'
import AppLayout from './layouts/AppLayout.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import LandingPage from './pages/LandingPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import PrivacyPage from './pages/PrivacyPage.jsx'
import RoastDetailPage from './pages/RoastDetailPage.jsx'
import TermsPage from './pages/TermsPage.jsx'

function App() {
  return (
    // reducedMotion="user": if the OS asks for reduced motion, Motion skips movement and keeps simple fades.
    // LazyMotion + domAnimation loads only the features we use; `strict` errors if a full `motion.*` component sneaks in.
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Layout route: every page renders inside AppLayout's <Outlet />. */}
              <Route element={<AppLayout />}>
                <Route index element={<LandingPage />} />
                <Route
                  path="history"
                  element={
                    <RequireAuth title="Sign in to see your roasts" message="Your roast history is saved to your account.">
                      <HistoryPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="roasts/:id"
                  element={
                    <RequireAuth title="Sign in to see this roast" message="Roasts are only visible to the person they roast.">
                      <RoastDetailPage />
                    </RequireAuth>
                  }
                />
                {/* Public pages, also linked from Google's consent screen. */}
                <Route path="privacy" element={<PrivacyPage />} />
                <Route path="terms" element={<TermsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LazyMotion>
    </MotionConfig>
  )
}

export default App
