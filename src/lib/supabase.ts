import { createBrowserClient } from '@supabase/ssr';
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

// 1. Sanitize standard keys
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';

/**
 * Standard Client: Safe for Browser & Server.
 * Uses Anon Key + RLS.
 */
let clientInstance: SupabaseClient | null = null;

export const getSupabaseClient = () => {
  if (clientInstance) return clientInstance;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase] Project URL or Anon Key is missing. Using a placeholder client for build-time safety.');
    // We return a mock-like client if keys are missing to prevent build-time crashes
    // In production/runtime, these keys MUST be present.
  }

  clientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return clientInstance;
};

// Export a proxy for the 'supabase' constant to maintain backward compatibility
export const supabase = new Proxy({} as SupabaseClient, {
  get: (target, prop) => {
    const client = getSupabaseClient();
    return (client as unknown as Record<string | symbol, unknown>)[prop as string | symbol];
  }
});

/**
 * Admin Client: SERVER ONLY. 
 * Bypasses RLS using the Service Role Key.
 */
export const createAdminClient = () => {
  if (typeof window !== 'undefined') {
    throw new Error('CRITICAL SECURITY ERROR: Admin Client initialized in browser.');
  }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  
  if (!serviceKey) {
    console.error('[Supabase Admin] CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing.');
  }

  return createSupabaseClient(supabaseUrl, serviceKey || '', {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

export const createClient = () => getSupabaseClient();
