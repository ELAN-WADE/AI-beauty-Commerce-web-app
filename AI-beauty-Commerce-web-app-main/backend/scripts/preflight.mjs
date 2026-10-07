// Container startup gate: no traffic/worker runs with a half-configured env.
const required = ['DATABASE_URL', 'APP_URL', 'FRONTEND_URL', 'SMTP_HOST', 'SMTP_FROM', 'SMTP_USER', 'SMTP_PASS', 'AUTH_EMAIL_ENCRYPTION_KEY', 'CLIENT_IP_HEADER', 'PAYSTACK_SECRET_KEY', 'FLW_SECRET_KEY', 'FLW_SECRET_HASH', 'S3_ACCESS_KEY', 'S3_SECRET_KEY', 'BANK_NAME', 'BANK_ACCOUNT_NUMBER', 'BANK_ACCOUNT_NAME'];
if (process.env.NODE_ENV !== 'production') throw new Error('Production container must set NODE_ENV=production');
for (const name of required) {
  if (!process.env[name]?.trim() || /placeholder/i.test(process.env[name])) throw new Error(`Production setting ${name} is missing or a placeholder`);
}
if (!/^[a-f0-9]{64}$/i.test(process.env.AUTH_EMAIL_ENCRYPTION_KEY)) throw new Error('Invalid AUTH_EMAIL_ENCRYPTION_KEY');
if (process.env.CLIENT_IP_HEADER !== 'x-verified-client-ip' || process.env.EDGE_RATE_LIMIT_ENABLED !== 'true') throw new Error('Configured trusted reverse proxy and edge rate limiting are required');
for (const name of ['APP_URL', 'FRONTEND_URL']) if (!process.env[name].startsWith('https://')) throw new Error(`${name} must use HTTPS`);
