import '../src/lib/load-env';
import { closeDb, getDb } from '../src/db/client';
import { getEmailSender } from '../src/lib/email';
import { dispatchAccountEmails } from '../src/modules/notifications/account-dispatcher';

// A dedicated dispatcher: no order/payment/inventory tasks or marketing emails.
const newOnly = process.argv.includes('--new-only');
const cutoff = process.env.AUTH_EMAIL_CREATED_AFTER;
const createdAfter = newOnly ? new Date(cutoff || Date.now()) : undefined;
if (createdAfter && !Number.isFinite(createdAfter.getTime())) throw new Error('AUTH_EMAIL_CREATED_AFTER must be a valid timestamp.');
const once = process.argv.includes('--once');
const shutdown = new AbortController();
process.on('SIGINT', () => shutdown.abort());
process.on('SIGTERM', () => shutdown.abort());
// Standalone workers use a smaller pool unless explicitly configured.
if (!process.env.DATABASE_POOL_MAX) process.env.DATABASE_POOL_MAX = process.env.AUTH_EMAIL_DATABASE_POOL_MAX || '2';
const db = getDb();
try {
  const healthy = await dispatchAccountEmails(db, getEmailSender(), { signal: shutdown.signal, createdAfter, once });
  if (once && !healthy) process.exitCode = 1;
} catch (error) {
  const code = (error as { code?: string }).code;
  console.error(JSON.stringify({ scope: 'auth-email-worker', status: 'failed', code: code && /^[A-Z_]+$/.test(code) ? code : 'AUTH_EMAIL_WORKER_ERROR' }));
  process.exitCode = 1;
} finally { await closeDb(); }
