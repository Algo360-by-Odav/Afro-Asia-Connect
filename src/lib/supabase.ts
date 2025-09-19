import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isConfigured) {
  console.warn('⚠️ Supabase not configured. Environment variables missing:');
  console.warn('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseAnonKey);
}

// Create a single instance to avoid multiple client warnings
let supabaseInstance: ReturnType<typeof createClient> | null = null;
let supabaseAdminInstance: ReturnType<typeof createClient> | null = null;

export const getSupabaseClient = () => {
  if (!supabaseInstance && isConfigured) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return supabaseInstance;
};

export const getSupabaseAdmin = () => {
  if (!supabaseAdminInstance && isConfigured && supabaseServiceKey) {
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseAdminInstance;
};

// Export the client instance (will be null if not configured)
export const supabase = getSupabaseClient();
export const supabaseAdmin = getSupabaseAdmin();
export const isSupabaseConfigured = isConfigured;
