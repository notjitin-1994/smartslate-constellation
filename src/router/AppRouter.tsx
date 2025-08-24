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

// Constellation pages
const DashboardPage = lazy(() => import('@/pages/constellation/DashboardPage').then(m => ({ default: m.DashboardPage })))
const CreateConstellationPage = lazy(() => import('@/pages/constellation/CreateConstellationPage').then(m => ({ default: m.CreateConstellationPage })))
const StarmapSelectPage = lazy(() => import('@/pages/constellation/StarmapSelectPage').then(m => ({ default: m.StarmapSelectPage })))
const ConstellationEditorPage = lazy(() => import('@/pages/constellation/ConstellationEditorPage').then(m => ({ default: m.ConstellationEditorPage })))
const ConstellationViewPage = lazy(() => import('@/pages/constellation/ConstellationViewPage').then(m => ({ default: m.ConstellationViewPage })))
const ConstellationsPage = lazy(() => import('@/pages/constellation/ConstellationsPage').then(m => ({ default: m.ConstellationsPage })))

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
          
          {/* Protected routes (dashboard is the primary entry) */}
          <Route path={paths.dashboard} element={
            <RequireAuth>
              <PortalPage />
            </RequireAuth>
          }>
            <Route index element={<DashboardPage />} />
            <Route path="settings" element={<SettingsContent />} />
          </Route>
          
          {/* Constellations inside portal layout */}
          <Route path={paths.constellations} element={
            <RequireAuth>
              <PortalPage />
            </RequireAuth>
          }>
            <Route index element={<ConstellationsPage />} />
            <Route path="create" element={<CreateConstellationPage />} />
            <Route path="create/starmap" element={<StarmapSelectPage />} />
            <Route path=":id" element={<ConstellationViewPage />} />
            <Route path=":id/edit" element={<ConstellationEditorPage />} />
            <Route path="create/new" element={<ConstellationEditorPage />} />
          </Route>
          
          {/* Catch-all: send any unknown routes to dashboard */}
          <Route path="*" element={<Navigate to={paths.dashboard} replace />} />
          
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path={paths.publicProfile} element={<PublicProfile />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}


