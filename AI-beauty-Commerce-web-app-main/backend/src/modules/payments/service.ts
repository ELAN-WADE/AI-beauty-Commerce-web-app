import { and, desc, eq, sql } from 'drizzle-orm';
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
import { getOrderView, transitionOrder } from '../orders/service';
import { orders } from '../orders/schema';
import { commitReservation } from '../inventory/service';
import { reservations } from '../inventory/schema';
import { earnForOrder } from '../loyalty/service';
import { recordAttributedSale } from '../creators/service';
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
  return {
    bankName: process.env.BANK_NAME ?? '',
    accountNumber: process.env.BANK_ACCOUNT_NUMBER ?? '',
    accountName: process.env.BANK_ACCOUNT_NAME ?? '',
  };
}

// ---------- Order ownership (owner cookie OR guest email; uniform 404) ----------

async function ownedOrder(db: Db, orderId: string, owner: { userId?: string; guestEmail?: string }) {
  const rows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const o = rows[0];
  if (!o) throw Errors.notFound('Order not found.');
  const ok = owner.userId ? o.userId === owner.userId : !!owner.guestEmail && (o.guestEmail ?? '').toLowerCase() === owner.guestEmail!.toLowerCase();
  if (!ok) throw Errors.notFound('Order not found.');
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
  input: { orderId: string; provider: Provider; userId?: string; guestEmail?: string; appUrl: string; fetchFn?: FetchFn },
): Promise<InitResult> {
  const fetchFn = input.fetchFn ?? fetch;
  const order = await ownedOrder(db, input.orderId, { guestEmail: input.guestEmail, userId: input.userId });
  if (order.status !== 'PENDING' || order.paymentStatus !== 'UNPAID') {
    throw Errors.conflict('Order is no longer payable.');
  }

  // Open-attempt reuse (30 min): frontend retries converge, no duplicate provider bills.
  const open = await db
    .select()
    .from(paymentAttempts)
    .where(and(eq(paymentAttempts.orderId, order.id), eq(paymentAttempts.provider, input.provider)))
    .orderBy(desc(paymentAttempts.createdAt))
    .limit(1);
  const fresh = open[0] && Date.now() - (open[0].createdAt as Date).getTime() < 30 * 60_000 && open[0].status !== 'failed';
  if (fresh) {
    return {
      attemptId: open[0].id,
      reference: open[0].reference,
      provider: input.provider,
      authorizationUrl: open[0].authorizationUrl,
      ...(input.provider === 'transfer' ? { bankDetails: bankDetails() } : {}),
      replay: true,
    };
  }

  const reference = `${order.orderNumber}-${Date.now().toString(36).toUpperCase()}`;
  const [attempt] = await db
    .insert(paymentAttempts)
    .values({
      orderId: order.id,
      provider: input.provider,
      amountKobo: order.totalKobo,
      currency: 'NGN',
      reference,
      idempotencyKey: `init:${order.id}:${input.provider}:${reference}`,
      status: 'initiated',
      expiresAt: new Date(Date.now() + (input.provider === 'transfer' ? 48 * 3600_000 : 60 * 60_000)),
    })
    .returning({ id: paymentAttempts.id });

  if (input.provider === 'transfer') {
    await db.update(paymentAttempts).set({ status: 'authorization_open' }).where(eq(paymentAttempts.id, attempt.id));
    return { attemptId: attempt.id, reference, provider: 'transfer', authorizationUrl: null, bankDetails: bankDetails(), replay: false };
  }

  const payer = await payerEmail(db, order, input.guestEmail);
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
    await db.update(paymentAttempts).set({ status: 'failed' }).where(eq(paymentAttempts.id, attempt.id));
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

// ---------- Settle (the ONLY path to PAID for provider payments) ----------

export interface SettleResult {
  settled: boolean;
  replay: boolean;
  orderId: string | null;
  reason?: string;
}

/**
 * Verify with the provider, then transact: payment row (UNIQUE reference →
 * replays converge) → order PAID (system actor) → reservations committed.
 * Anything unverified returns { settled: false } — never throws the order paid.
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
  if (attempt.status === 'success') return { settled: true, replay: true, orderId: attempt.orderId };

  let verified = { ok: false, amountKobo: 0, currency: '', ref: '' };
  if (input.provider === 'flutterwave') {
    if (!input.transactionId) return { settled: false, replay: false, orderId: null, reason: 'missing-transaction-id' };
    const v = await flutterwaveVerify(fetchFn, { baseUrl: flwBase(), secretKey: requiredEnv('FLW_SECRET_KEY'), secretHash: '' }, input.transactionId);
    verified = { ok: v.ok && v.status === 'successful', amountKobo: v.amountKobo, currency: v.currency, ref: v.txRef };
    if (verified.ok) {
      await db.update(paymentAttempts).set({ providerRef: input.transactionId }).where(eq(paymentAttempts.id, attempt.id));
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

  // Four-way match: status + amount + currency + reference. Anything less → no value.
  if (!verified.ok || verified.currency !== 'NGN' || verified.amountKobo < attempt.amountKobo || (verified.ref && verified.ref !== attempt.reference)) {
    await db.update(paymentAttempts).set({ status: 'failed' }).where(eq(paymentAttempts.id, attempt.id));
    return { settled: false, replay: false, orderId: null, reason: 'verification-mismatch' };
  }

  return db.transaction(async (tx) => {
    const [pay] = await tx
      .insert(payments)
      .values({ orderId: attempt.orderId, provider: attempt.provider, reference: attempt.reference, amountKobo: attempt.amountKobo, currency: 'NGN' })
      .onConflictDoNothing()
      .returning({ id: payments.id });
    if (!pay) {
      await tx.update(paymentAttempts).set({ status: 'success' }).where(eq(paymentAttempts.id, attempt.id));
      return { settled: true, replay: true, orderId: attempt.orderId };
    }
    await transitionOrder(tx, attempt.orderId, 'PAID', { actor: 'system', note: `${attempt.provider} verified ${attempt.reference}` });
    const active = await tx.select({ id: reservations.id }).from(reservations).where(and(eq(reservations.refType, 'order'), eq(reservations.refId, attempt.orderId), eq(reservations.status, 'active')));
    for (const r of active) await commitReservation(tx, r.id);
    await tx.update(paymentAttempts).set({ status: 'success' }).where(eq(paymentAttempts.id, attempt.id));
    // Post-payment side effects (same tx: loyalty + notification never lost).
    const paid = await tx.select().from(orders).where(eq(orders.id, attempt.orderId)).limit(1);
    if (paid[0]?.userId) {
      await earnForOrder(tx, { userId: paid[0].userId, orderId: attempt.orderId, totalKobo: attempt.amountKobo });
    }
    if (paid[0]) {
      await recordAttributedSale(tx, paid[0].creatorCode, paid[0].totalKobo);
    }
    await enqueueNotification(tx, {
      userId: paid[0]?.userId ?? null,
      channel: 'email',
      template: 'order.paid',
      payload: { orderId: attempt.orderId, orderNumber: paid[0]?.orderNumber, provider: attempt.provider, guestEmail: paid[0]?.guestEmail },
    });
    return { settled: true, replay: false, orderId: attempt.orderId };
  });
}

// ---------- Attempt status (frontend polling) ----------

export async function attemptStatus(db: Db, reference: string, owner: { userId?: string; guestEmail?: string }) {
  const rows = await db
    .select({ attempt: paymentAttempts, order: orders })
    .from(paymentAttempts)
    .innerJoin(orders, eq(paymentAttempts.orderId, orders.id))
    .where(eq(paymentAttempts.reference, reference))
    .limit(1);
  const row = rows[0];
  if (!row) throw Errors.notFound('Payment not found.');
  const ok = owner.userId ? row.order.userId === owner.userId : (row.order.guestEmail ?? '').toLowerCase() === (owner.guestEmail ?? '').toLowerCase();
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
  input: { orderId: string; userId?: string; guestEmail?: string; senderName: string; amountKobo: number; bankName: string; narration: string; transferDate: string },
) {
  const order = await ownedOrder(db, input.orderId, { userId: input.userId, guestEmail: input.guestEmail });
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
    const active = await tx.select({ id: reservations.id }).from(reservations).where(and(eq(reservations.refType, 'order'), eq(reservations.refId, order.id), eq(reservations.status, 'active')));
    for (const r of active) await commitReservation(tx, r.id);
    if (order.userId) {
      await earnForOrder(tx, { userId: order.userId, orderId: order.id, totalKobo: order.totalKobo });
    }
    await recordAttributedSale(tx, order.creatorCode, order.totalKobo);
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
  input: { paymentId: string; amountKobo: number; reason: string; adminId: string; fetchFn?: FetchFn },
) {
  const fetchFn = input.fetchFn ?? fetch;
  const rows = await db.select({ payment: payments, order: orders }).from(payments).innerJoin(orders, eq(payments.orderId, orders.id)).where(eq(payments.id, input.paymentId)).limit(1);
  const row = rows[0];
  if (!row) throw Errors.notFound('Payment not found.');
  const done = await db.select({ amountKobo: refunds.amountKobo }).from(refunds).where(and(eq(refunds.paymentId, row.payment.id), eq(refunds.status, 'success')));
  const refunded = done.reduce((s, r) => s + r.amountKobo, 0);
  if (refunded + input.amountKobo > row.payment.amountKobo) {
    throw Errors.badRequest('Refund exceeds the paid amount.');
  }
  const [refund] = await db.insert(refunds).values({ paymentId: row.payment.id, amountKobo: input.amountKobo, reason: input.reason }).returning({ id: refunds.id });

  try {
    if (row.payment.provider === 'flutterwave') {
      const attempt = await db.select({ providerRef: paymentAttempts.providerRef }).from(paymentAttempts).where(eq(paymentAttempts.reference, row.payment.reference)).limit(1);
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
      await db.update(refunds).set({ status: 'success', providerRef: String(data?.data?.id ?? '') }).where(eq(refunds.id, refund.id));
    } else if (row.payment.provider === 'paystack') {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      try {
        const res = await fetchFn(`${process.env.PAYSTACK_BASE_URL ?? 'https://api.paystack.co'}/refund`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${requiredEnv('PAYSTACK_SECRET_KEY')}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ transaction: row.payment.reference, amount: input.amountKobo }),
          signal: ctrl.signal,
        });
        if (!res.ok) throw new ProviderError(`Paystack refund HTTP ${res.status}`, res.status >= 500);
        const data = (await res.json()) as { status?: boolean };
        if (data?.status !== true) throw new ProviderError('Paystack refused the refund', false);
      } finally {
        clearTimeout(t);
      }
      await db.update(refunds).set({ status: 'success' }).where(eq(refunds.id, refund.id));
    } else {
      // opay refund path + manual transfers: dashboard step (documented, S5 admin UI).
      await db.update(refunds).set({ status: 'pending' }).where(eq(refunds.id, refund.id));
      return { refundId: refund.id, status: 'pending' as const, note: 'Complete on the provider dashboard, then mark success.' };
    }
  } catch (err) {
    await db.update(refunds).set({ status: 'failed' }).where(eq(refunds.id, refund.id));
    if (err instanceof ProviderError) throw Errors.badRequest(`Refund failed: ${err.message}`);
    throw err;
  }

  // Full refunds flip the order (partial refunds leave fulfilment intact).
  if (refunded + input.amountKobo >= row.payment.amountKobo && ['PAID', 'FULFILLING', 'SHIPPED', 'DELIVERED'].includes(row.order.status)) {
    await transitionOrder(db, row.order.id, 'REFUNDED', { actor: 'admin', actorId: input.adminId, note: `refund ${refund.id}` });
  }
  return { refundId: refund.id, status: 'success' as const };
}
