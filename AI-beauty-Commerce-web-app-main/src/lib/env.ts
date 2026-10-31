/**
 * Unified Environment Variable Access for Next.js and browser runtime
 */
export const isDev = process.env.NODE_ENV !== 'production';
export const isProd = process.env.NODE_ENV === 'production';

const publicEnvironment: Record<string, string | undefined> = {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_STRICT_API: process.env.NEXT_PUBLIC_STRICT_API,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

export function getEnv(key: string, fallback?: string): string | undefined {
  // Next.js only substitutes statically referenced NEXT_PUBLIC_* variables in
  // client bundles. Dynamic process.env[key] access is undefined in browsers.
  const publicKey = key.startsWith('VITE_') ? key.replace('VITE_', 'NEXT_PUBLIC_') : key;
  return publicEnvironment[publicKey] || fallback;
}
