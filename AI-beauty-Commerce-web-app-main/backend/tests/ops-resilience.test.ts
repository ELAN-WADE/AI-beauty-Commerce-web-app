/**
 * Principal-directive batch (Parts V+XIII): bulkheads shed load instead of
 * queueing unboundedly, and feature flags gate risky providers without a
 * redeploy. Pure + PGlite — no request scope, no network.
 */
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from '@/db/schema';
import { users } from '@/modules/auth/schema';
import { BulkheadLimits, bulkheadDepth, resetBulkheads, tryAcquire } from '@/lib/bulkhead';
import { featureFlags } from '@/modules/ops/schema';
import { isEnabled, resetFlagCache } from '@/modules/ops/service';
import { initPayment } from '@/modules/payments/service';

describe('bulkhead semaphore', () => {
  it('caps concurrency, releases slots, reports depth', () => {
    resetBulkheads();
    const a = tryAcquire('t', 2);
    const b = tryAcquire('t', 2);
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect(tryAcquire('t', 2)).toBeNull(); // saturated: shed, don't queue
    expect(bulkheadDepth('t')).toEqual({ t: 2 });
    a!();
    a!(); // double-release is harmless
    expect(tryAcquire('t', 2)).not.toBeNull();
    resetBulkheads();
    expect(bulkheadDepth()).toEqual({});
  });

  it('ships sane production defaults (checkout pool headroom)', () => {
    // Pool max is 20/instance; non-commerce ceilings must leave headroom.
    const total = BulkheadLimits.ai() + BulkheadLimits.recommendations() + BulkheadLimits.skin();
    expect(total).toBeLessThanOrEqual(18);
  });
});

let client: PGlite;
let db: PgliteDatabase<typeof schema>;
let userId: string;

beforeAll(async () => {
  const { pgcrypto } = await import('@electric-sql/pglite/contrib/pgcrypto');
  const { uuid_ossp } = await import('@electric-sql/pglite/contrib/uuid_ossp');
  client = new PGlite({ extensions: { pgcrypto, uuid_ossp } });
  db = drizzle(client, { schema });
  await migrate(db as never, { migrationsFolder: './drizzle' });
  const [user] = await db.insert(users).values({ email: 'flags@example.com', passwordHash: 'x' }).returning({ id: users.id });
  userId = user.id;
}, 120000);
afterAll(async () => { await client?.close(); });

const pg = () => db as never;

describe('feature flags', () => {
  it('defaults on when no row exists, honors explicit rows', async () => {
    resetFlagCache();
    await expect(isEnabled(pg(), 'stripe', true)).resolves.toBe(true);
    await expect(isEnabled(pg(), 'stripe', false)).resolves.toBe(false);
    await db.insert(featureFlags).values({ key: 'stripe', enabled: false });
    resetFlagCache();
    await expect(isEnabled(pg(), 'stripe', true)).resolves.toBe(false);
  });

  it('gates Stripe init with a clean 503 (kill-switch, no provider contact)', async () => {
    const [order] = await db
      .insert(schema.orders)
      .values({ userId, orderNumber: 'DES-FLAG-1', idempotencyKey: 'flag-key-1', subtotalKobo: 1000, totalKobo: 1000, shippingAddress: {} })
      .returning({ id: schema.orders.id });
    let contacted = false;
    const fetchFn = (async () => {
      contacted = true;
      return new Response('{}');
    }) as typeof fetch;
    await expect(
      initPayment(pg(), { userId, orderId: order.id, provider: 'stripe', appUrl: 'https://x.example', idempotencyKey: 'flag-init-1', fetchFn }),
    ).rejects.toMatchObject({ status: 503, code: 'provider_unavailable' });
    expect(contacted).toBe(false);
  });
});
