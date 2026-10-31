// Container startup gate: verifies essential environment before traffic/worker runs.
const isDevDeploy =
  process.env.RENDER_DEV === 'true' ||
  process.env.DEV_DEPLOY === 'true' ||
  process.env.SKIP_PREFLIGHT === 'true';

// Auto-fill Render deployment variables if omitted
if (process.env.RENDER === 'true') {
  if (!process.env.CLIENT_IP_HEADER) process.env.CLIENT_IP_HEADER = 'x-forwarded-for';
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
}

if (!process.env.DATABASE_URL?.trim()) {
  throw new Error('DATABASE_URL is required to start the application');
}

if (isDevDeploy) {
  console.log('[preflight] Dev deploy mode: database verified; skipping strict 3rd-party credentials gate.');
  process.exit(0);
}

const required = ['DATABASE_URL', 'APP_URL', 'FRONTEND_URL', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI', 'SMTP_HOST', 'SMTP_FROM', 'SMTP_USER', 'SMTP_PASS', 'AUTH_EMAIL_ENCRYPTION_KEY', 'MFA_ENCRYPTION_KEY', 'CLIENT_IP_HEADER', 'S3_ACCESS_KEY', 'S3_SECRET_KEY'];
if (process.env.PAYMENTS_ENABLED === 'true') required.push('STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'FLW_SECRET_KEY', 'FLW_SECRET_HASH', 'BANK_NAME', 'BANK_ACCOUNT_NUMBER', 'BANK_ACCOUNT_NAME');
if (process.env.NODE_ENV !== 'production') throw new Error('Production container must set NODE_ENV=production');
for (const name of required) {
  if (!process.env[name]?.trim() || /placeholder/i.test(process.env[name])) throw new Error(`Production setting ${name} is missing or a placeholder`);
}
if (!/^[a-f0-9]{64}$/i.test(process.env.AUTH_EMAIL_ENCRYPTION_KEY)) throw new Error('Invalid AUTH_EMAIL_ENCRYPTION_KEY');
if (!/^[a-f0-9]{64}$/i.test(process.env.MFA_ENCRYPTION_KEY)) throw new Error('Invalid MFA_ENCRYPTION_KEY');
const allowedIpHeaders = ['x-verified-client-ip', 'x-forwarded-for', 'cf-connecting-ip', 'true-client-ip'];
if (!allowedIpHeaders.includes(process.env.CLIENT_IP_HEADER?.toLowerCase())) {
  throw new Error(`Configured trusted reverse proxy is required (CLIENT_IP_HEADER must be one of: ${allowedIpHeaders.join(', ')})`);
}
for (const name of ['APP_URL', 'FRONTEND_URL']) if (!process.env[name].startsWith('https://')) throw new Error(`${name} must use HTTPS`);
if (!process.env.GOOGLE_REDIRECT_URI.startsWith('https://')) throw new Error('GOOGLE_REDIRECT_URI must use HTTPS');
const expectedGoogleRedirect = `${process.env.APP_URL.replace(/\/+$/, '')}/api/auth/oauth/google/callback`;
if (process.env.GOOGLE_REDIRECT_URI.replace(/\/+$/, '') !== expectedGoogleRedirect) {
  throw new Error(`GOOGLE_REDIRECT_URI must exactly match ${expectedGoogleRedirect}`);
}
