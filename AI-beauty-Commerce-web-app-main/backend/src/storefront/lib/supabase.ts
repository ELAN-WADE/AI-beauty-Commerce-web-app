// Desla!™ Backend — Supabase client (browser-safe).
// Gracefully returns null when env keys are missing so the app falls back
// to local mocks in src/data/*.ts instead of crashing.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { publicEnv } from './env';

const url = publicEnv('NEXT_PUBLIC_SUPABASE_URL', 'VITE_SUPABASE_URL');
const anonKey = publicEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true },
      realtime: { params: { eventsPerSecond: 5 } },
    });
  }
  return client;
}
