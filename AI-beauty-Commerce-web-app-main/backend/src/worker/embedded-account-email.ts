import { setTimeout as sleep } from 'node:timers/promises';
import { getDb } from '../db/client';
import { getEmailSender } from '../lib/email';
import { dispatchAccountEmails } from '../modules/notifications/account-dispatcher';

const state = globalThis as typeof globalThis & { __deslaEmbeddedAccountEmail?: { stop: () => void; done: Promise<void> } };

/** Render Free shares 512 MB across all processes. Reuse Next's process and DB
 * pool instead of keeping a second Node + tsx + schema runtime in memory. */
export function startEmbeddedAccountEmail() {
  if (state.__deslaEmbeddedAccountEmail) return state.__deslaEmbeddedAccountEmail;
  const shutdown = new AbortController();
  const stop = () => shutdown.abort();
  const memory = () => {
    const { rss, heapUsed, external } = process.memoryUsage();
    console.log(JSON.stringify({ scope: 'web-memory', rssMb: Math.round(rss / 1048576), heapUsedMb: Math.round(heapUsed / 1048576), externalMb: Math.round(external / 1048576) }));
  };
  const interval = setInterval(memory, 300000); interval.unref();
  process.once('SIGTERM', stop); process.once('SIGINT', stop);
  const done = (async () => {
    let attempts = 0;
    try {
      while (!shutdown.signal.aborted) {
        const started = Date.now();
        try {
          await dispatchAccountEmails(getDb(), getEmailSender(), { signal: shutdown.signal });
        } catch (error) {
          const code = (error as { code?: string }).code;
          console.error(JSON.stringify({ scope: 'auth-email-worker', status: 'retry_scheduled', code: code && /^[A-Z_]+$/.test(code) ? code : 'AUTH_EMAIL_WORKER_ERROR' }));
        }
        if (shutdown.signal.aborted) break;
        attempts = Date.now() - started > 60000 ? 1 : attempts + 1;
        await sleep(Math.min(30000, 1000 * 2 ** Math.min(attempts - 1, 5)), undefined, { signal: shutdown.signal }).catch(() => {});
      }
    } finally {
      clearInterval(interval);
      process.removeListener('SIGTERM', stop); process.removeListener('SIGINT', stop);
      // The pool belongs to Next; stopping email must not close web connections.
    }
  })();
  state.__deslaEmbeddedAccountEmail = { stop, done };
  console.log(JSON.stringify({ scope: 'auth-email-supervisor', mode: 'embedded', runtime: 'in-process' }));
  memory();
  return state.__deslaEmbeddedAccountEmail;
}
