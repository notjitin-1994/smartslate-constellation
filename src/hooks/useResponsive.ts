import { useState, useEffect } from 'react'

export function useResponsive() {
  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    window.addEventListener('resize', handleResize)
    handleResize() // Check on mount

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return {
    isMobile,
    isTablet: !isMobile && typeof window !== 'undefined' && window.innerWidth < 1024,
    isDesktop: typeof window !== 'undefined' && window.innerWidth >= 1024
  }
}
