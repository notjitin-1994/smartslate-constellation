import { memo } from 'react'
import type { User } from '@supabase/supabase-js'
import { getSupabase } from '@/services/supabase'

export function resolveUserAvatarUrl(user: User | null): string | null {
  const meta: any = user?.user_metadata ?? {}
  if (meta.noAvatar === true) return null
  // Prefer stored avatar in Supabase storage if available
  const avatarPath: string | undefined = meta.avatar_path
  if (avatarPath) {
    try {
      const { data } = getSupabase().storage.from('public-assets').getPublicUrl(avatarPath)
      const url = data.publicUrl as string
      if (url) return url
    } catch {}
  }
  const identities: any[] = (user as any)?.identities ?? []
  const identityData = identities.find((i) => i?.identity_data)?.identity_data ?? {}
  return (
    (meta.avatar_url as string) ||
    (meta.avatarURL as string) ||
    (meta.avatar as string) ||
    (meta.picture as string) ||
    (identityData.avatar_url as string) ||
    (identityData.picture as string) ||
    null
  )
}

export function getUserInitial(user: User | null): string {
  const rawName = (user?.user_metadata?.first_name as string) ||
    (user?.user_metadata?.name as string) ||
    (user?.user_metadata?.full_name as string) ||
    (user?.email as string) ||
    'U'
  return rawName.toString().trim().charAt(0).toUpperCase()
}

interface UserAvatarProps {
  user: User | null
  sizeClass: string
  textClass?: string
}

export const UserAvatar = memo(function UserAvatar({ 
  user, 
  sizeClass, 
  textClass = 'text-sm font-semibold text-white/90' 
}: UserAvatarProps) {
  const avatarUrl = resolveUserAvatarUrl(user)
  
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={`${sizeClass} rounded-full object-cover ring-2 ring-primary-500/20`}
        referrerPolicy="no-referrer"
      />
    )
  }
  
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center ring-2 ring-primary-500/20`}>
      <span className={textClass}>{getUserInitial(user)}</span>
    </div>
  )
})
