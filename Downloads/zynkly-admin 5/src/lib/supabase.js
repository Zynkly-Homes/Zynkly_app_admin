import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const missing = !supabaseUrl || !supabaseAnonKey ||
  supabaseUrl === 'your-supabase-url' ||
  supabaseAnonKey === 'your-anon-key';

if (missing) {
  console.error(
    '[Zynkly Admin] ⚠️  Missing or placeholder Supabase env vars.\n' +
    'Edit .env.local and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY,\n' +
    'then restart `npm run dev`.'
  );
}

/**
 * Single Supabase client instance for the entire admin app.
 * Only uses the anon key — privileged operations go through Edge Functions.
 *
 * Falls back to localhost placeholder when env vars are not configured
 * so the app can at least render (it will show login-error when used).
 */
export const supabase = createClient(
  missing ? 'https://placeholder.supabase.co' : supabaseUrl,
  missing ? 'placeholder-anon-key' : supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/** Whether Supabase is properly configured */
export const isSupabaseConfigured = !missing;
