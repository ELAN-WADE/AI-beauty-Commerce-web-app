import { setTimeout as sleep } from 'node:timers/promises';
import { getDb } from '../db/client';
import { dispatchCommissions } from '../modules/notifications/commission-dispatcher';
import { releaseCommissions } from '../modules/ledger/service';

const state = globalThis as typeof globalThis & { __deslaEmbeddedCommissions?: { stop: () => void; done: Promise<void> } };

/** Share the web process and pool; never create a second financial runtime. */
export function startEmbeddedCommissions() {
  if (state.__deslaEmbeddedCommissions) return state.__deslaEmbeddedCommissions;
  const shutdown = new AbortController();
  const stop = () => shutdown.abort();
  process.once('SIGTERM', stop); process.once('SIGINT', stop);
  const done = (async () => {
    let nextRelease = 0;
    try {
      while (!shutdown.signal.aborted) {
        try {
          const result = await dispatchCommissions(getDb());
          if (result.settled || result.failed) console.log(JSON.stringify({ scope: 'commission-worker', ...result }));
        } catch {
          console.error(JSON.stringify({ scope: 'commission-worker', status: 'queue_retry_scheduled' }));
        }
        if (!shutdown.signal.aborted && Date.now() >= nextRelease) {
          nextRelease = Date.now() + 60000;
          try { await releaseCommissions(getDb()); }
          catch { console.error(JSON.stringify({ scope: 'commission-worker', status: 'release_retry_scheduled' })); }
        }
        if (!shutdown.signal.aborted) await sleep(10000, undefined, { signal: shutdown.signal }).catch(() => {});
      }
    } finally {
      process.removeListener('SIGTERM', stop); process.removeListener('SIGINT', stop);
    }
  })();
  state.__deslaEmbeddedCommissions = { stop, done };
  console.log(JSON.stringify({ scope: 'commission-worker', status: 'ready', runtime: 'in-process' }));
  return state.__deslaEmbeddedCommissions;
}
