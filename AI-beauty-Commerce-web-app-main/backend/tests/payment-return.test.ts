import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from '@/db/schema';
import { lookupReturnOrder, returnErrorUrl, returnRedirectUrl } from '@/modules/payments/return';

describe('provider return redirect contract (pure)', () => {
  const base = new URL('https://shop.example.com/');

  it('lands settled shoppers with reference, provider and order handle', () => {
    const url = new URL(returnRedirectUrl(base, { reference: 'DES-ABC-XYZ', provider: 'paystack', settled: true, orderNumber: 'DES-ABC123' }));
    expect(url.origin).toBe('https://shop.example.com');
    expect(url.searchParams.get('pay')).toBe('DES-ABC-XYZ');
    expect(url.searchParams.get('provider')).toBe('paystack');
    expect(url.searchParams.get('order')).toBe('DES-ABC123');
    expect(url.searchParams.has('pending')).toBe(false);
  });

  it('marks unsettled returns pending without trusting provider status', () => {
    const url = new URL(returnRedirectUrl(base, { reference: 'DES-ABC-XYZ', provider: 'flutterwave', settled: false }));
    expect(url.searchParams.get('pending')).toBe('1');
    expect(url.searchParams.has('order')).toBe(false);
  });

  it('reports malformed returns without a reference', () => {
    expect(new URL(returnErrorUrl(base, 'missing-reference')).searchParams.get('pay_error')).toBe('missing-reference');
    expect(new URL(returnErrorUrl(base, 'invalid-return')).searchParams.get('pay_error')).toBe('invalid-return');
  });
});

let client: PGlite;
let db: PgliteDatabase<typeof schema>;
beforeAll(async () => {
  const { pgcrypto } = await import('@electric-sql/pglite/contrib/pgcrypto');
  const { uuid_ossp } = await import('@electric-sql/pglite/contrib/uuid_ossp');
  client = new PGlite({ extensions: { pgcrypto, uuid_ossp } });
  db = drizzle(client, { schema });
  await migrate(db as never, { migrationsFolder: './drizzle' });
}, 120000);
afterAll(async () => { await client?.close(); });

describe('return order lookup (postgres)', () => {
  it('resolves the order behind a payment reference, null when unknown', async () => {
    const [order] = await db.insert(schema.orders).values({
      orderNumber: 'DES-RETURN-1', idempotencyKey: 'return-key-1',
      shippingAddress: { fullName: 'Buyer', city: 'Lagos' },
    }).returning({ id: schema.orders.id });
    await db.insert(schema.paymentAttempts).values({
      orderId: order.id, provider: 'paystack', amountKobo: 250000, reference: 'DES-RETURN-1-REF', idempotencyKey: 'return-attempt-1',
    });
    expect(await lookupReturnOrder(db as never, 'DES-RETURN-1-REF')).toMatchObject({ orderId: order.id, orderNumber: 'DES-RETURN-1' });
    expect(await lookupReturnOrder(db as never, 'DES-NOPE-REF')).toBeNull();
  });
});
