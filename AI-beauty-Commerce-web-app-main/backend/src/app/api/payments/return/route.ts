import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { toErrorResponse } from '@/lib/errors';
import { frontendOrigin } from '@/modules/auth/email';
import { lookupReturnOrder, returnErrorUrl, returnRedirectUrl } from '@/modules/payments/return';
import { settleAttempt } from '@/modules/payments/service';

/**
 * Provider redirect landing (Flutterwave redirect_url, Paystack callback_url,
 * Opay returnUrl all point here). Settles via server-side verification, then
 * redirects to the storefront with ?pay=reference. The SPA polls
 * /api/payments/status and routes the shopper. The redirect query is NEVER
 * trusted for the outcome (only for lookup).
 *
 * Browser navigations get a 302 to FRONTEND_URL; direct API callers with
 * Accept: application/json still get JSON (staging smoke, debugging).
 */
const querySchema = z.object({
  provider: z.enum(['flutterwave', 'paystack', 'opay']),
  status: z.string().optional(),
  tx_ref: z.string().optional(),
  transaction_id: z.string().optional(),
  reference: z.string().optional(),
  trxref: z.string().optional(),
});

function frontendBase(): URL {
  return frontendOrigin();
}

export async function GET(req: Request) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  const wantsJson = (req.headers.get('accept') ?? '').includes('application/json');
  try {
    const q = querySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
    const reference = q.tx_ref ?? q.reference ?? q.trxref;
    if (!reference) {
      if (!wantsJson) return NextResponse.redirect(returnErrorUrl(frontendBase(), 'missing-reference'), 302);
      const res = NextResponse.json({ settled: false, reason: 'missing-reference' });
      res.headers.set('x-request-id', requestId);
      return res;
    }
    const db = getDb();
    let result: { settled: boolean; replay: boolean; orderId: string | null; reason?: string };
    try {
      result = await settleAttempt(db, {
        provider: q.provider,
        reference,
        transactionId: q.transaction_id,
      });
    } catch (settleErr) {
      // Transient provider/DB failure must not strand the shopper on a raw
      // error page: send browsers back to the SPA pending state (it retries
      // verification; webhooks/worker reconcile in the background).
      if (!wantsJson) {
        const found = await lookupReturnOrder(db, reference).catch(() => null);
        const res = NextResponse.redirect(
          returnRedirectUrl(frontendBase(), { reference, provider: q.provider, settled: false, orderNumber: found?.orderNumber }),
          302,
        );
        res.headers.set('x-request-id', requestId);
        return res;
      }
      throw settleErr;
    }
    const found = await lookupReturnOrder(db, reference).catch(() => null);
    if (!wantsJson) {
      const res = NextResponse.redirect(
        returnRedirectUrl(frontendBase(), { reference, provider: q.provider, settled: result.settled, orderNumber: found?.orderNumber ?? undefined }),
        302,
      );
      res.headers.set('x-request-id', requestId);
      return res;
    }
    const res = NextResponse.json({ ...result, orderNumber: found?.orderNumber ?? null });
    res.headers.set('x-request-id', requestId);
    return res;
  } catch (err) {
    if (!wantsJson && err instanceof z.ZodError) {
      return NextResponse.redirect(returnErrorUrl(frontendBase(), 'invalid-return'), 302);
    }
    return toErrorResponse(err, requestId);
  }
}
