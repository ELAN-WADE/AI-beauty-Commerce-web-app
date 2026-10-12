/**
 * Batch-1 (Part VII): the shared DB quota limiter (multi-instance safe) that
 * guards loyalty redeem, checkout, payment-init and auth routes. Mechanics on
 * PGlite — route wiring is build- + review-verified (request scope).
 */
import { describe, expect, it, beforeAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from '@/db/schema';
import { checkSharedRateLimit, Limits } from '@/lib/rate-limit';

let db: PgliteDatabase<typeof schema>;

beforeAll(async () => {
  const { pgcrypto } = await import('@electric-sql/pglite/contrib/pgcrypto');
  const { uuid_ossp } = await import('@electric-sql/pglite/contrib/uuid_ossp');
  const client = new PGlite({ extensions: { pgcrypto, uuid_ossp } });
  db = drizzle(client, { schema });
  await migrate(db as never, { migrationsFolder: './drizzle' });
}, 120000);

const pg = () => db as never;

describe('shared rate limiter (DB quotas)', () => {
  it('allows N then blocks with retry-after, per key', async () => {
    const spec = { limit: 2, windowMs: 60_000 };
    expect((await checkSharedRateLimit(pg(), 'test-quota-a', spec)).allowed).toBe(true);
    expect((await checkSharedRateLimit(pg(), 'test-quota-a', spec)).allowed).toBe(true);
    const blocked = await checkSharedRateLimit(pg(), 'test-quota-a', spec);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
    // Independent key unaffected.
    expect((await checkSharedRateLimit(pg(), 'test-quota-b', spec)).allowed).toBe(true);
  });

  it('covers the money-adjacent Batch-1 specs', async () => {
    expect(Limits.loyaltyRedeem).toMatchObject({ limit: 20 });
    expect(Limits.reviews.limit).toBeLessThanOrEqual(30);
    expect(Limits.cartWrite.limit).toBeGreaterThan(0);
    // One redeem quota consumed without error (writes the quota row).
    expect((await checkSharedRateLimit(pg(), 'loyalty:user-x', Limits.loyaltyRedeem)).allowed).toBe(true);
  });
});
