'use server';

/**
 * Phase 4 — payment-init Server Action.
 * One RPC instead of POST /api/payments/init: same validation, same ownership
 * checks, same idempotent `initPayment()` service. Provider webhooks stay
 * REST (HMAC signatures require raw HTTP). Status polling stays REST (reads).
 */
import { headers } from 'next/headers';
import { getDb } from '@/db/client';
import { checkSharedRateLimit, Limits } from '@/lib/rate-limit';
import {
  actionClientIp,
  resolveActionShopper,
  runInitPayment,
  toActionFailure,
  type ActionResult,
} from './_shared';

export type PayProviderAction = 'flutterwave' | 'stripe' | 'opay' | 'transfer';

async function appBaseUrl(): Promise<string> {
  const configured = (process.env.APP_URL ?? '').replace(/\/+$/, '');
  if (configured) return configured;
  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') ?? h.get('host') ?? '';
    const proto = h.get('x-forwarded-proto') ?? 'https';
    return host ? `${proto}://${host}` : '';
  } catch {
    return '';
  }
}

export async function initPaymentAction(args: {
  orderId: string;
  provider: PayProviderAction;
  guestToken?: string;
  idempotencyKey: string;
}): Promise<ActionResult<Awaited<ReturnType<typeof runInitPayment>>>> {
  try {
    const db = getDb();
    const ip = await actionClientIp();
    const owner = await resolveActionShopper(db, undefined);
    // Shared namespace with POST /api/payments/init.
    const rl = await checkSharedRateLimit(db, `pay-init:${owner.userId ?? ip}`, Limits.checkoutInit);
    if (!rl.allowed) return { ok: false, status: 429, code: 'rate_limited', message: 'Too many payment attempts. Wait a minute and try again.' };
    return {
      ok: true,
      data: await runInitPayment(
        db,
        owner,
        { orderId: args.orderId, provider: args.provider, guestToken: args.guestToken, appUrl: await appBaseUrl() },
        args.idempotencyKey,
      ),
    };
  } catch (err) {
    const f = toActionFailure(err);
    return { ok: false, ...f };
  }
}
