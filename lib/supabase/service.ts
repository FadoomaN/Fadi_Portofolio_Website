import { createClient } from '@supabase/supabase-js';
import { getSupabaseEnv } from './env';

// Server routes only. Never expose this key in a NEXT_PUBLIC_ variable or a response.
export function createServiceSupabaseClient() {
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!key) throw new Error('Comment service is not configured.');
  return createClient(getSupabaseEnv().url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
