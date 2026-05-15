import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

const getSupabase = (): SupabaseClient | null => {
  // During build/SSR, return null
  if (typeof window === 'undefined') {
    return null;
  }
  
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase environment variables are missing');
      return null;
    }
    
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
};

// Create a proxy that handles null gracefully
const supabaseProxy = new Proxy({} as SupabaseClient, {
  get: (_, prop) => {
    const client = getSupabase();
    if (!client) {
      // Return a dummy async function that returns null
      if (typeof prop === 'string' && (prop === 'auth' || prop === 'from' || prop === 'storage')) {
        return new Proxy({}, {
          get: () => async () => ({ data: null, error: new Error('Supabase not initialized') })
        });
      }
      return async () => ({ data: null, error: new Error('Supabase not initialized') });
    }
    const value = client[prop as keyof SupabaseClient];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
});

export const supabase = supabaseProxy;
export { getSupabase };
