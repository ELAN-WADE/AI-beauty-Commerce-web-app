import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { clientIp, Errors } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { verifyPaystackWebhook } from '@/lib/providers';
import { recordEvent, settleAttempt } from '@/modules/payments/service';

/** Paystack webhook: HMAC-SHA512(x-paystack-signature) → dedupe → verify → settle. */
export async function POST(req: Request) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  const respond = (body: unknown, status = 200) => {
    const res = NextResponse.json(body, { status });
    res.headers.set('x-request-id', requestId);
    return res;
  };

  const rl = checkRateLimit(`webhook:${clientIp(req)}`, Limits.webhook);
  if (!rl.allowed) return respond({ error: { code: 'rate_limited', message: 'Slow down.', request_id: requestId, retryable: true } }, 429);

  const rawBody = await req.text();
  if (!verifyPaystackWebhook(rawBody, req.headers.get('x-paystack-signature') ?? undefined, process.env.PAYSTACK_SECRET_KEY)) {
    return respond({ error: { code: 'bad_signature', message: 'Rejected.', request_id: requestId, retryable: false } }, 401);
  }

  let event: { event?: string; data?: { reference?: string; status?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return respond({ received: false, reason: 'bad_json' });
  }
  const reference = event?.data?.reference;
  if (!reference) return respond({ received: true, settled: false });

  const { duplicate } = await recordEvent(getDb(), {
    provider: 'paystack',
    providerEventId: `ps:${reference}:${event.event ?? 'unknown'}`,
    reference,
    eventType: event.event ?? 'unknown',
    payload: event,
  });
  if (duplicate) return respond({ received: true, settled: true, replay: true });

  if (event.event !== 'charge.success') return respond({ received: true, settled: false });

  try {
    const result = await settleAttempt(getDb(), { provider: 'paystack', reference });
    return respond({ received: true, ...result });
  } catch (err) {
    console.error(JSON.stringify({ level: 'error', requestId, scope: 'paystack-webhook-settle', err: String(err) }));
    return respond({ received: true, settled: false, reason: 'settle-error' });
  }
}
