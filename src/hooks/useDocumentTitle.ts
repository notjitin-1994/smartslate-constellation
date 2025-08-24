import { useEffect } from 'react'

const CONSTELLATION_HOST = 'constellations.smartslate.io'
const CONSTELLATION_TITLE = 'Smartslate | Constellation'

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const isConstellationHost = typeof window !== 'undefined' && window.location.hostname === CONSTELLATION_HOST
    if (isConstellationHost) {
      try {
        // Lock the title on the constellation subdomain
        if (document.title !== CONSTELLATION_TITLE) document.title = CONSTELLATION_TITLE
      } catch {}
      return () => {
        // Do not restore previous title on this host
      }
    }

    const previous = document.title
    document.title = title
    return () => {
      document.title = previous
    }
  }, [title])
}


