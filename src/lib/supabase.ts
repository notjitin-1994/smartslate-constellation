import { createBrowserClient } from '@supabase/ssr';
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

// 1. Environment variables with strict validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';

/**
 * Standard Client: Safe for Browser & Server.
 */
let clientInstance: SupabaseClient | null = null;

export const getSupabaseClient = () => {
  if (clientInstance) return clientInstance;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase] CRITICAL: NEXT_PUBLIC_SUPABASE_URL or ANON_KEY is missing. Ingestion and Auth will fail.');
    // Return a dummy client to prevent build crash, but log error
    return createBrowserClient('https://missing-url.supabase.co', 'missing-key');
  }

  // Diagnostic: Log a non-sensitive hash of the URL to verify project matching
  if (typeof window !== 'undefined') {
    const urlHash = supabaseUrl.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
    console.log(`[Supabase] Client initialized. Project Hash: ${urlHash}`);
  }

  clientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return clientInstance;
};

// Export a proxy for the 'supabase' constant
export const supabase = new Proxy({} as SupabaseClient, {
  get: (target, prop) => {
    const client = getSupabaseClient();
    return (client as unknown as Record<string | symbol, unknown>)[prop as string | symbol];
  }
});

/**
 * Admin Client: SERVER ONLY.
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
