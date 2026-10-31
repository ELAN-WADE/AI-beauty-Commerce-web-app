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

  // On Render or containerized environments, auto-assign edge IP header if omitted
  if (process.env.RENDER === 'true' && !process.env.CLIENT_IP_HEADER) {
    process.env.CLIENT_IP_HEADER = 'x-forwarded-for';
  }

  // Auto-detect Render external URL if APP_URL or FRONTEND_URL are omitted
  if (process.env.RENDER_EXTERNAL_URL) {
    if (!process.env.APP_URL) process.env.APP_URL = process.env.RENDER_EXTERNAL_URL;
    if (!process.env.FRONTEND_URL) process.env.FRONTEND_URL = process.env.RENDER_EXTERNAL_URL;
  }
  if (process.env.APP_URL && !process.env.APP_URL.startsWith('http://') && !process.env.APP_URL.startsWith('https://')) {
    process.env.APP_URL = `https://${process.env.APP_URL}`;
  }
  if (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.startsWith('http://') && !process.env.FRONTEND_URL.startsWith('https://')) {
    process.env.FRONTEND_URL = `https://${process.env.FRONTEND_URL}`;
  }

  const isDevDeploy =
    process.env.RENDER_DEV === 'true' ||
    process.env.DEV_DEPLOY === 'true' ||
    process.env.SKIP_PROD_ENV_ASSERT === 'true';

  required('DATABASE_URL');

  // In dev deploy mode, skip strict requirements for external 3rd-party services
  if (isDevDeploy) {
    if (process.env.CLIENT_IP_HEADER) {
      const allowedIpHeaders = ['x-verified-client-ip', 'x-forwarded-for', 'cf-connecting-ip', 'true-client-ip'];
      const header = process.env.CLIENT_IP_HEADER.toLowerCase();
      if (!allowedIpHeaders.includes(header)) {
        throw new Error(`CLIENT_IP_HEADER must be one of: ${allowedIpHeaders.join(', ')}.`);
      }
    }
    return;
  }

  required('APP_URL');
  required('FRONTEND_URL');
  required('SMTP_HOST');
  required('SMTP_FROM');
  required('SMTP_USER');
  required('SMTP_PASS');
  if (process.env.PAYMENTS_ENABLED === 'true') {
    for (const name of ['BANK_NAME', 'BANK_ACCOUNT_NUMBER', 'BANK_ACCOUNT_NAME'] as const) required(name);
  }
  if (!/^[a-f0-9]{64}$/i.test(required('AUTH_EMAIL_ENCRYPTION_KEY'))) throw new Error('AUTH_EMAIL_ENCRYPTION_KEY must be 64 hex characters.');
  if (!/^[a-f0-9]{64}$/i.test(required('MFA_ENCRYPTION_KEY'))) throw new Error('MFA_ENCRYPTION_KEY must be 64 hex characters.');
  const clientIpHeader = required('CLIENT_IP_HEADER').toLowerCase();
  const allowedIpHeaders = ['x-verified-client-ip', 'x-forwarded-for', 'cf-connecting-ip', 'true-client-ip'];
  if (!allowedIpHeaders.includes(clientIpHeader)) {
    throw new Error(`CLIENT_IP_HEADER must be one of: ${allowedIpHeaders.join(', ')} (edge-owned).`);
  }
  // Mutating API requests are also protected by shared PostgreSQL quotas;
  // edge/WAF limits remain a useful additional layer, not a boot prerequisite.
  // Payment verification must fail closed: never settle against a placeholder.
  for (const k of process.env.PAYMENTS_ENABLED === 'true' ? ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'FLW_SECRET_KEY', 'FLW_SECRET_HASH'] as const : []) {
    const v = process.env[k] ?? '';
    if (!v || /placeholder/i.test(v)) {
      throw new Error(`${k} must be a real production secret (found placeholder/empty).`);
    }
  }
  if (!process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY) {
    throw new Error('S3_ACCESS_KEY / S3_SECRET_KEY are required in production (scan uploads).');
  }
}
