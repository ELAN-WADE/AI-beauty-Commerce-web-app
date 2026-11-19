import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { getLiveCryptoRates, calculateCryptoQuote } from '@/modules/crypto/rates';
import { initCryptoPayment, verifyCryptoPayment, getCryptoPaymentStatus, verifyCryptoWebhookSignature } from '@/modules/crypto/service';
import { createHmac } from 'node:crypto';

let client: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;
let testUserId: string;
let otherUserId: string;
let testOrderId: string;
const pg = () => db as never;

beforeAll(async () => {
  const { pgcrypto } = await import('@electric-sql/pglite/contrib/pgcrypto');
  const { uuid_ossp } = await import('@electric-sql/pglite/contrib/uuid_ossp');
  client = new PGlite({ extensions: { pgcrypto, uuid_ossp } });
  db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: './drizzle' });

  const [user] = await db.insert(schema.users).values({ email: 'crypto-buyer@example.test', passwordHash: 'hash' }).returning();
  const [other] = await db.insert(schema.users).values({ email: 'crypto-other@example.test', passwordHash: 'hash' }).returning();
  testUserId = user.id;
  otherUserId = other.id;

  const [order] = await db.insert(schema.orders).values({
    userId: user.id,
    orderNumber: 'DES-CRYPTO-1001',
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    subtotalKobo: 2450000,
    deliveryFeeKobo: 150000,
    discountKobo: 0,
    totalKobo: 2600000,
    shippingAddress: { fullName: 'Crypto Tester', phone: '+2348000000000', street: 'Victoria Island', city: 'Lagos', state: 'Lagos' },
    idempotencyKey: 'order-crypto-seed-key-1',
  }).returning();
  testOrderId = order.id;
}, 120000);

afterAll(async () => {
  await client?.close();
});

describe('cryptocurrency module end-to-end logic & security', () => {
  it('retrieves real or resilient market rates with valid decimal precision', async () => {
    const rates = await getLiveCryptoRates();
    expect(rates.USDT.usdPrice).toBeGreaterThan(0);
    expect(rates.BTC.usdPrice).toBeGreaterThan(1000);
    expect(rates.ETH.usdPrice).toBeGreaterThan(100);
    expect(rates.SOL.usdPrice).toBeGreaterThan(10);

    expect(rates.USDT.decimals).toBe(6);
    expect(rates.BTC.decimals).toBe(8);
    expect(rates.ETH.decimals).toBe(8);
    expect(rates.SOL.decimals).toBe(4);
  });

  it('calculates exact crypto quotes with network fees and 15-minute expiration', async () => {
    const quote = await calculateCryptoQuote(2600000, 'USDT', 'TRC20');
    expect(quote.asset).toBe('USDT');
    expect(quote.network).toBe('TRC20');
    expect(quote.amountNgn).toBe(26000);
    expect(Number(quote.cryptoAmount)).toBeGreaterThan(0);
    expect(quote.networkFeeCrypto).toBe('1.000000');
    expect(Number(quote.totalCrypto)).toBe(Number((Number(quote.cryptoAmount) + 1).toFixed(6)));
    expect(quote.depositAddress).toBeDefined();
    expect(quote.expiresInSeconds).toBe(900);
  });

  it('enforces order ownership on init and status reads (blocks IDOR)', async () => {
    await expect(
      initCryptoPayment(pg(), {
        orderId: testOrderId,
        asset: 'USDT',
        network: 'TRC20',
        idempotencyKey: 'idemp-crypto-idor-1',
        userId: otherUserId,
      }),
    ).rejects.toMatchObject({ status: 404 });

    const init = await initCryptoPayment(pg(), {
      orderId: testOrderId,
      asset: 'USDT',
      network: 'TRC20',
      idempotencyKey: 'idemp-crypto-test-1',
      userId: testUserId,
    });

    expect(init.paymentId).toBeDefined();
    expect(init.reference).toContain('CRYPTO-DES-CRYPTO-1001');
    expect(init.status).toBe('PENDING');

    // Other user cannot read status
    await expect(getCryptoPaymentStatus(pg(), init.paymentId, { userId: otherUserId })).rejects.toMatchObject({ status: 404 });
    // Owner can read status
    const status = await getCryptoPaymentStatus(pg(), init.paymentId, { userId: testUserId });
    expect(status.orderId).toBe(testOrderId);

    // Replay idempotency check
    const replay = await initCryptoPayment(pg(), {
      orderId: testOrderId,
      asset: 'USDT',
      network: 'TRC20',
      idempotencyKey: 'idemp-crypto-test-1',
      userId: testUserId,
    });
    expect(replay.paymentId).toBe(init.paymentId);
    expect(replay.replay).toBe(true);
  });

  it('rejects empty txHash, settles valid hash to PAID with standard order.paid outbox template, and replays safely', async () => {
    const init = await initCryptoPayment(pg(), {
      orderId: testOrderId,
      asset: 'USDT',
      network: 'TRC20',
      idempotencyKey: 'idemp-crypto-test-2',
      userId: testUserId,
    });

    await expect(
      verifyCryptoPayment(pg(), { paymentId: init.paymentId, txHash: '', actorId: 'admin:test' }),
    ).rejects.toMatchObject({ status: 400 });

    const validTxHash = 'a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef';
    const verify = await verifyCryptoPayment(pg(), {
      paymentId: init.paymentId,
      txHash: validTxHash,
      actorId: 'admin:test',
    });

    expect(verify.status).toBe('COMPLETED');
    expect(verify.orderId).toBe(testOrderId);
    expect(verify.txHash).toBe(validTxHash);

    const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, testOrderId));
    expect(order.paymentStatus).toBe('PAID');

    const [paymentRow] = await db.select().from(schema.payments).where(eq(schema.payments.orderId, testOrderId));
    expect(paymentRow).toBeDefined();
    expect(paymentRow.provider).toBe('crypto');

    const outboxRows = await db.select().from(schema.notificationOutbox).where(eq(schema.notificationOutbox.template, 'order.paid'));
    expect(outboxRows.some((r) => (r.payload as { orderId?: string })?.orderId === testOrderId)).toBe(true);

    const replayVerify = await verifyCryptoPayment(pg(), {
      paymentId: init.paymentId,
      txHash: validTxHash,
      actorId: 'admin:test',
    });
    expect(replayVerify.alreadySettled).toBe(true);
    expect(replayVerify.status).toBe('COMPLETED');
  });

  it('validates webhook signatures and fails closed when secret is unset', () => {
    const payload = JSON.stringify({ paymentId: 'test-id', event: 'confirmed' });
    const secret = 'super-secret-crypto-key';
    const validSig = createHmac('sha256', secret).update(payload).digest('hex');

    expect(verifyCryptoWebhookSignature(payload, validSig, secret)).toBe(true);
    expect(verifyCryptoWebhookSignature(payload, `sha256=${validSig}`, secret)).toBe(true);
    expect(verifyCryptoWebhookSignature(payload, 'wrong-sig', secret)).toBe(false);
    expect(verifyCryptoWebhookSignature(payload, null, secret)).toBe(false);
    expect(verifyCryptoWebhookSignature(payload, validSig, '')).toBe(false);
  });
});
