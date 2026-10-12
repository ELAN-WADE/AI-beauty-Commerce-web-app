import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { clientIp, readRawBody } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { verifyStripeWebhook } from '@/lib/providers';
import { isReferenceSettled, recordEvent, settleAttempt } from '@/modules/payments/service';

/**
 * Stripe webhook: `Stripe-Signature` (t,v1 over `${t}.${rawBody}`) → dedupe →
 * verify → settle. Only `checkout.session.completed` settles; everything else
 * is acknowledged without effect. Our attempt reference rides in
 * `data.object.metadata.reference` (set at Checkout Session creation).
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
  if (!verifyStripeWebhook(rawBody, req.headers.get('stripe-signature') ?? undefined, process.env.STRIPE_WEBHOOK_SECRET)) {
    return respond({ error: { code: 'bad_signature', message: 'Rejected.', request_id: requestId, retryable: false } }, 401);
  }

  let event: { id?: string; type?: string; data?: { object?: { id?: string; metadata?: { reference?: string } } } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return respond({ received: false, reason: 'bad_json' });
  }
  const reference = event?.data?.object?.metadata?.reference;
  if (!reference) return respond({ received: true, settled: false });

  const { duplicate } = await recordEvent(getDb(), {
    provider: 'stripe',
    providerEventId: `st:${event.id ?? `${reference}:${event.type ?? 'unknown'}`}`,
    reference,
    eventType: event.type ?? 'unknown',
    payload: event,
  });
  if (duplicate) {
    const settled = await isReferenceSettled(getDb(), reference).catch(() => ({ settled: false, orderId: null }));
    if (settled.settled || event.type !== 'checkout.session.completed') return respond({ received: true, ...settled, replay: true });
    // Receipt dedupe must not suppress a settlement retry after a DB failure.
  }

  if (event.type !== 'checkout.session.completed') return respond({ received: true, settled: false });

  try {
    // Pass the authenticated session id so verification does not depend on a
    // previously stored providerRef (covers lost init acknowledgments).
    const result = await settleAttempt(getDb(), { provider: 'stripe', reference, transactionId: event?.data?.object?.id });
    return respond({ received: true, ...result });
  } catch (err) {
    console.error(JSON.stringify({ level: 'error', requestId, scope: 'stripe-webhook-settle', err: String(err) }));
    // Transient failure: ask Stripe to retry (dedupe makes retries safe).
    return respond({ received: true, settled: false, reason: 'settle-error', retryable: true }, 500);
  }
}
