/**
 * Phase 6 proof: Stripe end-to-end on PGlite with stubbed HTTP —
 * init (Checkout Session) → return/webhook verify (session retrieve) →
 * settle (PAID exactly once, replay converges). No Stripe keys needed.
 */
import { describe, expect, it, beforeAll, afterAll, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { users } from '@/modules/auth/schema';
import { initPayment, settleAttempt } from '@/modules/payments/service';
import { orders } from '@/modules/orders/schema';

let client: PGlite;
let db: PgliteDatabase<typeof schema>;
let userId: string;

beforeAll(async () => {
  const { pgcrypto } = await import('@electric-sql/pglite/contrib/pgcrypto');
  const { uuid_ossp } = await import('@electric-sql/pglite/contrib/uuid_ossp');
  client = new PGlite({ extensions: { pgcrypto, uuid_ossp } });
  db = drizzle(client, { schema });
  await migrate(db as never, { migrationsFolder: './drizzle' });
  vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_x');
  vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_x');
  const [user] = await db.insert(users).values({ email: 'stripe@example.com', passwordHash: 'x' }).returning({ id: users.id });
  userId = user.id;
}, 120000);
afterAll(async () => { vi.unstubAllEnvs(); await client?.close(); });

const pg = () => db as never;
const sessionCreate = async () =>
  new Response(JSON.stringify({ id: 'cs_test_123', url: 'https://checkout.stripe.com/pay/cs_test_123' }));
const sessionRetrievePaid = (reference: string, amountKobo: number) => async () =>
  new Response(
    JSON.stringify({
      id: 'cs_test_123',
      payment_status: 'paid',
      status: 'complete',
      amount_total: amountKobo,
      currency: 'ngn',
      metadata: { reference },
      payment_intent: 'pi_test_123',
    }),
  );

describe('stripe hosted checkout (stubbed HTTP)', () => {
  it('inits a session, settles paid-once, replays converge', async () => {
    const [order] = await db
      .insert(schema.orders)
      .values({
        userId,
        orderNumber: 'DES-STRIPE-1',
        idempotencyKey: 'stripe-key-1',
        subtotalKobo: 250000,
        totalKobo: 250000,
        shippingAddress: { fullName: 'Buyer', city: 'Lagos' },
      })
      .returning({ id: schema.orders.id });
    const attempt = await initPayment(pg(), {
      userId,
      orderId: order.id,
      provider: 'stripe',
      appUrl: 'https://shop.example.com',
      idempotencyKey: 'stripe-init-1',
      fetchFn: sessionCreate,
    });
    expect(attempt.provider).toBe('stripe');
    expect(attempt.authorizationUrl).toBe('https://checkout.stripe.com/pay/cs_test_123');

    const first = await settleAttempt(pg(), {
      provider: 'stripe',
      reference: attempt.reference,
      transactionId: 'cs_test_123',
      fetchFn: sessionRetrievePaid(attempt.reference, 250000),
    });
    expect(first.settled).toBe(true);
    expect(first.replay).toBe(false);
    const second = await settleAttempt(pg(), {
      provider: 'stripe',
      reference: attempt.reference,
      transactionId: 'cs_test_123',
      fetchFn: sessionRetrievePaid(attempt.reference, 250000),
    });
    expect(second).toMatchObject({ settled: true, replay: true });

    const [row] = await db.select({ status: orders.paymentStatus }).from(orders).where(eq(orders.id, order.id));
    expect(row.status).toBe('PAID');
  });

  it('rejects amount/reference mismatch instead of settling', async () => {
    const [order] = await db
      .insert(schema.orders)
      .values({
        userId,
        orderNumber: 'DES-STRIPE-2',
        idempotencyKey: 'stripe-key-2',
        subtotalKobo: 250000,
        totalKobo: 250000,
        shippingAddress: { fullName: 'Buyer', city: 'Lagos' },
      })
      .returning({ id: schema.orders.id });
    const attempt = await initPayment(pg(), {
      userId,
      orderId: order.id,
      provider: 'stripe',
      appUrl: 'https://shop.example.com',
      idempotencyKey: 'stripe-init-2',
      fetchFn: sessionCreate,
    });
    // Wrong amount from the "provider" → mismatch, never PAID.
    const res = await settleAttempt(pg(), {
      provider: 'stripe',
      reference: attempt.reference,
      transactionId: 'cs_test_123',
      fetchFn: sessionRetrievePaid(attempt.reference, 1),
    });
    expect(res.settled).toBe(false);
    expect(res.reason).toBe('verification-mismatch');
  });
});
