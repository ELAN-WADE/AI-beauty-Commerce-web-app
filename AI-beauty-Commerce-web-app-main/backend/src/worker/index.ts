import '../lib/load-env';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { setTimeout as sleep } from 'node:timers/promises';
import { closeDb, getDb } from '../db/client';
import { captureError } from '../lib/observe';
import { runAllTasks } from './tasks';
import { workerHeartbeats } from '../modules/ops/schema';

/**
 * Background worker (S7): outbox sender, reservation sweeper, abandoned-cart
 * reminders, scan retention purge. Stateless: safe to run N replicas (SKIP
 * LOCKED claiming) or as a cron job.
 *
 *   npm run worker        # loop (WORKER_INTERVAL_MS, default 60s)
 *   npm run worker:once   # single pass (cron / CI smoke)
 */
async function main() {
  const once = process.argv.includes('--once');
  const intervalMs = Number(process.env.WORKER_INTERVAL_MS ?? 60_000);
  if (!Number.isInteger(intervalMs) || intervalMs < 1000 || intervalMs > 3600_000) {
    throw new Error('WORKER_INTERVAL_MS must be an integer between 1000 and 3600000.');
  }
  const db = getDb();
  const workerId = randomUUID();
  const shutdown = new AbortController();
  const stop = () => shutdown.abort();
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  await db.insert(workerHeartbeats).values({ id: workerId, status: 'starting' });
  const heartbeat = async () => {
    await db.update(workerHeartbeats).set({ status: 'running', heartbeatAt: new Date() }).where(eq(workerHeartbeats.id, workerId));
  };

  const pass = async () => {
    await heartbeat();
    const results = await runAllTasks(db, heartbeat);
    await db.update(workerHeartbeats).set({ status: results.every(r => r.ok) ? 'idle' : 'degraded', heartbeatAt: new Date(), completedAt: new Date(), results }).where(eq(workerHeartbeats.id, workerId));
    console.log(JSON.stringify({ level: 'info', scope: 'worker', results }));
    return results.every(r => r.ok);
  };

  try {
    if (once) {
      process.exitCode = await pass() ? 0 : 1;
      return;
    }
    while (!shutdown.signal.aborted) {
      await pass().catch(async (err) => {
        console.error(JSON.stringify({ level: 'error', scope: 'worker', err: String(err) }));
        captureError(err, { scope: 'worker' });
        await db.update(workerHeartbeats).set({ status: 'degraded', heartbeatAt: new Date() }).where(eq(workerHeartbeats.id, workerId));
      });
      if (!shutdown.signal.aborted) await sleep(intervalMs, undefined, { signal: shutdown.signal }).catch(err => {
        if (!shutdown.signal.aborted) throw err;
      });
    }
  } finally {
    if (!once) await db.update(workerHeartbeats).set({ status: 'stopped', heartbeatAt: new Date() }).where(eq(workerHeartbeats.id, workerId));
    process.off('SIGINT', stop);
    process.off('SIGTERM', stop);
    await closeDb();
  }
}

main().catch(async (err) => {
  console.error(err);
  captureError(err, { scope: 'worker-boot' });
  await closeDb();
  process.exitCode = 1;
});
