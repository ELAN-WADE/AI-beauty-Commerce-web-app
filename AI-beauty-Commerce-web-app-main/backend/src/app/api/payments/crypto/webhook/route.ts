import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { clientIp, Errors, readRawBody, toErrorResponse } from '@/lib/errors';
import { checkSharedRateLimit, Limits } from '@/lib/rate-limit';
import { verifyCryptoPayment, verifyCryptoWebhookSignature } from '@/modules/crypto/service';
import { paymentEvents } from '@/modules/payments/schema';

export const dynamic = 'force-dynamic';

/** HMAC-signed server-to-server webhook (skips browser Origin check; fails closed without secret). */
export async function POST(req: Request) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    const db = getDb();
    const rl = await checkSharedRateLimit(db, `webhook:crypto:${clientIp(req)}`, Limits.apiMutation);
    if (!rl.allowed) throw Errors.rateLimited(60);

    const rawBody = await readRawBody(req, 262_144);
    const signature = req.headers.get('x-crypto-signature') || req.headers.get('x-webhook-signature');
    const secret = process.env.CRYPTO_WEBHOOK_SECRET || '';

    if (!verifyCryptoWebhookSignature(rawBody, signature, secret)) {
      throw Errors.unauthorized('Invalid webhook signature.');
    }

    let body: { paymentId?: string; txHash?: string; eventId?: string; type?: string };
    try {
      body = JSON.parse(rawBody);
    } catch {
      throw Errors.badRequest('Invalid JSON payload.');
    }

    const { paymentId, txHash, eventId } = body;
    if (!paymentId || !txHash) {
      throw Errors.badRequest('Missing paymentId or txHash in webhook.');
    }

    if (eventId) {
      await db
        .insert(paymentEvents)
        .values({
          provider: 'crypto',
          providerEventId: String(eventId),
          reference: paymentId,
          eventType: body.type || 'payment.confirmed',
          payload: body,
        })
        .onConflictDoNothing();
    }

    const result = await verifyCryptoPayment(db, {
      paymentId,
      txHash,
      actorId: 'webhook:crypto-gateway',
    });

    const res = NextResponse.json({ ok: true, result }, { headers: { 'Cache-Control': 'no-store' } });
    res.headers.set('x-request-id', requestId);
    return res;
  } catch (err) {
    return toErrorResponse(err, requestId);
  }
}
