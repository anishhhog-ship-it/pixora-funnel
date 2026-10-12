import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    supabaseAnonKey !== 'your-anon-key'
  );
};

// Singleton browser client for client components
let supabaseInstance: any = null;

export const getSupabaseBrowserClient = () => {
  if (supabaseInstance) return supabaseInstance;

  if (!isSupabaseConfigured()) {
    // Return a dummy/safe client fallback if env vars are missing during local dev/mock mode
    supabaseInstance = createClient(
      supabaseUrl || 'https://wpjkmzwzijxzdldtaktz.supabase.co',
      supabaseAnonKey || 'dummy-anon-key',
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      }
    );
    return supabaseInstance;
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return supabaseInstance;
};

export const supabase = getSupabaseBrowserClient();
