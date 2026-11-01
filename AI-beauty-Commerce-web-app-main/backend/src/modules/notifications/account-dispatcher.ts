import { setTimeout as sleep } from 'node:timers/promises';
import type { AppDb } from '../../db/client';
import type { EmailSender } from '../../lib/email';
import { ACCOUNT_EMAIL_TEMPLATES, pendingAccountEmail } from './account-email';
import { claimBatch, discardAuthEmail, markFailed, markSent, recoverStaleSending } from './service';

export async function dispatchAccountEmails(db: AppDb, sender: EmailSender, options: { signal: AbortSignal; createdAfter?: Date; once?: boolean }) {
  if (sender.name === 'log') throw Object.assign(new Error('Account email requires a delivery provider.'), { code: 'EMAIL_PROVIDER_REQUIRED' });
  await sender.verify?.();
  console.log(JSON.stringify({ scope: 'auth-email-worker', status: 'ready', transport: sender.name, mode: options.createdAfter ? 'new-requests-only' : 'due-account-requests' }));
  let healthy = true;
  do {
    if (options.signal.aborted) break;
    try {
      const filter = { templates: ACCOUNT_EMAIL_TEMPLATES, createdAfter: options.createdAfter };
      await recoverStaleSending(db, 100, filter);
      const rows = await claimBatch(db, 10, filter);
      for (const row of rows) {
        if (options.signal.aborted) break;
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
      healthy = false;
      console.error(JSON.stringify({ scope: 'auth-email-worker', status: 'queue_retry_scheduled' }));
    }
    if (!options.once && !options.signal.aborted) await sleep(5000, undefined, { signal: options.signal }).catch(() => {});
  } while (!options.once && !options.signal.aborted);
  return healthy;
}
