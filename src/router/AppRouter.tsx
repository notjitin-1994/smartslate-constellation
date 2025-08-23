import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { paths } from '@/routes/paths'
import { RequireAuth } from './RequireAuth'

// Lazy load pages for better performance
const AuthLanding = lazy(() => import('@/pages/AuthLanding'))
const AuthCallback = lazy(() => import('@/pages/AuthCallback'))
const PortalPage = lazy(() => import('@/pages/PortalPage').then(m => ({ default: m.PortalPage })))
const SettingsContent = lazy(() => import('@/portal/SettingsContent').then(m => ({ default: m.SettingsContent })))
const PublicProfile = lazy(() => import('@/pages/PublicProfile').then(m => ({ default: m.PublicProfile })))

// Loading component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path={paths.home} element={<AuthLanding />} />
          {/* Alias /login to home for external redirects */}
          <Route path="/login" element={<Navigate to={paths.home} replace />} />
          
          {/* Protected routes */}
          <Route path={paths.portal} element={
            <RequireAuth>
              <PortalPage />
            </RequireAuth>
          }>
            <Route path="settings" element={<SettingsContent />} />
          </Route>
          
          <Route path={paths.portalUser} element={
            <RequireAuth>
              <PortalPage />
            </RequireAuth>
          } />
          
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path={paths.publicProfile} element={<PublicProfile />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}


