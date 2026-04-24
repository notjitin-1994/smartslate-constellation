import { createBrowserClient } from '@supabase/ssr';

// 1. Sanitize standard keys
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';

/**
 * Standard Client: Safe for Browser & Server.
 * Uses Anon Key + RLS.
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

/**
 * Admin Client: SERVER ONLY. 
 * Bypasses RLS. Use ONLY for system-level tasks (e.g. initial blueprint harvest).
 */
export const createAdminClient = () => {
  if (typeof window !== 'undefined') {
    throw new Error('CRITICAL SECURITY ERROR: Admin Client initialized in browser.');
  }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return createBrowserClient(supabaseUrl, serviceKey || '');
};

export const createClient = () => supabase;
