import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { toErrorResponse } from '@/lib/errors';
import { settleAttempt } from '@/modules/payments/service';

/**
 * Provider redirect landing (Flutterwave redirect_url, Paystack callback_url,
 * Opay returnUrl all point here). Settles via server-side verification, then
 * returns JSON — the SPA polls /api/payments/status and routes the shopper.
 * The redirect query is NEVER trusted for the outcome (only for lookup).
 */
const querySchema = z.object({
  provider: z.enum(['flutterwave', 'paystack', 'opay']),
  status: z.string().optional(),
  tx_ref: z.string().optional(),
  transaction_id: z.string().optional(),
  reference: z.string().optional(),
  trxref: z.string().optional(),
});

export async function GET(req: Request) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    const q = querySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
    const reference = q.tx_ref ?? q.reference ?? q.trxref;
    if (!reference) {
      const res = NextResponse.json({ settled: false, reason: 'missing-reference' });
      res.headers.set('x-request-id', requestId);
      return res;
    }
    const result = await settleAttempt(getDb(), {
      provider: q.provider,
      reference,
      transactionId: q.transaction_id,
    });
    const res = NextResponse.json(result);
    res.headers.set('x-request-id', requestId);
    return res;
  } catch (err) {
    return toErrorResponse(err, requestId);
  }
}
