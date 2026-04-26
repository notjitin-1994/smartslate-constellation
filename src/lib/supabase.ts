import { createBrowserClient } from '@supabase/ssr';
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

// 1. Sanitize standard keys with build-time fallbacks
// We use placeholder strings to prevent @supabase/ssr and supabase-js from throwing during static analysis.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || 'placeholder-anon-key';

/**
 * Standard Client: Safe for Browser & Server.
 * Uses Anon Key + RLS.
 */
let clientInstance: SupabaseClient | null = null;

export const getSupabaseClient = () => {
  if (clientInstance) return clientInstance;
  
  if (supabaseUrl.includes('placeholder')) {
    console.warn('[Supabase] Using placeholder URL/Key. Ensure NEXT_PUBLIC_SUPABASE_URL is set in Vercel settings.');
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
  
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || 'placeholder-service-key';
  
  if (serviceKey === 'placeholder-service-key') {
    console.error('[Supabase Admin] CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing.');
  }

  return createSupabaseClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

export const createClient = () => getSupabaseClient();
