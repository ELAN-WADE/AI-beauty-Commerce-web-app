import { and, desc, eq, sql } from 'drizzle-orm';
import type { AppDb } from '../../db/client';
import { ApiError, Errors } from '../../lib/errors';
import { orders } from '../orders/schema';
import { requireGuestOrder, transitionOrder } from '../orders/service';
import { paymentAttempts, payments } from '../payments/schema';
import { commitReservation } from '../inventory/service';
import { reservations } from '../inventory/schema';
import { audit } from '../audit/service';
import { enqueueNotification } from '../notifications/service';
import { cryptoPayments, type CryptoAsset, type CryptoNetwork } from './schema';
import { calculateCryptoQuote } from './rates';
import { createHmac, timingSafeEqual } from 'node:crypto';

export interface InitCryptoInput {
  orderId: string;
  asset: CryptoAsset;
  network: CryptoNetwork;
  idempotencyKey: string;
  userId?: string;
  guestToken?: string;
}

export interface VerifyCryptoInput {
  paymentId: string;
  txHash: string;
  actorId: string;
}

export interface CryptoStatusAuth {
  userId?: string;
  guestToken?: string;
  isAdmin?: boolean;
}

function assertPaymentsEnabled() {
  if (
    process.env.PAYMENTS_ENABLED === 'false' ||
    (process.env.NODE_ENV === 'production' && process.env.PAYMENTS_ENABLED !== 'true')
  ) {
    throw new ApiError(503, 'payments_disabled', 'Payments are not enabled yet.', false);
  }
}

export async function initCryptoPayment(db: AppDb, input: InitCryptoInput) {
  assertPaymentsEnabled();
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`crypto-init:${input.orderId}`}, 0))`);
    const [order] = await tx.select().from(orders).where(eq(orders.id, input.orderId)).for('update');
    if (!order) throw Errors.notFound('Order not found.');

    // Strict ownership verification (authenticated owner OR verified guest token)
    const ownsUser = Boolean(order.userId && input.userId && order.userId === input.userId);
    const ownsGuest = !order.userId && Boolean(await requireGuestOrder(tx as never, order.id, input.guestToken).catch(() => null));
    if (!ownsUser && !ownsGuest) {
      throw Errors.notFound('Order not found.');
    }

    if (order.status !== 'PENDING' || order.paymentStatus !== 'UNPAID') {
      throw Errors.conflict('Order is no longer payable.');
    }

    // Check existing attempt with same idempotency key and verify it belongs to THIS order
    const [exactAttempt] = await tx
      .select()
      .from(paymentAttempts)
      .where(eq(paymentAttempts.idempotencyKey, input.idempotencyKey))
      .limit(1);

    if (exactAttempt) {
      if (exactAttempt.orderId !== order.id) {
        throw Errors.conflict('Idempotency-Key was already used for a different order.');
      }
      const [existingCrypto] = await tx
        .select()
        .from(cryptoPayments)
        .where(eq(cryptoPayments.attemptId, exactAttempt.id))
        .limit(1);
      if (existingCrypto) {
        return {
          paymentId: existingCrypto.id,
          attemptId: exactAttempt.id,
          reference: exactAttempt.reference,
          orderId: order.id,
          asset: existingCrypto.asset,
          network: existingCrypto.network,
          amountNgn: existingCrypto.amountKobo / 100,
          cryptoAmount: existingCrypto.amountCrypto,
          networkFeeCrypto: existingCrypto.networkFeeCrypto,
          totalCrypto: existingCrypto.totalCrypto,
          exchangeRateNgn: existingCrypto.exchangeRateNgn,
          depositAddress: existingCrypto.depositAddress,
          status: existingCrypto.status,
          expiresAt: existingCrypto.expiresAt.toISOString(),
          replay: true,
        };
      }
    }

    const quote = await calculateCryptoQuote(order.totalKobo, input.asset, input.network);
    const reference = `CRYPTO-${order.orderNumber}-${Date.now().toString(36).toUpperCase()}`;

    const [attempt] = await tx
      .insert(paymentAttempts)
      .values({
        orderId: order.id,
        provider: 'crypto',
        amountKobo: order.totalKobo,
        currency: 'NGN',
        reference,
        idempotencyKey: input.idempotencyKey,
        status: 'authorization_open',
        expiresAt: new Date(quote.expiresAt),
      })
      .returning();

    const [cryptoRecord] = await tx
      .insert(cryptoPayments)
      .values({
        orderId: order.id,
        attemptId: attempt.id,
        asset: input.asset,
        network: input.network,
        depositAddress: quote.depositAddress,
        amountKobo: order.totalKobo,
        amountCrypto: quote.cryptoAmount,
        exchangeRateNgn: quote.exchangeRateNgn,
        networkFeeCrypto: quote.networkFeeCrypto,
        totalCrypto: quote.totalCrypto,
        status: 'PENDING',
        expiresAt: new Date(quote.expiresAt),
        metadata: {
          qrPayload: quote.qrPayload,
          orderNumber: order.orderNumber,
        },
      })
      .returning();

    return {
      paymentId: cryptoRecord.id,
      attemptId: attempt.id,
      reference,
      orderId: order.id,
      asset: quote.asset,
      network: quote.network,
      amountNgn: quote.amountNgn,
      cryptoAmount: quote.cryptoAmount,
      networkFeeCrypto: quote.networkFeeCrypto,
      totalCrypto: quote.totalCrypto,
      exchangeRateNgn: quote.exchangeRateNgn,
      depositAddress: quote.depositAddress,
      qrPayload: quote.qrPayload,
      status: cryptoRecord.status,
      expiresAt: quote.expiresAt,
      expiresInSeconds: quote.expiresInSeconds,
      replay: false,
    };
  });
}

/** Validate transaction hash format based on network type. */
export function isValidTxHash(network: CryptoNetwork, hash: string): boolean {
  const clean = hash.trim();
  if (network === 'Solana') {
    return /^[1-9A-HJ-NP-Za-km-z]{64,88}$/.test(clean);
  }
  return /^(0x)?[0-9a-fA-F]{64}$/.test(clean);
}

/**
 * Privileged settlement only (called by authenticated admin verification or
 * HMAC-verified crypto gateway webhook). Never synthesizes mock hashes and
 * never swallows stock reservation failures.
 */
export async function verifyCryptoPayment(db: AppDb, input: VerifyCryptoInput) {
  assertPaymentsEnabled();
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`crypto-verify:${input.paymentId}`}, 0))`);
    const [record] = await tx.select().from(cryptoPayments).where(eq(cryptoPayments.id, input.paymentId)).for('update');
    if (!record) throw Errors.notFound('Crypto payment not found.');

    if (record.status === 'COMPLETED') {
      return {
        paymentId: record.id,
        orderId: record.orderId,
        status: 'COMPLETED',
        txHash: record.txHash,
        alreadySettled: true,
      };
    }

    if (Date.now() > record.expiresAt.getTime()) {
      await tx.update(cryptoPayments).set({ status: 'EXPIRED', updatedAt: new Date() }).where(eq(cryptoPayments.id, record.id));
      if (record.attemptId) {
        await tx.update(paymentAttempts).set({ status: 'expired', updatedAt: new Date() }).where(eq(paymentAttempts.id, record.attemptId));
      }
      throw Errors.badRequest('This cryptocurrency payment quote has expired. Please initiate a new payment.');
    }

    const txHash = (input.txHash ?? '').trim();
    if (!txHash || !isValidTxHash(record.network, txHash)) {
      throw Errors.badRequest('A valid blockchain transaction hash is required for settlement.');
    }

    const [order] = await tx.select().from(orders).where(eq(orders.id, record.orderId)).for('update');
    if (!order) throw Errors.notFound('Associated order not found.');

    // Commit active inventory reservations — fail atomically if stock cannot be committed.
    const holds = await tx
      .select()
      .from(reservations)
      .where(and(eq(reservations.refType, 'order'), eq(reservations.refId, order.id), eq(reservations.status, 'active')));
    for (const hold of holds) {
      await commitReservation(tx as never, hold.id);
    }

    if (order.paymentStatus !== 'PAID') {
      await transitionOrder(tx as never, order.id, 'PAID', {
        actor: 'system',
        note: `Crypto payment verified on ${record.network}: ${txHash}`,
      });
    }

    const [attempt] = record.attemptId
      ? await tx.select().from(paymentAttempts).where(eq(paymentAttempts.id, record.attemptId))
      : [];
    const paymentRef = attempt?.reference || `CRYPTO-${order.orderNumber}-${Date.now().toString(36).toUpperCase()}`;

    await tx
      .insert(payments)
      .values({
        orderId: order.id,
        provider: 'crypto',
        reference: paymentRef,
        amountKobo: record.amountKobo,
        currency: 'NGN',
        paidAt: new Date(),
      })
      .onConflictDoNothing();

    if (record.attemptId) {
      await tx
        .update(paymentAttempts)
        .set({ status: 'success', providerRef: txHash, updatedAt: new Date() })
        .where(eq(paymentAttempts.id, record.attemptId));
    }

    const [updatedCrypto] = await tx
      .update(cryptoPayments)
      .set({
        status: 'COMPLETED',
        txHash,
        confirmations: Math.max(record.confirmations, 1),
        verifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(cryptoPayments.id, record.id))
      .returning();

    // Standard order.paid email template (handled by outbox worker) with idempotency key
    await enqueueNotification(tx as never, {
      userId: order.userId,
      channel: 'email',
      template: 'order.paid',
      payload: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        guestEmail: order.guestEmail ?? undefined,
      },
      idempotencyKey: `order.paid:${order.id}`,
    });

    await audit(tx as never, {
      actorId: input.actorId,
      action: 'payment.crypto.completed',
      entityType: 'order',
      entityId: order.id,
      after: {
        amountCrypto: record.totalCrypto,
        asset: record.asset,
        network: record.network,
        txHash,
      },
    });

    return {
      paymentId: updatedCrypto.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: 'COMPLETED',
      txHash,
      verifiedAt: updatedCrypto.verifiedAt?.toISOString(),
      alreadySettled: false,
    };
  });
}

export async function getCryptoPaymentStatus(db: AppDb, paymentId: string, auth: CryptoStatusAuth = {}) {
  const [record] = await db
    .select({
      id: cryptoPayments.id,
      orderId: cryptoPayments.orderId,
      orderUserId: orders.userId,
      asset: cryptoPayments.asset,
      network: cryptoPayments.network,
      depositAddress: cryptoPayments.depositAddress,
      amountNgn: sql<number>`${cryptoPayments.amountKobo} / 100`,
      cryptoAmount: cryptoPayments.amountCrypto,
      networkFeeCrypto: cryptoPayments.networkFeeCrypto,
      totalCrypto: cryptoPayments.totalCrypto,
      txHash: cryptoPayments.txHash,
      confirmations: cryptoPayments.confirmations,
      requiredConfirmations: cryptoPayments.requiredConfirmations,
      status: cryptoPayments.status,
      expiresAt: cryptoPayments.expiresAt,
      verifiedAt: cryptoPayments.verifiedAt,
      orderNumber: orders.orderNumber,
      orderStatus: orders.status,
      paymentStatus: orders.paymentStatus,
    })
    .from(cryptoPayments)
    .innerJoin(orders, eq(cryptoPayments.orderId, orders.id))
    .where(eq(cryptoPayments.id, paymentId))
    .limit(1);

  if (!record) throw Errors.notFound('Crypto payment not found.');

  if (!auth.isAdmin) {
    const ownsUser = Boolean(record.orderUserId && auth.userId && record.orderUserId === auth.userId);
    const ownsGuest = !record.orderUserId && Boolean(await requireGuestOrder(db, record.orderId, auth.guestToken).catch(() => null));
    if (!ownsUser && !ownsGuest) {
      throw Errors.notFound('Crypto payment not found.');
    }
  }

  const now = Date.now();
  const isExpired = record.status === 'PENDING' && now > record.expiresAt.getTime();
  const secondsRemaining = Math.max(0, Math.floor((record.expiresAt.getTime() - now) / 1000));
  const { orderUserId: _hidden, ...publicRecord } = record;

  return {
    ...publicRecord,
    isExpired,
    secondsRemaining,
  };
}

export async function listAdminCryptoTransactions(db: AppDb) {
  const rows = await db
    .select({
      id: cryptoPayments.id,
      orderId: cryptoPayments.orderId,
      orderNumber: orders.orderNumber,
      customerEmail: sql<string>`coalesce(${orders.guestEmail}, 'Registered User')`,
      asset: cryptoPayments.asset,
      network: cryptoPayments.network,
      amountKobo: cryptoPayments.amountKobo,
      totalCrypto: cryptoPayments.totalCrypto,
      depositAddress: cryptoPayments.depositAddress,
      txHash: cryptoPayments.txHash,
      confirmations: cryptoPayments.confirmations,
      requiredConfirmations: cryptoPayments.requiredConfirmations,
      status: cryptoPayments.status,
      createdAt: cryptoPayments.createdAt,
      verifiedAt: cryptoPayments.verifiedAt,
    })
    .from(cryptoPayments)
    .innerJoin(orders, eq(cryptoPayments.orderId, orders.id))
    .orderBy(desc(cryptoPayments.createdAt))
    .limit(100);

  return rows.map((r) => ({
    ...r,
    amountNgn: r.amountKobo / 100,
    explorerUrl: getExplorerUrl(r.network, r.txHash),
  }));
}

function getExplorerUrl(network: CryptoNetwork, txHash?: string | null): string | null {
  if (!txHash) return null;
  const hash = txHash.trim();
  switch (network) {
    case 'TRC20':
      return `https://tronscan.org/#/transaction/${hash}`;
    case 'ERC20':
      return `https://etherscan.io/tx/${hash}`;
    case 'Bitcoin':
      return `https://mempool.space/tx/${hash}`;
    case 'Solana':
      return `https://solscan.io/tx/${hash}`;
    default:
      return null;
  }
}

/** Verifies crypto webhook signature using HMAC-SHA256; ALWAYS fails closed if secret is unset. */
export function verifyCryptoWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!secret || !secret.trim() || !signatureHeader) return false;
  try {
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    const a = Buffer.from(signatureHeader.replace(/^sha256=/i, '').trim(), 'utf8');
    const b = Buffer.from(expected, 'utf8');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
