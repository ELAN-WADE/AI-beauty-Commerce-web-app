import '../src/lib/load-env';
import { setTimeout as sleep } from 'node:timers/promises';
import { closeDb, getDb } from '../src/db/client';
import { getEmailSender } from '../src/lib/email';
import { ACCOUNT_EMAIL_TEMPLATES, pendingAccountEmail } from '../src/modules/notifications/account-email';
import { claimBatch, discardAuthEmail, markFailed, markSent, recoverStaleSending } from '../src/modules/notifications/service';

// A dedicated dispatcher: no order/payment/inventory tasks or marketing emails.
const newOnly = process.argv.includes('--new-only');
const cutoff = process.env.AUTH_EMAIL_CREATED_AFTER;
const createdAfter = newOnly ? new Date(cutoff || Date.now()) : undefined;
if (createdAfter && !Number.isFinite(createdAfter.getTime())) throw new Error('AUTH_EMAIL_CREATED_AFTER must be a valid timestamp.');
const once = process.argv.includes('--once');
const shutdown = new AbortController();
process.on('SIGINT', () => shutdown.abort());
process.on('SIGTERM', () => shutdown.abort());
const db = getDb();
try {
  const sender = getEmailSender();
  if (sender.name === 'log') throw Object.assign(new Error('Account email requires a delivery provider.'), { code: 'EMAIL_PROVIDER_REQUIRED' });
  await sender.verify?.();
  console.log(JSON.stringify({ scope: 'auth-email-worker', status: 'ready', transport: sender.name, mode: newOnly ? 'new-requests-only' : 'due-account-requests' }));
  do {
    try {
    const filter = { templates: ACCOUNT_EMAIL_TEMPLATES, createdAfter };
    await recoverStaleSending(db, 100, filter);
    const rows = await claimBatch(db, 10, filter);
    for (const row of rows) {
      try {
        const message = await pendingAccountEmail(db, row);
        if (!message) { await discardAuthEmail(db, row.id); continue; }
        await sender.send(message);
        await markSent(db, row.id);
        console.log(JSON.stringify({ scope: 'auth-email-worker', status: 'sent', template: row.template }));
      } catch (error) {
        await markFailed(db, row.id);
        const code = (error as { code?: string }).code;
        console.error(JSON.stringify({ scope: 'auth-email-worker', status: 'retry_scheduled', template: row.template, code: code && /^[A-Z_]+$/.test(code) ? code : 'DELIVERY_ERROR' }));
      }
    }
    } catch {
      console.error(JSON.stringify({ scope: 'auth-email-worker', status: 'queue_retry_scheduled' }));
      if (once) process.exitCode = 1;
    }
    if (!once && !shutdown.signal.aborted) await sleep(5000, undefined, { signal: shutdown.signal }).catch(() => {});
  } while (!once && !shutdown.signal.aborted);
} catch (error) {
  const code = (error as { code?: string }).code;
  console.error(JSON.stringify({ scope: 'auth-email-worker', status: 'failed', code: code && /^[A-Z_]+$/.test(code) ? code : 'AUTH_EMAIL_WORKER_ERROR' }));
  process.exitCode = 1;
} finally { await closeDb(); }
