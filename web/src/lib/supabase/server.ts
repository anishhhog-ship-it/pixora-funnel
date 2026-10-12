import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Creates an administrative Supabase client using the Service Role Key.
 * MUST ONLY be called in server environments (API routes, server actions).
 * NEVER expose this or import into client components.
 */
export const getSupabaseAdminClient = () => {
  if (typeof window !== 'undefined') {
    throw new Error('SECURITY VIOLATION: getSupabaseAdminClient cannot be called from browser context.');
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase admin configuration missing: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required.');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
