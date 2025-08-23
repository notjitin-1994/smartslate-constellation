import type { IdentifierValue } from '@/features/auth/types'
import { getSupabase } from '@/services/supabase'
import { env } from '@/config/env'
import { paths } from '@/routes/paths'

export async function login(params: { identifier: IdentifierValue; password: string }) {
  const { identifier, password } = params
  if (identifier.kind !== 'email') throw new Error('Enter a valid email')
  const { error } = await getSupabase().auth.signInWithPassword({
    email: identifier.email,
    password,
  })
  if (error) throw new Error(error.message)

  try {
    const sub = identifier.email
    const roles: string[] = []
    const redirectTo = new URLSearchParams(window.location.search).get('redirectTo') || undefined
    await fetch('/api/session/issue' + (redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ sub, roles }),
    })
    if (redirectTo) {
      window.location.assign(redirectTo)
    } else {
      window.location.assign(paths.portal)
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to issue session cookie', e)
  }
}

export async function signup(params: { identifier: IdentifierValue; password: string }) {
  const { identifier, password } = params
  if (identifier.kind !== 'email') throw new Error('Enter a valid email')
  const redirectTo = env.authRedirectUrl || env.siteUrl || undefined
  const { error } = await getSupabase().auth.signUp({
    email: identifier.email,
    password,
    options: { emailRedirectTo: redirectTo },
  })
  if (error) throw new Error(error.message)
}


