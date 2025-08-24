import type { User as SupabaseUser } from '@supabase/supabase-js'

// Re-export commonly used types
export type { SupabaseUser }

// Application-specific types
export interface UserProfile {
  id: string
  username?: string
  displayName?: string
  jobTitle?: string
  company?: string
  website?: string
  city?: string
  country?: string
  bio?: string
  avatarPath?: string
  createdAt?: string
  updatedAt?: string
}

export interface AuthState {
  user: SupabaseUser | null
  loading: boolean
  error?: string
}

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  success: boolean
}

export interface SessionInfo {
  sub: string
  roles: string[]
}

export interface RouteParams {
  username?: string
  user?: string
}

export type ToastType = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: number
  type: ToastType
  message: string
  duration?: number
}

export interface NavigationItem {
  label: string
  path?: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: {
    text: string
    tone?: 'preview' | 'soon' | 'info'
  }
  onClick?: () => void
}

export interface WorkspaceAction {
  id: string
  label: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  isExternal?: boolean
}

// Form field types
export interface FormField<T = string> {
  value: T
  error?: string
  touched?: boolean
}

export interface LoginCredentials {
  identifier: string
  password: string
}

export interface SignUpCredentials {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

// Environment configuration
export interface AppConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  environment: 'development' | 'staging' | 'production'
}

// Utility types
export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type AsyncState<T> = {
  data: T | null
  loading: boolean
  error: Error | null
}
