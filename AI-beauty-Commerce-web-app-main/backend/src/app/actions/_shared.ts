/**
 * Phase 4 — Server Actions shared core.
 *
 * Why actions exist (low-bandwidth checkout): the REST checkout path costs up
 * to 2N+2 HTTP roundtrips (variant resolution × N, clear, N adds, verify,
 * checkout, payment-init). These pure cores do the identical work with direct
 * service calls; the thin `'use server'` wrappers in cart.ts / checkout.ts /
 * payments.ts only resolve transport concerns (cookies, IP, rate limits).
 *
 * Error contract: cores THROW domain errors (ApiError/ZodError, exactly like
 * the REST routes). Wrappers catch them into `ActionResult` envelopes because
 * server-action throws lose their prototype over RPC — the client converts
 * `{ ok: false }` back into `ApiError`, so all existing catch blocks behave
 * identically. Webhooks stay REST (HMAC-signed provider callbacks).
 */
import { headers } from 'next/headers';
import { ZodError } from 'zod';
import type { AppDb } from '@/db/client';
import { ApiError, Errors } from '@/lib/errors';
import { optionalAuth } from '@/modules/auth/require-auth';
import { parseSessionId } from '@/lib/shopper';
import { addItem, clearCart, getCartView, mergeGuestCart, type CartOwner } from '@/modules/cart/service';
import { cartItemSchema, checkoutSchema, mergeCartSchema, type CheckoutInput } from '@/modules/cart/validation';
import { getProduct } from '@/modules/catalog/service';
import { checkout } from '@/modules/orders/service';
import { initPayment } from '@/modules/payments/service';
import { initPaymentSchema } from '@/modules/payments/validation';

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; code: string; message: string };

/** Mirror of the REST error envelope mapping (lib/errors.ts). Never throws. */
export function toActionFailure(err: unknown): { status: number; code: string; message: string } {
  if (err instanceof ApiError) {
    return { status: err.status, code: err.code, message: err.message };
  }
  if (err instanceof ZodError) {
    return { status: 422, code: 'invalid_input', message: 'Validation failed.' };
  }
  try {
    console.error(JSON.stringify({ level: 'error', scope: 'server-action', err: String(err) }));
  } catch {
    // logging must never break the action
  }
  return { status: 500, code: 'internal_error', message: 'Unable to complete the request.' };
}

export interface ActionShopper {
  userId?: string;
  sessionId?: string;
}

/**
 * Batch-3 (Part V): bound server-action latency so a hung provider socket or
 * stalled DB tx cannot pile up invocations. The underlying work is NOT
 * cancelled — but checkout/payment-init are idempotent by key, so the client
 * can safely retry with the SAME key and converge on one order/attempt.
 */
export const ACTION_TIMEOUT_MS = 25_000;

export function withTimeout<T>(work: Promise<T>, ms = ACTION_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new ApiError(504, 'upstream_timeout', 'The request timed out. Retry with the same idempotency key.', true));
    }, ms);
    // Don't hold the event loop for a race already decided.
    if (timer.unref) timer.unref();
  });
  return Promise.race([work.then((v) => (clearTimeout(timer), v)), timeout]);
}

/** Same resolution as REST `shopper()`: cookie session + explicit guest id. */
export async function resolveActionShopper(db: AppDb, sessionId?: string): Promise<ActionShopper> {
  const auth = await optionalAuth(db);
  return { userId: auth?.userId, sessionId: parseSessionId(sessionId) };
}

/** Best-effort client IP mirroring `clientIp()` (lib/errors.ts). */
export async function actionClientIp(): Promise<string> {
  try {
    const h = await headers();
    const configured = process.env.CLIENT_IP_HEADER;
    const ip = configured
      ? h.get(configured)?.trim() || 'unknown'
      : process.env.NODE_ENV === 'production'
        ? 'unknown'
        : h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    return ip.slice(0, 64);
  } catch {
    return 'unknown';
  }
}

function requireOwner(owner: ActionShopper): CartOwner {
  // Same rule as REST shopper(): malformed guest ids are anonymous, and
  // anonymous cart writes are rejected (UUID enforced, never free text).
  const sessionId = parseSessionId(owner.sessionId);
  if (!owner.userId && !sessionId) {
    throw Errors.badRequest('Guest carts require a session id.');
  }
  return { userId: owner.userId, sessionId };
}

// ---------- Cart sync core (mirrors owned-api syncCartToServer, zero HTTP) ----------

export interface SyncCartItem {
  productId: string; // storefront slug
  size: string;
  quantity: number;
}

/**
 * Replace the server cart with exactly `items` (clear + re-add + verify),
 * resolving slugs→variants via direct DB reads. Identical rules to REST:
 * exact size match else first variant, qty 1–99, no duplicate variants.
 */
export async function runSyncCart(db: AppDb, owner: CartOwner, items: SyncCartItem[]) {
  if (items.length > 100) throw Errors.badRequest('Too many cart lines.');
  const who = requireOwner(owner);
  const expected = new Map<string, number>();
  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
      throw new Error('An item in your bag cannot be checked out. Refresh the catalogue and review your bag.');
    }
    const detail = await getProduct(db, String(item.productId).toLowerCase()).catch(() => null);
    if (!detail || detail.variants.length === 0) {
      throw new Error('An item in your bag cannot be checked out. Refresh the catalogue and review your bag.');
    }
    const exact = detail.variants.find((v) => v.sizeLabel.toLowerCase() === String(item.size).toLowerCase());
    const variantId = (exact ?? detail.variants[0]).id;
    if (expected.has(variantId)) {
      throw new Error('An item in your bag cannot be checked out. Refresh the catalogue and review your bag.');
    }
    expected.set(variantId, item.quantity);
  }
  // Atomic replace: clear + re-add + verify inside one transaction so a
  // mid-sync failure (or concurrent sync) can never leave a partial bag.
  return db.transaction(async (tx) => {
    const t = tx as unknown as AppDb;
    await clearCart(t, who);
    for (const [variantId, qty] of expected) {
      const parsed = cartItemSchema.parse({ variantId, qty });
      await addItem(t, who, parsed.variantId, parsed.qty);
    }
    const cart = await resolveCartView(t, who);
    if (cart.lines.length !== expected.size || cart.lines.some((l) => expected.get(l.variantId) !== l.qty)) {
      throw new Error('Your bag changed during checkout. Please review it before paying.');
    }
    return cart;
  });
}

async function resolveCartView(db: AppDb, owner: CartOwner) {
  const { resolveCart } = await import('@/modules/cart/service');
  const cart = await resolveCart(db, owner);
  return getCartView(db, cart.id);
}

export async function runMergeCart(db: AppDb, userId: string | undefined, sessionId: string) {
  if (!userId) throw Errors.unauthorized();
  const input = mergeCartSchema.parse({ sessionId });
  return mergeGuestCart(db, userId, input.sessionId);
}

// ---------- Checkout core (mirrors POST /api/checkout) ----------

export interface CheckoutActionInput {
  sessionId?: string;
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  deliveryNotes?: string;
  voucherCode?: string;
  creatorCode?: string;
  fulfilmentLocationId?: string;
  fulfilmentMethod?: 'DELIVERY' | 'PICKUP';
  guestAccessToken?: string;
}

export async function runCheckout(
  db: AppDb,
  owner: ActionShopper,
  args: CheckoutActionInput,
  idempotencyKey: string,
  ip: string,
) {
  if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 128) {
    throw Errors.badRequest('Idempotency-Key (8–128 chars, unique per checkout) is required.');
  }
  const input: CheckoutInput = checkoutSchema.parse({
    sessionId: owner.sessionId,
    guestAddress: {
      fullName: args.fullName,
      phone: args.phone,
      street: args.street,
      city: args.city,
      state: args.state,
      country: 'NG',
    },
    guestEmail: args.email,
    ...(args.guestAccessToken ? { guestAccessToken: args.guestAccessToken } : {}),
    note: args.deliveryNotes ?? '',
    ...(args.voucherCode ? { voucherCode: args.voucherCode } : {}),
    ...(args.creatorCode ? { creatorCode: args.creatorCode } : {}),
    ...(args.fulfilmentLocationId ? { fulfilmentLocationId: args.fulfilmentLocationId } : {}),
    ...(args.fulfilmentMethod ? { fulfilmentMethod: args.fulfilmentMethod } : {}),
  });
  if (!owner.userId && !input.guestAccessToken) {
    throw Errors.badRequest('Guest access token is required.');
  }
  return withTimeout(
    checkout(db, {
      userId: owner.userId,
      sessionId: owner.sessionId ?? input.sessionId,
      input,
      idempotencyKey,
      ip,
    }),
  );
}

// ---------- Payment-init core (mirrors POST /api/payments/init) ----------

export async function runInitPayment(
  db: AppDb,
  owner: ActionShopper,
  args: { orderId: string; provider: 'flutterwave' | 'stripe' | 'opay' | 'transfer'; guestToken?: string; appUrl: string },
  idempotencyKey: string,
) {
  if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 128) {
    throw Errors.badRequest('Idempotency-Key (8–128 chars, stable across retries) is required.');
  }
  const input = initPaymentSchema.parse({ orderId: args.orderId, provider: args.provider });
  const guestToken =
    args.guestToken && /^[a-f0-9]{64}$/.test(args.guestToken) ? args.guestToken : undefined;
  if (!owner.userId && !guestToken) throw Errors.badRequest('Guest order token required.');
  return withTimeout(
    initPayment(db, {
      orderId: input.orderId,
      provider: input.provider,
      userId: owner.userId,
      guestToken,
      appUrl: args.appUrl,
      idempotencyKey,
    }),
  );
}
