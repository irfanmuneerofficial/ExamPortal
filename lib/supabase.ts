import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ecpmpglvfacxzwiffkcm.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_U831X8CieTukjfgVQEyThQ_qs7_Rn5L';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function isSupabaseReady(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}
