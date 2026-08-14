import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check your environment configuration.'
    );
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
};

// For backward compatibility - lazy getter
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    return (getSupabase() as any)[prop];
  }
});
