import { afterAll, beforeAll, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { outboxHealth } from '@/modules/notifications/service';
import * as schema from '@/db/schema';

let client: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;
beforeAll(async () => {
  const { pgcrypto } = await import('@electric-sql/pglite/contrib/pgcrypto');
  const { uuid_ossp } = await import('@electric-sql/pglite/contrib/uuid_ossp');
  client = new PGlite({ extensions: { pgcrypto, uuid_ossp } });
  db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: './drizzle' });
}, 120000);
afterAll(async () => { await client?.close(); });

it('exposes old backlog and expired worker leases instead of aging them out of metrics', async () => {
  expect(await outboxHealth(db as never)).toEqual({ pending: 0, due: 0, sending: 0, expiredLeases: 0, failed: 0, oldestOutstandingAgeSec: 0 });
  const old = new Date(Date.now() - 3 * 86400_000);
  const future = new Date(Date.now() + 3600_000);
  await db.insert(schema.notificationOutbox).values([
    { channel: 'email', template: 'test.old', payload: {}, status: 'pending', createdAt: old, nextAttemptAt: old },
    { channel: 'email', template: 'test.retry', payload: {}, status: 'pending', nextAttemptAt: future },
    { channel: 'email', template: 'test.crashed', payload: {}, status: 'sending', nextAttemptAt: old },
    { channel: 'email', template: 'test.active', payload: {}, status: 'sending', nextAttemptAt: future },
    { channel: 'email', template: 'test.failed', payload: {}, status: 'failed', createdAt: old },
    { channel: 'email', template: 'test.sent', payload: {}, status: 'sent', createdAt: new Date(0) },
  ]);
  const health = await outboxHealth(db as never);
  expect(health).toMatchObject({ pending: 2, due: 1, sending: 2, expiredLeases: 1, failed: 1 });
  expect(health.oldestOutstandingAgeSec).toBeGreaterThanOrEqual(3 * 86400);
  expect(health.oldestOutstandingAgeSec).toBeLessThan(4 * 86400);
});
