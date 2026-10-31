import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, Errors, readJson } from '@/lib/errors';
import { verifyCryptoPayment, verifyCryptoWebhookSignature } from '@/modules/crypto/service';
import { paymentEvents } from '@/modules/payments/schema';

export const dynamic = 'force-dynamic';

export const POST = api(async ({ req }) => {
  const db = getDb();
  const rawBody = await req.text();
  const signature = req.headers.get('x-crypto-signature') || req.headers.get('x-webhook-signature');
  const secret = process.env.CRYPTO_WEBHOOK_SECRET || '';

  if (!verifyCryptoWebhookSignature(rawBody, signature, secret)) {
    throw Errors.unauthorized('Invalid webhook signature.');
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    throw Errors.badRequest('Invalid JSON payload.');
  }

  const { paymentId, txHash, eventId } = body;
  if (!paymentId) throw Errors.badRequest('Missing paymentId in webhook.');

  // Idempotently log the event
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

  return NextResponse.json({ ok: true, result });
});

