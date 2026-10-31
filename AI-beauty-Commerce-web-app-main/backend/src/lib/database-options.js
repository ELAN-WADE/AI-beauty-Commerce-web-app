/**
 * Share TLS selection between runtime, migrations, and the startup check.
 * @param {string} url
 * @param {string | undefined} sslMode
 * @returns {{ssl?: false | 'require' | 'allow' | 'prefer' | 'verify-full'}}
 */
export function databaseSslOptions(url, sslMode) {
  if (sslMode && !['disable', 'require', 'allow', 'prefer', 'verify-full'].includes(sslMode)) {
    throw new Error('DATABASE_SSL_MODE must be disable, require, allow, prefer, or verify-full.');
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL.');
  }
  if (sslMode) return { ssl: sslMode === 'disable' ? false : sslMode };
  // Preserve provider URL options, including stronger certificate verification.
  if (['ssl', 'sslmode', 'sslrootcert'].some(key => parsed.searchParams.has(key))) return {};
  return /(?:^|\.)(?:render\.com|neon\.tech|supabase\.co|amazonaws\.com|aws\.com)$/i.test(parsed.hostname)
    ? { ssl: 'require' }
    : {};
}

/** Bounded per-process pools; the web server and account worker share one DB. */
export function databasePoolOptions(env = process.env) {
  const integer = (name, fallback, min, max) => {
    const raw = env[name];
    if (raw !== undefined && !/^\d+$/.test(raw)) throw new Error(`${name} must be an integer between ${min} and ${max}.`);
    const value = raw === undefined ? fallback : Number(raw);
    if (!Number.isInteger(value) || value < min || value > max) throw new Error(`${name} must be an integer between ${min} and ${max}.`);
    return value;
  };
  return {
    max: integer('DATABASE_POOL_MAX', env.RENDER === 'true' ? 5 : 10, 1, 50),
    idle_timeout: integer('DATABASE_IDLE_TIMEOUT_SECONDS', 60, 1, 600),
    connect_timeout: integer('DATABASE_CONNECT_TIMEOUT_SECONDS', 10, 1, 30),
  };
}
