import { createClient } from '@supabase/supabase-js';
import { env, hasSupabaseEnv } from '../../shared/config/env';
import type { Database } from './database.types';

export const supabase = hasSupabaseEnv
  ? createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  return supabase;
}
