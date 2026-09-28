import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { clientIp, Errors, readRawBody } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { verifyFlutterwaveWebhook } from '@/lib/providers';
import { recordEvent, settleAttempt } from '@/modules/payments/service';

/**
 * Flutterwave webhook. Order of operations is the security contract:
 * raw body → signature FIRST → parse → dedupe ledger → verify-with-provider
 * → settle. Verified-but-unsettled always returns 200 (dedupe makes retries
 * safe; a sweeper reconciles — S5 worker).
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
  const headers: Record<string, string | undefined> = {};
  req.headers.forEach((v, k) => {
    headers[k.toLowerCase()] = v;
  });
  if (!verifyFlutterwaveWebhook(rawBody, headers, process.env.FLW_SECRET_HASH)) {
    return respond({ error: { code: 'bad_signature', message: 'Rejected.', request_id: requestId, retryable: false } }, 401);
  }

  let event: { event?: string; data?: { id?: number | string; tx_ref?: string; status?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return respond({ received: false, reason: 'bad_json' });
  }
  const data = event?.data ?? {};
  const txRef = data.tx_ref;
  const txId = data.id !== undefined ? String(data.id) : undefined;
  if (!txRef || !txId) return respond({ received: true, settled: false });

  const { duplicate } = await recordEvent(getDb(), {
    provider: 'flutterwave',
    providerEventId: `flw:${txId}`,
    reference: txRef,
    eventType: event.event ?? 'unknown',
    payload: event,
  });
  if (duplicate) return respond({ received: true, settled: true, replay: true });

  try {
    const result = await settleAttempt(getDb(), { provider: 'flutterwave', reference: txRef, transactionId: txId });
    return respond({ received: true, ...result });
  } catch (err) {
    console.error(JSON.stringify({ level: 'error', requestId, scope: 'flw-webhook-settle', err: String(err) }));
    // Recorded + deduplicated: safe to ack; sweeper will reconcile (S5).
    return respond({ received: true, settled: false, reason: 'settle-error' });
  }
}
