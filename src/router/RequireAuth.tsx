import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getSupabase } from '@/services/supabase'
import { paths } from '@/routes/paths'
import type { User } from '@supabase/supabase-js'

interface RequireAuthProps {
  children: React.ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    let isMounted = true

    // Check current session
    getSupabase().auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    })

    // Listen for auth state changes
    const { data: { subscription } } = getSupabase().auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!user) {
    // Redirect to login with the current location as the redirectTo parameter
    const redirectTo = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`${paths.home}?redirectTo=${redirectTo}`} replace />
  }

  return <>{children}</>
}
