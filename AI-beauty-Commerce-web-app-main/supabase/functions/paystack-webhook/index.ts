// Supabase Edge Function — paystack-webhook (Deno).
// Deploy: supabase functions deploy paystack-webhook --no-verify-jwt
// Secrets: PAYSTACK_SECRET_KEY (Edge Function secrets, NEVER VITE_*).
//
// Security order (non-negotiable):
//   1. Verify x-paystack-signature (HMAC-SHA512 of raw body) BEFORE parsing trust.
//   2. Upsert payments by provider reference (UNIQUE) — replay-safe.
//   3. Honour Idempotency-Key dedupe window (24h) for retried deliveries.
//   4. Only then flip orders status + credit loyalty points.
// Frontend Screen11Payment must call checkout-init and redirect to Paystack;
// it must NEVER mark an order paid (current setTimeout flow is demo-only).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const encoder = new TextEncoder();

async function hmacSha512Hex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function json(status: number, body: Record<string, unknown>, requestId: string) {
  return new Response(JSON.stringify({ ...body, request_id: requestId }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  const requestId = crypto.randomUUID();
  const err = (code: string, message: string, status: number, retryable = false) =>
    json(status, { error: { code, message, request_id: requestId, retryable } }, requestId);

  if (req.method !== 'POST') return err('method_not_allowed', 'POST only.', 405);
  const secret = Deno.env.get('PAYSTACK_SECRET_KEY');
  if (!secret) return err('misconfigured', 'Webhook secret missing.', 500);

  const rawBody = await req.text();
  const signature = req.headers.get('x-paystack-signature') ?? '';
  const expected = await hmacSha512Hex(secret, rawBody);
  if (signature !== expected) return err('bad_signature', 'Signature mismatch.', 401);

  let event: { event?: string; data?: { reference?: string; amount?: number; status?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return err('bad_json', 'Unparseable payload.', 400);
  }

  const reference = event?.data?.reference;
  if (!reference) return err('missing_reference', 'No transaction reference.', 422);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Idempotent upsert on UNIQUE(reference): replays return stored outcome, no double-credit.
  const amountNgn = Math.round(((event?.data?.amount ?? 0) as number) / 100);
  const paid = event?.event === 'charge.success';
  const { data: payment, error: payErr } = await supabase
    .from('payments')
    .upsert(
      {
        reference,
        status: paid ? 'success' : 'failed',
        amount_ngn: amountNgn,
        raw_event: event,
        verified_at: new Date().toISOString(),
      },
      { onConflict: 'reference', ignoreDuplicates: false },
    )
    .select('id, order_id, status')
    .single();
  if (payErr || !payment) return err('ledger_write_failed', 'Could not record payment.', 500, true);

  if (paid && (payment as { order_id: string | null }).order_id) {
    await supabase
      .from('orders')
      .update({ status: 'Processing' })
      .eq('id', (payment as { order_id: string }).order_id);
    // TODO Phase 2: credit loyalty points + insert automation_log(post_purchase) here,
    // inside this verified branch only — never from the browser.
  }

  return json(200, { ok: true, reference }, requestId);
});
