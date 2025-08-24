/**
 * Runtime environment configuration with type safety and validation
 */

type AppEnv = {
  VITE_SUPABASE_URL?: string
  VITE_SUPABASE_ANON_KEY?: string
  VITE_SITE_URL?: string
  VITE_AUTH_REDIRECT_URL?: string
  VITE_GOOGLE_REDIRECT_URL?: string
  VITE_APP_NAME?: string
  VITE_APP_VERSION?: string
  VITE_ENABLE_ANALYTICS?: string
  VITE_SENTRY_DSN?: string
  MODE: string
  DEV: boolean
  PROD: boolean
}

const raw = import.meta.env as unknown as AppEnv

/**
 * Safely read environment variable
 */
function read(name: keyof AppEnv): string | undefined {
  const value = raw[name]
  return typeof value === 'string' && value !== '' ? value : undefined
}

/**
 * Read boolean environment variable
 */
function readBoolean(name: keyof AppEnv): boolean {
  const value = read(name)
  return value === 'true' || value === '1'
}

/**
 * Environment configuration with defaults
 */
export const env = {
  // Core configuration
  supabaseUrl: read('VITE_SUPABASE_URL'),
  supabaseAnonKey: read('VITE_SUPABASE_ANON_KEY'),
  
  // URLs
  siteUrl: read('VITE_SITE_URL') || (raw.DEV ? 'http://localhost:5173' : ''),
  authRedirectUrl: read('VITE_AUTH_REDIRECT_URL'),
  googleRedirectUrl: read('VITE_GOOGLE_REDIRECT_URL'),
  
  // App metadata
  appName: read('VITE_APP_NAME') || 'SmartSlate',
  appVersion: read('VITE_APP_VERSION') || '1.0.0',
  
  // Environment flags
  mode: raw.MODE as 'development' | 'staging' | 'production',
  isDev: raw.DEV,
  isProd: raw.PROD,
  isStaging: raw.MODE === 'staging',
  
  // Feature flags
  enableAnalytics: readBoolean('VITE_ENABLE_ANALYTICS'),
  sentryDsn: read('VITE_SENTRY_DSN'),
} as const

/**
 * Validate required environment variables
 */
export function assertRequiredEnv(): void {
  const missing: string[] = []
  
  if (!env.supabaseUrl) missing.push('VITE_SUPABASE_URL')
  if (!env.supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY')
  
  if (missing.length) {
    const message = `Missing required environment variables: ${missing.join(', ')}`
    console.error(message)
    
    // Provide helpful message in development
    if (env.isDev) {
      console.info(
        '💡 Tip: Create a .env file in the project root with the required variables.\n' +
        '   You can copy env.example as a template.'
      )
    }
    
    throw new Error(message)
  }
}

/**
 * Get configuration with runtime validation
 */
export const config = {
  get supabaseUrl(): string {
    if (!env.supabaseUrl) throw new Error('Supabase URL not configured')
    return env.supabaseUrl
  },
  
  get supabaseAnonKey(): string {
    if (!env.supabaseAnonKey) throw new Error('Supabase Anon Key not configured')
    return env.supabaseAnonKey
  },
  
  get siteUrl(): string {
    return env.siteUrl
  },
  
  get authRedirectUrl(): string {
    return env.authRedirectUrl || `${env.siteUrl}/auth/callback`
  },
  
  get googleRedirectUrl(): string {
    return env.googleRedirectUrl || env.authRedirectUrl || `${env.siteUrl}/auth/callback`
  },
  
  // Feature flags
  features: {
    debugMode: env.isDev,
    errorReporting: env.isProd && !!env.sentryDsn,
    analytics: (env.isProd || env.isStaging) && env.enableAnalytics,
  }
}


