import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { paths } from '@/routes/paths'
import AuthLanding from '@/pages/AuthLanding'
import AuthCallback from '@/pages/AuthCallback'
import { PortalPage } from '@/pages/PortalPage'
import { SettingsContent } from '@/portal/SettingsContent'
import { PublicProfile } from '@/pages/PublicProfile'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={paths.home} element={<AuthLanding />} />
        {/* Alias /login to home for external redirects */}
        <Route path="/login" element={<Navigate to={paths.home} replace />} />
        <Route path={paths.portal} element={<PortalPage />}>
          <Route path="settings" element={<SettingsContent />} />
        </Route>
        <Route path={paths.portalUser} element={<PortalPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path={paths.publicProfile} element={<PublicProfile />} />
      </Routes>
    </BrowserRouter>
  )
}


