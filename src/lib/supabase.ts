import { createBrowserClient } from '@supabase/ssr';

// Sanitize keys to prevent hidden newline/whitespace corruption (%0D%0A)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase Client] Critical Error: Environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined.');
}

// We use the service key on the server-side to bypass RLS for ingestion/deletion if needed
// createBrowserClient is safe for both, but on the server we can pass the service key
export const supabase = createBrowserClient(
  supabaseUrl || '',
  (typeof window === 'undefined' ? supabaseServiceKey : null) || supabaseAnonKey || ''
);

export const createClient = () => supabase;
