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
