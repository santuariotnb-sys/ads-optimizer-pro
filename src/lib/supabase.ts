import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    if (!supabaseUrl || !supabaseAnonKey) {
      // Return a dummy client that throws on any operation
      // This prevents crash at import time when env vars are not set
      const handler: ProxyHandler<object> = {
        get: (_target, prop) => {
          if (prop === 'auth') return new Proxy({}, handler);
          if (prop === 'from') return () => new Proxy({}, handler);
          if (typeof prop === 'string') return () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } });
          return undefined;
        },
      };
      return new Proxy({}, handler) as SupabaseClient;
    }
    _client = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _client;
}

export const supabase = getClient();
