import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { clientIp, readRawBody } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { verifyOpayCallback } from '@/lib/providers';
import { isReferenceSettled, recordEvent, settleAttempt } from '@/modules/payments/service';

/**
 * Opay callback. Signature scheme (HMAC-SHA512 over raw body) is verified;
 * the exact header name and payload shape are confirmed against the merchant
 * dashboard at onboarding — the route accepts documented variants and the
 * settle step re-verifies with Opay regardless, so a wrong guess here fails
 * closed (401 or verification-mismatch, never a false PAID).
 */
export async function POST(req: Request) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  const respond = (body: unknown, status = 200) => {
    const res = NextResponse.json(body, { status });
    res.headers.set('x-request-id', requestId);
    return res;
  };

  const rl = checkRateLimit(`webhook:${clientIp(req)}`, Limits.webhook);
  if (!rl.allowed) return respond({ error: { code: 'rate_limited', message: 'Slow down.', request_id: requestId, retryable: true } }, 429);

  const rawBody = await readRawBody(req);
  const signature =
    req.headers.get('opay-signature') ?? req.headers.get('signature') ?? req.headers.get('x-opay-sign') ?? undefined;
  if (!verifyOpayCallback(rawBody, signature, process.env.OPAY_SECRET_KEY)) {
    return respond({ error: { code: 'bad_signature', message: 'Rejected.', request_id: requestId, retryable: false } }, 401);
  }

  let event: { status?: string; reference?: string; orderNo?: string; orderNumber?: string; data?: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return respond({ received: false, reason: 'bad_json' });
  }
  const reference = event.reference ?? (event.data?.reference as string | undefined);
  const orderNo = event.orderNo ?? event.orderNumber ?? (event.data?.orderNo as string | undefined);
  if (!reference && !orderNo) return respond({ received: true, settled: false });

  const { duplicate } = await recordEvent(getDb(), {
    provider: 'opay',
    providerEventId: `opay:${orderNo ?? reference}:${event.status ?? 'unknown'}`,
    reference,
    eventType: event.status ?? 'unknown',
    payload: event,
  });
  if (duplicate) {
    const settled = reference
      ? await isReferenceSettled(getDb(), reference).catch(() => ({ settled: false, orderId: null }))
      : { settled: false, orderId: null };
    if (settled.settled || event.status !== 'SUCCESS' || !reference) return respond({ received: true, ...settled, replay: true });
  }

  if (event.status !== 'SUCCESS' || !reference) return respond({ received: true, settled: false });

  try {
    const result = await settleAttempt(getDb(), { provider: 'opay', reference });
    return respond({ received: true, ...result });
  } catch (err) {
    console.error(JSON.stringify({ level: 'error', requestId, scope: 'opay-webhook-settle', err: String(err) }));
    return respond({ received: true, settled: false, reason: 'settle-error', retryable: true }, 500);
  }
}
