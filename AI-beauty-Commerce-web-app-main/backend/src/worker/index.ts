import 'dotenv/config';
import { getDb } from '../db/client';
import { captureError } from '../lib/observe';
import { runAllTasks } from './tasks';

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
  const db = getDb();

  const pass = async () => {
    const results = await runAllTasks(db);
    console.log(JSON.stringify({ level: 'info', scope: 'worker', results }));
  };

  if (once) {
    await pass();
    process.exit(0);
  }
  const stop = () => process.exit(0);
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  for (;;) {
    await pass().catch((err) => {
      console.error(JSON.stringify({ level: 'error', scope: 'worker', err: String(err) }));
      captureError(err, { scope: 'worker' });
    });
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

main().catch((err) => {
  console.error(err);
  captureError(err, { scope: 'worker-boot' });
  process.exit(1);
});
