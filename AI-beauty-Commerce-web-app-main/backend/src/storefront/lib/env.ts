// Next substitutes only statically named public variables in the browser bundle.
const values: Record<string, string | undefined> = {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};
export function publicEnv(key: string, _legacyKey?: string): string | undefined { return values[key]; }
export function isProd(): boolean { return process.env.NODE_ENV === 'production'; }
export function isDev(): boolean { return process.env.NODE_ENV === 'development'; }
export function appMode(): string { return process.env.NODE_ENV ?? 'development'; }
