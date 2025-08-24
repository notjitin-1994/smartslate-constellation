import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AppRouter } from '@/router/AppRouter'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const CONSTELLATION_HOST = 'constellations.smartslate.io'
const CONSTELLATION_TITLE = 'Smartslate | Constellation'

// Enforce title on Constellation subdomain at boot
if (typeof window !== 'undefined' && window.location.hostname === CONSTELLATION_HOST) {
  try {
    document.title = CONSTELLATION_TITLE
  } catch {}
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  </StrictMode>,
)
