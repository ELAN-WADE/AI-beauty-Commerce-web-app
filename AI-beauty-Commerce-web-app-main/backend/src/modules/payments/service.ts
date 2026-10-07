import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import type { AppDb, Db } from '../../db/client';
import { ApiError, Errors } from '../../lib/errors';
import {
  ProviderError,
  flutterwaveInit,
  flutterwaveVerify,
  opayCashierInit,
  opayStatus,
  paystackInit,
  paystackVerify,
  type FetchFn,
} from '../../lib/providers';
import { users } from '../auth/schema';
import { getOrderView, requireGuestOrder, transitionOrder } from '../orders/service';
import { orderItems, orders } from '../orders/schema';
import { audit } from '../audit/service';
import { commitReservation, reserveStock } from '../inventory/service';
import { reservations } from '../inventory/schema';
import { reverseCommissions } from '../ledger/service';
import { reverseContentRewards } from '../content-rewards/service';
import { enqueueNotification } from '../notifications/service';
import {
  paymentAttempts,
  paymentEvents,
  payments,
  refunds,
  transferClaims,
} from './schema';

export type Provider = 'flutterwave' | 'paystack' | 'opay' | 'transfer';

// ---------- Provider config (env; missing keys fail closed at init time) ----------

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new ApiError(500, 'provider_not_configured', `${name} is not configured.`, false);
  return v;
}

function flwBase() {
  return process.env.FLW_BASE_URL ?? 'https://api.flutterwave.com/v3';
}

function opayBase() {
  return process.env.OPAY_BASE_URL ?? 'https://liveapi.opaycheckout.com';
}

export function bankDetails() {
  if (process.env.NODE_ENV === 'production' && (!process.env.BANK_NAME || !process.env.BANK_ACCOUNT_NUMBER || !process.env.BANK_ACCOUNT_NAME)) {
    throw new ApiError(503, 'bank_transfer_unavailable', 'Bank transfer is temporarily unavailable.');
  }
  return {
    bankName: process.env.BANK_NAME ?? '',
    accountNumber: process.env.BANK_ACCOUNT_NUMBER ?? '',
    accountName: process.env.BANK_ACCOUNT_NAME ?? '',
  };
}

// ---------- Order ownership (owner cookie OR guest email; uniform 404) ----------

async function ownedOrder(db: Db, orderId: string, owner: { userId?: string; guestToken?: string }) {
  const rows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const o = rows[0];
  if (!o) throw Errors.notFound('Order not found.');
  if (o.userId !== owner.userId && (o.userId || !(await requireGuestOrder(db, orderId, owner.guestToken).catch(() => null)))) throw Errors.notFound('Order not found.');
  return o;
}

async function payerEmail(db: Db, order: typeof orders.$inferSelect, guestEmail?: string): Promise<{ email: string; name: string }> {
  if (order.userId) {
    const u = await db.select({ email: users.email }).from(users).where(eq(users.id, order.userId)).limit(1);
    return { email: u[0]?.email ?? guestEmail ?? '', name: (order.shippingAddress as { fullName?: string })?.fullName ?? 'Glowly customer' };
  }
  return { email: order.guestEmail ?? guestEmail ?? '', name: (order.shippingAddress as { fullName?: string })?.fullName ?? 'Glowly customer' };
}

// ---------- Init ----------

export interface InitResult {
  attemptId: string;
  reference: string;
  provider: Provider;
  authorizationUrl: string | null;
  bankDetails?: { bankName: string; accountNumber: string; accountName: string };
  replay: boolean;
}

export async function initPayment(
  db: AppDb,
  input: { orderId: string; provider: Provider; userId?: string; guestToken?: string; appUrl: string; idempotencyKey: string; fetchFn?: FetchFn },
): Promise<InitResult> {
  const fetchFn = input.fetchFn ?? fetch;
  const order = await ownedOrder(db, input.orderId, { guestToken: input.guestToken, userId: input.userId });
  if (order.kind === 'WHOLESALE' && !['paystack', 'flutterwave'].includes(input.provider)) throw Errors.badRequest('Wholesale orders use Paystack or Flutterwave.');

  // Serialize by order/provider so concurrent browser retries cannot create two
  // provider references before either request has published its checkout URL.
  const claimed = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`payment-init:${order.id}:${input.provider}`}, 0))`);
    const [lockedOrder] = await tx.select().from(orders).where(eq(orders.id, order.id)).for('update');
    if (!lockedOrder || lockedOrder.status !== 'PENDING' || lockedOrder.paymentStatus !== 'UNPAID') {
      throw Errors.conflict('Order is no longer payable.');
    }

    const [exact] = await tx.select().from(paymentAttempts).where(eq(paymentAttempts.idempotencyKey, input.idempotencyKey)).limit(1);
    if (exact) {
      if (exact.orderId !== order.id || exact.provider !== input.provider) {
        throw Errors.conflict('Idempotency-Key was already used for another payment request.');
      }
      if (exact.status === 'failed') {
        const reference = `${order.orderNumber}-${Date.now().toString(36).toUpperCase()}`;
        const [retried] = await tx.update(paymentAttempts).set({ reference, status: 'initiated', authorizationUrl: null, providerRef: null, expiresAt: new Date(Date.now() + 60 * 60_000), updatedAt: new Date() }).where(eq(paymentAttempts.id, exact.id)).returning();
        return { attempt: retried, created: true };
      }
      return { attempt: exact, created: false };
    }

    const open = await tx
      .select()
      .from(paymentAttempts)
      .where(and(eq(paymentAttempts.orderId, order.id), eq(paymentAttempts.provider, input.provider)))
      .orderBy(desc(paymentAttempts.createdAt))
      .limit(1);
    const fresh = open[0] && Date.now() - (open[0].createdAt as Date).getTime() < 30 * 60_000 && open[0].status !== 'failed';
    if (fresh) return { attempt: open[0], created: false };

    const reference = `${order.orderNumber}-${Date.now().toString(36).toUpperCase()}`;
    const [attempt] = await tx
      .insert(paymentAttempts)
      .values({
        orderId: order.id,
        provider: input.provider,
        amountKobo: order.totalKobo,
        currency: 'NGN',
        reference,
        idempotencyKey: input.idempotencyKey,
        status: input.provider === 'transfer' ? 'authorization_open' : 'initiated',
        expiresAt: new Date(Date.now() + (input.provider === 'transfer' ? 48 * 3600_000 : 60 * 60_000)),
      })
      .returning();
    return { attempt, created: true };
  });
  const attempt = claimed.attempt;

  if (!claimed.created) {
    if (attempt.status === 'initiated') throw Errors.conflict('Payment initialization is already in progress. Retry shortly with the same Idempotency-Key.');
    return {
      attemptId: attempt.id,
      reference: attempt.reference,
      provider: input.provider,
      authorizationUrl: attempt.authorizationUrl,
      ...(input.provider === 'transfer' ? { bankDetails: bankDetails() } : {}),
      replay: true,
    };
  }
  const reference = attempt.reference;

  if (input.provider === 'transfer') {
    await db.update(paymentAttempts).set({ status: 'authorization_open' }).where(eq(paymentAttempts.id, attempt.id));
    return { attemptId: attempt.id, reference, provider: 'transfer', authorizationUrl: null, bankDetails: bankDetails(), replay: false };
  }

  const payer = await payerEmail(db, order);
  if (!payer.email) throw Errors.badRequest('Order has no payer email.');
  const returnUrl = `${input.appUrl}/api/payments/return?provider=${input.provider}`;

  try {
    if (input.provider === 'flutterwave') {
      const r = await flutterwaveInit(fetchFn, { baseUrl: flwBase(), secretKey: requiredEnv('FLW_SECRET_KEY'), secretHash: '' }, {
        txRef: reference,
        amountKobo: order.totalKobo,
        email: payer.email,
        name: payer.name,
        redirectUrl: returnUrl,
        orderNumber: order.orderNumber,
      });
      await db.update(paymentAttempts).set({ authorizationUrl: r.authorizationUrl, status: 'authorization_open' }).where(eq(paymentAttempts.id, attempt.id));
      return { attemptId: attempt.id, reference, provider: 'flutterwave', authorizationUrl: r.authorizationUrl, replay: false };
    }
    if (input.provider === 'paystack') {
      const r = await paystackInit(fetchFn, { baseUrl: process.env.PAYSTACK_BASE_URL ?? 'https://api.paystack.co', secretKey: requiredEnv('PAYSTACK_SECRET_KEY') }, {
        email: payer.email,
        amountKobo: order.totalKobo,
        reference,
        callbackUrl: returnUrl,
      });
      await db.update(paymentAttempts).set({ authorizationUrl: r.authorizationUrl, status: 'authorization_open' }).where(eq(paymentAttempts.id, attempt.id));
      return { attemptId: attempt.id, reference, provider: 'paystack', authorizationUrl: r.authorizationUrl, replay: false };
    }
    // opay (Cashier hosted page)
    const r = await opayCashierInit(
      fetchFn,
      {
        baseUrl: opayBase(),
        merchantId: requiredEnv('OPAY_MERCHANT_ID'),
        publicKey: requiredEnv('OPAY_PUBLIC_KEY'),
        secretKey: requiredEnv('OPAY_SECRET_KEY'),
        createPath: process.env.OPAY_CREATE_PATH ?? '/api/v1/international/cashier/create',
        statusPath: process.env.OPAY_STATUS_PATH ?? '/api/v1/international/cashier/status',
      },
      {
        reference,
        amountKobo: order.totalKobo,
        productName: `Glowly order ${order.orderNumber}`,
        returnUrl,
        callbackUrl: `${input.appUrl}/api/webhooks/opay`,
        email: payer.email,
      },
    );
    await db.update(paymentAttempts).set({ authorizationUrl: r.authorizationUrl, providerRef: r.providerRef, status: 'authorization_open' }).where(eq(paymentAttempts.id, attempt.id));
    return { attemptId: attempt.id, reference, provider: 'opay', authorizationUrl: r.authorizationUrl, replay: false };
  } catch (err) {
    // A timeout is ambiguous: keep the stable reference reconcilable instead
    // of allowing a retry to create a second provider charge.
    if (err instanceof ProviderError && !err.retryable) {
      await db.update(paymentAttempts).set({ status: 'failed', updatedAt: new Date() }).where(eq(paymentAttempts.id, attempt.id));
    }
    if (err instanceof ProviderError) throw Errors.badRequest(`Payment provider error: ${err.message}`);
    throw err;
  }
}

// ---------- Webhook event ledger (replay-safe) ----------

export async function recordEvent(
  db: AppDb,
  input: { provider: string; providerEventId: string; reference?: string; eventType: string; payload: unknown },
): Promise<{ duplicate: boolean }> {
  const [row] = await db
    .insert(paymentEvents)
    .values({ ...input, payload: input.payload as Record<string, unknown> })
    .onConflictDoNothing()
    .returning({ id: paymentEvents.id });
  return { duplicate: !row };
}

/**
 * Receipt vs settlement: a duplicate webhook receipt proves the provider sent
 * twice, not that settlement succeeded. Check the payments ledger instead.
 */
export async function isReferenceSettled(db: AppDb, reference: string): Promise<{ settled: boolean; orderId: string | null }> {
  const attempt = await db.select({ orderId: paymentAttempts.orderId }).from(paymentAttempts).where(eq(paymentAttempts.reference, reference)).limit(1);
  if (!attempt[0]) return { settled: false, orderId: null };
  const pay = await db.select({ id: payments.id }).from(payments).where(eq(payments.reference, reference)).limit(1);
  const [order] = await db.select({ paymentStatus: orders.paymentStatus }).from(orders).where(eq(orders.id, attempt[0].orderId));
  if (pay.length > 0) return { settled: order?.paymentStatus === 'PAID' || order?.paymentStatus === 'REFUNDED', orderId: attempt[0].orderId };
  const byOrder = await db.select({ id: payments.id }).from(payments).where(eq(payments.orderId, attempt[0].orderId)).limit(1);
  return { settled: byOrder.length > 0 && (order?.paymentStatus === 'PAID' || order?.paymentStatus === 'REFUNDED'), orderId: attempt[0].orderId };
}

// ---------- Settle (the ONLY path to PAID for provider payments) ----------

export interface SettleResult {
  settled: boolean;
  replay: boolean;
  orderId: string | null;
  reason?: string;
}

/** Reacquire expired holds at the original location before selling any stock. */
async function commitOrderStock(tx: Db, orderId: string) {
  const [order] = await tx.select().from(orders).where(eq(orders.id, orderId));
  const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId)).orderBy(orderItems.variantId);
  const holds = await tx.select().from(reservations).where(and(eq(reservations.refType, 'order'), eq(reservations.refId, orderId))).for('update');
  for (const item of items) {
    const committed = holds.filter(r => r.variantId === item.variantId && r.status === 'committed').reduce((n, r) => n + r.qty, 0);
    const active = holds.filter(r => r.variantId === item.variantId && r.status === 'active');
    const missing = item.qty - committed - active.reduce((n, r) => n + r.qty, 0);
    if (missing > 0) {
      const newHold = await reserveStock(tx, { locationId: order.fulfilmentLocationId, variantId: item.variantId, qty: missing, refType: 'order', refId: orderId, ttlMinutes: 30 });
      await commitReservation(tx, newHold.id);
    }
    for (const hold of active) await commitReservation(tx, hold.id);
  }
}

async function finalizePaidOrder(db: AppDb, attempt: typeof paymentAttempts.$inferSelect): Promise<void> {
  await db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, attempt.orderId)).for('update');
    if (!order) throw Errors.notFound('Order not found.');
    if (order.paymentStatus === 'PAID' || order.paymentStatus === 'REFUNDED') return;
    if (order.status !== 'PENDING' || order.paymentStatus !== 'UNPAID') {
      throw Errors.conflict('Verified payment requires manual order reconciliation.');
    }

    await transitionOrder(tx, attempt.orderId, 'PAID', { actor: 'system', note: `${attempt.provider} verified ${attempt.reference}` });
    await commitOrderStock(tx, attempt.orderId);
    // Side-effects (loyalty + commissions) run via outbox worker, never in the
    // critical PAID tx: a points/ledger bug must delay perks, not block payment.
    await enqueuePostPaymentSideEffects(tx, {
      orderId: attempt.orderId,
      userId: order.userId,
      kind: order.kind,
      totalKobo: attempt.amountKobo,
    });
    await enqueueNotification(tx, {
      userId: order.userId,
      channel: 'email',
      template: 'order.paid',
      payload: { orderId: attempt.orderId, orderNumber: order.orderNumber, provider: attempt.provider, guestEmail: order.guestEmail },
    });
  });
}

/**
 * Enqueue idempotent post-payment jobs in the SAME tx as the PAID transition.
 * Worker executes them via earnForOrder (UNIQUE account/earn/order) and
 * awardOrderCommissions (UNIQUE order/wallet + balanced-journal eventKey),
 * so replays converge and failures retry with backoff instead of rolling back PAID.
 */
async function enqueuePostPaymentSideEffects(
  tx: Db,
  input: { orderId: string; userId: string | null; kind: string; totalKobo: number },
) {
  if (input.userId && input.kind !== 'WHOLESALE') {
    await enqueueNotification(tx, {
      userId: input.userId,
      channel: 'push',
      template: 'loyalty.earn',
      payload: { orderId: input.orderId, userId: input.userId, totalKobo: input.totalKobo },
    });
  }
  await enqueueNotification(tx, {
    userId: input.userId,
    channel: 'push',
    template: 'commission.award',
    payload: { orderId: input.orderId },
  });
}

/**
 * Verify with the provider, durably record the money, then finalize fulfilment
 * in a separate transaction. A stock or side-effect failure can delay the order
 * transition but can never roll back evidence that the provider charged it.
 */
export async function settleAttempt(
  db: AppDb,
  input: { provider: Exclude<Provider, 'transfer'>; reference: string; transactionId?: string; fetchFn?: FetchFn },
): Promise<SettleResult> {
  const fetchFn = input.fetchFn ?? fetch;
  const rows = await db.select().from(paymentAttempts).where(eq(paymentAttempts.reference, input.reference)).limit(1);
  const attempt = rows[0];
  if (!attempt || attempt.provider !== input.provider) {
    return { settled: false, replay: false, orderId: null, reason: 'unknown-reference' };
  }

  const [recorded] = await db.select().from(payments).where(eq(payments.reference, attempt.reference)).limit(1);
  if (!recorded) {
    let verified = { ok: false, amountKobo: 0, currency: '', ref: '' };
    if (input.provider === 'flutterwave') {
      const transactionId = input.transactionId ?? attempt.providerRef;
      if (!transactionId) {
        await db.update(paymentAttempts).set({ updatedAt: new Date() }).where(eq(paymentAttempts.id, attempt.id));
        return { settled: false, replay: false, orderId: attempt.orderId, reason: 'missing-transaction-id' };
      }
      const v = await flutterwaveVerify(fetchFn, { baseUrl: flwBase(), secretKey: requiredEnv('FLW_SECRET_KEY'), secretHash: '' }, transactionId);
      verified = { ok: v.ok && v.status === 'successful', amountKobo: v.amountKobo, currency: v.currency, ref: v.txRef };
      if (verified.ok) {
        await db.update(paymentAttempts).set({ providerRef: transactionId, updatedAt: new Date() }).where(eq(paymentAttempts.id, attempt.id));
      }
    } else if (input.provider === 'paystack') {
      const v = await paystackVerify(fetchFn, { baseUrl: process.env.PAYSTACK_BASE_URL ?? 'https://api.paystack.co', secretKey: requiredEnv('PAYSTACK_SECRET_KEY') }, attempt.reference);
      verified = { ok: v.ok && v.status === 'success', amountKobo: v.amountKobo, currency: v.currency, ref: attempt.reference };
    } else {
      const v = await opayStatus(
        fetchFn,
        {
          baseUrl: opayBase(),
          merchantId: requiredEnv('OPAY_MERCHANT_ID'),
          publicKey: requiredEnv('OPAY_PUBLIC_KEY'),
          secretKey: requiredEnv('OPAY_SECRET_KEY'),
          createPath: process.env.OPAY_CREATE_PATH ?? '/api/v1/international/cashier/create',
          statusPath: process.env.OPAY_STATUS_PATH ?? '/api/v1/international/cashier/status',
        },
        attempt.providerRef ? { orderNo: attempt.providerRef } : { reference: attempt.reference },
      );
      verified = { ok: v.status === 'SUCCESS', amountKobo: v.amountKobo, currency: 'NGN', ref: attempt.reference };
    }

    // A non-final provider status is NOT a decline: keep the stable reference
    // eligible for later webhook/worker reconciliation.
    if (!verified.ok) {
      await db.update(paymentAttempts).set({ updatedAt: new Date() }).where(eq(paymentAttempts.id, attempt.id));
      return { settled: false, replay: false, orderId: attempt.orderId, reason: 'provider-pending' };
    }
    if (verified.currency !== 'NGN' || verified.amountKobo !== attempt.amountKobo || verified.ref !== attempt.reference) {
      await db.update(paymentAttempts).set({ status: 'failed', updatedAt: new Date() }).where(eq(paymentAttempts.id, attempt.id));
      return { settled: false, replay: false, orderId: null, reason: 'verification-mismatch' };
    }
  }

  const recognition = await db.transaction(async (tx) => {
    await tx.select().from(orders).where(eq(orders.id, attempt.orderId)).for('update');
    const [existing] = await tx.select().from(payments).where(eq(payments.orderId, attempt.orderId));
    if (existing && existing.reference !== attempt.reference) return { settled: false, replay: false, orderId: attempt.orderId, reason: 'additional-payment-requires-reconciliation' };
    const [pay] = await tx
      .insert(payments)
      .values({ orderId: attempt.orderId, provider: attempt.provider, reference: attempt.reference, amountKobo: attempt.amountKobo, currency: 'NGN' })
      .onConflictDoNothing()
      .returning({ id: payments.id });
    if (!pay) {
      await tx.update(paymentAttempts).set({ status: 'success', updatedAt: new Date() }).where(eq(paymentAttempts.id, attempt.id));
      return { settled: true, replay: true, orderId: attempt.orderId };
    }
    await tx.update(paymentAttempts).set({ status: 'success', updatedAt: new Date() }).where(eq(paymentAttempts.id, attempt.id));
    return { settled: true, replay: false, orderId: attempt.orderId };
  });
  if (!recognition.settled) return recognition;

  await finalizePaidOrder(db, attempt);
  return recognition;
}

// ---------- Attempt status (frontend polling) ----------

export async function attemptStatus(db: Db, reference: string, owner: { userId?: string; guestToken?: string }) {
  const rows = await db
    .select({ attempt: paymentAttempts, order: orders })
    .from(paymentAttempts)
    .innerJoin(orders, eq(paymentAttempts.orderId, orders.id))
    .where(eq(paymentAttempts.reference, reference))
    .limit(1);
  const row = rows[0];
  if (!row) throw Errors.notFound('Payment not found.');
   const ok = (!!owner.userId && row.order.userId === owner.userId) || (!row.order.userId && !!(await requireGuestOrder(db, row.order.id, owner.guestToken).catch(() => null)));
  if (!ok) throw Errors.notFound('Payment not found.');
  const pay = await db.select({ id: payments.id }).from(payments).where(eq(payments.orderId, row.order.id)).limit(1);
  return {
    reference: row.attempt.reference,
    provider: row.attempt.provider,
    status: row.attempt.status,
    authorizationUrl: row.attempt.authorizationUrl,
    settled: pay.length > 0,
    orderId: row.order.id,
    orderNumber: row.order.orderNumber,
  };
}

// ---------- Manual transfer claims ----------

export async function submitClaim(
  db: AppDb,
  input: { orderId: string; userId?: string; guestToken?: string; senderName: string; amountKobo: number; bankName: string; narration: string; transferDate: string },
) {
  const order = await ownedOrder(db, input.orderId, { userId: input.userId, guestToken: input.guestToken });
  if (order.kind === 'WHOLESALE') throw Errors.badRequest('Wholesale orders use online payment.');
  if (order.status !== 'PENDING' || order.paymentStatus !== 'UNPAID') {
    throw Errors.conflict('Order is no longer payable.');
  }
  const [claim] = await db
    .insert(transferClaims)
    .values({ orderId: order.id, senderName: input.senderName, amountKobo: input.amountKobo, bankName: input.bankName, narration: input.narration, transferDate: input.transferDate })
    .returning();
  return claim;
}

export async function listClaims(db: AppDb, status?: string) {
  const rows = await db
    .select()
    .from(transferClaims)
    .where(status ? eq(transferClaims.status, status) : undefined)
    .orderBy(desc(transferClaims.createdAt))
    .limit(100);
  return rows;
}

export async function confirmClaim(
  db: AppDb,
  input: { claimId: string; adminId: string; approve: boolean; note: string },
) {
  return db.transaction(async (tx) => {
    const rows = await tx.select().from(transferClaims).where(eq(transferClaims.id, input.claimId)).for('update').limit(1);
    const claim = rows[0];
    if (!claim) throw Errors.notFound('Claim not found.');
    if (claim.status !== 'pending') throw Errors.conflict('Claim already reviewed.');
    if (!input.approve) {
      await tx.update(transferClaims).set({ status: 'rejected', reviewedBy: input.adminId, reviewNote: input.note, updatedAt: new Date() }).where(eq(transferClaims.id, claim.id));
      return { claimId: claim.id, status: 'rejected' as const };
    }
    const ord = await tx.select().from(orders).where(eq(orders.id, claim.orderId)).for('update').limit(1);
    const order = ord[0];
    if (!order || order.status !== 'PENDING' || order.paymentStatus !== 'UNPAID') {
      throw Errors.conflict('Order is no longer payable.');
    }
    if (claim.amountKobo !== order.totalKobo) {
      throw Errors.badRequest(`Claim amount (${claim.amountKobo}) does not match order total (${order.totalKobo}). Reject or request a new claim.`);
    }
    await tx.insert(payments).values({
      orderId: order.id,
      provider: 'transfer',
      reference: `TRF-${claim.id.slice(0, 8).toUpperCase()}`,
      amountKobo: order.totalKobo,
      currency: 'NGN',
    });
    await transitionOrder(tx, order.id, 'PAID', { actor: 'system', note: `manual-transfer confirmed by admin:${input.adminId} claim:${claim.id} ${input.note}`.slice(0, 500) });
    await commitOrderStock(tx, order.id);
    await enqueuePostPaymentSideEffects(tx, {
      orderId: order.id,
      userId: order.userId,
      kind: order.kind,
      totalKobo: order.totalKobo,
    });
    await enqueueNotification(tx, {
      userId: order.userId,
      channel: 'email',
      template: 'order.paid',
      payload: { orderId: order.id, orderNumber: order.orderNumber, provider: 'transfer', guestEmail: order.guestEmail },
    });
    await tx.update(transferClaims).set({ status: 'confirmed', reviewedBy: input.adminId, reviewNote: input.note, updatedAt: new Date() }).where(eq(transferClaims.id, claim.id));
    return { claimId: claim.id, status: 'confirmed' as const, order: await getOrderView(tx, order.id) };
  });
}

// ---------- Refunds ----------

export async function createRefund(
  db: AppDb,
  input: { paymentId: string; amountKobo: number; reason: string; adminId: string; idempotencyKey: string; fetchFn?: FetchFn },
) {
  const fetchFn = input.fetchFn ?? fetch;
  // Phase 1 (short tx): lock the payment row, re-check the cumulative cap,
  // insert the pending refund. No network I/O inside the transaction.
  const locked = await db.transaction(async (tx) => {
    // Match fulfilment's order-first lock: a refund cannot race wholesale dispatch.
    const [preview] = await tx.select().from(payments).where(eq(payments.id, input.paymentId));
    if (!preview) throw Errors.notFound('Payment not found.');
    await tx.select().from(orders).where(eq(orders.id, preview.orderId)).for('update');
    const pay = await tx.select().from(payments).where(eq(payments.id, input.paymentId)).for('update').limit(1);
    const payment = pay[0];
    if (!payment) throw Errors.notFound('Payment not found.');
    const [prior] = await tx.select().from(refunds).where(eq(refunds.idempotencyKey, input.idempotencyKey)).limit(1);
    if (prior) {
      if (prior.paymentId !== input.paymentId || prior.amountKobo !== input.amountKobo || prior.reason !== input.reason) throw Errors.conflict('Idempotency key reused with different refund details.');
      return { payment, refundId: prior.id, replay: true, status: prior.status };
    }
    const [unresolved] = await tx.select({ id: refunds.id }).from(refunds).where(and(eq(refunds.paymentId, payment.id), eq(refunds.status, 'pending'))).limit(1);
    if (unresolved) throw Errors.conflict('A refund for this payment is awaiting reconciliation.');
    const done = await tx.select({ amountKobo: refunds.amountKobo }).from(refunds).where(and(eq(refunds.paymentId, payment.id), inArray(refunds.status, ['pending', 'success'])));
    const refunded = done.reduce((s, r) => s + r.amountKobo, 0);
    if (refunded + input.amountKobo > payment.amountKobo) {
      throw Errors.badRequest('Refund exceeds the paid amount.');
    }
    const [refund] = await tx.insert(refunds).values({ paymentId: payment.id, amountKobo: input.amountKobo, reason: input.reason, idempotencyKey: input.idempotencyKey }).returning({ id: refunds.id });
    await audit(tx, { actorId: input.adminId, action: 'refund.requested', entityType: 'refund', entityId: refund.id, after: { paymentId: payment.id, amountKobo: input.amountKobo, reason: input.reason } });
    return { payment, refundId: refund.id, replay: false, status: 'pending' };
  });
  const { payment, refundId } = locked;
  if (locked.replay) return { refundId, status: locked.status, replay: true };

  try {
    if (payment.provider === 'flutterwave') {
      const attempt = await db.select({ providerRef: paymentAttempts.providerRef }).from(paymentAttempts).where(eq(paymentAttempts.reference, payment.reference)).limit(1);
      const txId = attempt[0]?.providerRef;
      if (!txId) throw new ProviderError('Missing Flutterwave transaction id', false);
      const data = (await (async () => {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 8000);
        try {
          const res = await fetchFn(`${flwBase()}/transactions/${encodeURIComponent(txId)}/refund`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${requiredEnv('FLW_SECRET_KEY')}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: Number((input.amountKobo / 100).toFixed(2)) }),
            signal: ctrl.signal,
          });
          if (!res.ok) throw new ProviderError(`Flutterwave refund HTTP ${res.status}`, res.status >= 500);
          return (await res.json()) as { status?: string; data?: { id?: number } };
        } finally {
          clearTimeout(t);
        }
      })());
      if (data?.status !== 'success') throw new ProviderError('Flutterwave refused the refund', false);
       await db.update(refunds).set({ providerRef: String(data?.data?.id ?? ''), updatedAt: new Date() }).where(eq(refunds.id, refundId));
    } else if (payment.provider === 'paystack') {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      try {
        const res = await fetchFn(`${process.env.PAYSTACK_BASE_URL ?? 'https://api.paystack.co'}/refund`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${requiredEnv('PAYSTACK_SECRET_KEY')}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ transaction: payment.reference, amount: input.amountKobo }),
          signal: ctrl.signal,
        });
        if (!res.ok) throw new ProviderError(`Paystack refund HTTP ${res.status}`, res.status >= 500);
        const data = (await res.json()) as { status?: boolean; data?: { id?: number | string } };
        if (data?.status !== true) throw new ProviderError('Paystack refused the refund', false);
        if (data?.data?.id) await db.update(refunds).set({ providerRef: String(data.data.id) }).where(eq(refunds.id, refundId));
      } finally {
        clearTimeout(t);
      }
       // Acceptance of a refund request is not proof of refunded funds.
    } else {
      // opay refund path + manual transfers: dashboard step (documented, S5 admin UI).
      await db.update(refunds).set({ status: 'pending' }).where(eq(refunds.id, refundId));
      return { refundId, status: 'pending' as const, note: 'Complete on the provider dashboard, then mark success.' };
    }
  } catch (err) {
    // A timeout or lost DB acknowledgement is ambiguous: never let a retry
    // submit another provider refund while this request is unresolved.
    if (err instanceof ProviderError && !err.retryable) {
      await db.update(refunds).set({ status: 'failed' }).where(eq(refunds.id, refundId));
    }
    if (err instanceof ProviderError) throw Errors.badRequest(`Refund failed: ${err.message}`);
    throw err;
  }
  return { refundId, status: 'pending' as const, note: 'Verify completed refund in the provider dashboard, then reconcile.' };
}

/** Finance confirmation after independent provider/bank settlement verification. */
export async function reconcileRefund(db: AppDb, input: { refundId: string; adminId: string; evidence: string; status: 'success' | 'failed' }) {
  if (input.evidence.trim().length < 20) throw Errors.badRequest('Provider/bank reconciliation evidence is required.');
  const [refund] = await db.select().from(refunds).where(eq(refunds.id, input.refundId));
  if (!refund) throw Errors.notFound('Refund not found.');
  if (refund.status !== 'pending') throw Errors.conflict('Refund has already been reconciled.');
  const [payment] = await db.select().from(payments).where(eq(payments.id, refund.paymentId));
  if (!payment) throw Errors.notFound('Payment not found.');
  if (input.status === 'failed') {
    await db.transaction(async tx => {
      await tx.select().from(orders).where(eq(orders.id, payment.orderId)).for('update');
      const [changed] = await tx.update(refunds).set({ status: 'failed', updatedAt: new Date() }).where(and(eq(refunds.id, refund.id), eq(refunds.status, 'pending'))).returning({ id: refunds.id });
      if (!changed) throw Errors.conflict('Refund has already been reconciled.');
      await audit(tx, { actorId: input.adminId, action: 'refund.reconciled.failed', entityType: 'refund', entityId: refund.id, after: { evidence: input.evidence } });
    });
  } else {
    await finalizeRefund(db, refund.id, refund.providerRef, { amountKobo: refund.amountKobo, adminId: input.adminId }, payment, input.evidence);
  }
  return { refundId: refund.id, status: input.status };
}

/**
 * Phase 2 (short tx): re-sum successes INCLUDING this refund (catches a race
 * the phase-1 check missed — money already moved, so fail loudly with audit
 * instead of silently over-refunding), then flip the order on full refunds.
 */
async function finalizeRefund(
  db: AppDb,
  refundId: string,
  providerRef: string | null,
  input: { amountKobo: number; adminId: string },
  payment: typeof payments.$inferSelect,
  evidence: string,
) {
  await db.transaction(async (tx) => {
    const [currentOrder] = await tx.select().from(orders).where(eq(orders.id, payment.orderId)).for('update');
    await tx.select().from(payments).where(eq(payments.id, payment.id)).for('update');
    const done = await tx.select({ amountKobo: refunds.amountKobo }).from(refunds).where(and(eq(refunds.paymentId, payment.id), eq(refunds.status, 'success'))).for('update');
    const total = done.reduce((s, r) => s + r.amountKobo, 0) + input.amountKobo;
    if (total > payment.amountKobo) {
      await tx.update(refunds).set({ status: 'failed' }).where(eq(refunds.id, refundId));
      await audit(tx, { actorType: 'system', action: 'refund.over_limit', entityType: 'payment', entityId: payment.id, after: { refundId, total, paid: payment.amountKobo } });
      throw Errors.badRequest('Refund would exceed the paid amount (concurrent refund detected). Reconcile at the provider.');
    }
    const [updated] = await tx.update(refunds).set({ status: 'success', ...(providerRef ? { providerRef } : {}), updatedAt: new Date() }).where(and(eq(refunds.id, refundId), eq(refunds.status, 'pending'))).returning({ id: refunds.id });
    if (!updated) throw Errors.conflict('Refund has already been reconciled.');
    await audit(tx, { actorId: input.adminId, action: 'refund.reconciled.success', entityType: 'refund', entityId: refundId, after: { evidence, amountKobo: input.amountKobo } });
    await reverseCommissions(tx, payment.orderId, total);
    await reverseContentRewards(tx, payment.orderId, input.amountKobo);
    if (currentOrder && total >= payment.amountKobo && ['PAID', 'FULFILLING', 'READY_PICKUP', 'SHIPPED', 'DELIVERED'].includes(currentOrder.status)) {
      await transitionOrder(tx, currentOrder.id, 'REFUNDED', { actor: 'admin', actorId: input.adminId, note: `refund ${refundId}` });
    }
  });
}
