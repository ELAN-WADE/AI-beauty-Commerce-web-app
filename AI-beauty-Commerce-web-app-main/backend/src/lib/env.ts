/**
 * Standalone backend boundary (disconnect from storefront).
 * The API must boot without any frontend files/env. In production we fail
 * fast when required server env is missing instead of running half-configured
 * (wrong CORS, broken redirects, unverifiable webhooks).
 */

function required(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === '') {
    throw new Error(`${name} is not set (see backend/.env.example).`);
  }
  return v;
}

export function assertProductionEnv(): void {
  if (process.env.NODE_ENV !== 'production') return;
  required('DATABASE_URL');
  required('APP_URL');
  required('FRONTEND_URL');
  required('SMTP_HOST');
  required('SMTP_FROM');
  required('SMTP_USER');
  required('SMTP_PASS');
  for (const name of ['BANK_NAME', 'BANK_ACCOUNT_NUMBER', 'BANK_ACCOUNT_NAME'] as const) required(name);
  if (!/^[a-f0-9]{64}$/i.test(required('AUTH_EMAIL_ENCRYPTION_KEY'))) throw new Error('AUTH_EMAIL_ENCRYPTION_KEY must be 64 hex characters.');
  required('CLIENT_IP_HEADER');
  if (process.env.CLIENT_IP_HEADER?.toLowerCase() !== 'x-verified-client-ip') throw new Error('CLIENT_IP_HEADER must be x-verified-client-ip (edge-owned).');
  // No in-process limiter can protect a horizontally scaled deployment alone.
  if (process.env.EDGE_RATE_LIMIT_ENABLED !== 'true') throw new Error('Configure edge rate limiting before serving production traffic.');
  // Payment verification must fail closed: never settle against a placeholder.
  for (const k of ['PAYSTACK_SECRET_KEY', 'FLW_SECRET_KEY', 'FLW_SECRET_HASH'] as const) {
    const v = process.env[k] ?? '';
    if (!v || /placeholder/i.test(v)) {
      throw new Error(`${k} must be a real production secret (found placeholder/empty).`);
    }
  }
  if (!process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY) {
    throw new Error('S3_ACCESS_KEY / S3_SECRET_KEY are required in production (scan uploads).');
  }
}
