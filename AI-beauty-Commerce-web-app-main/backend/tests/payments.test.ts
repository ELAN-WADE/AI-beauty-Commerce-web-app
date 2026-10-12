import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  flutterwaveInit,
  flutterwaveVerify,
  hmacSha256Hex,
  opayCashierInit,
  opaySign,
  ProviderError,
  stripeInit,
  stripeRetrieveSession,
  verifyFlutterwaveWebhook,
  verifyOpayCallback,
  verifyStripeWebhook,
  type FetchFn,
} from '@/lib/providers';
import { allowedTransition } from '@/modules/orders/service';
import { confirmClaimSchema, initPaymentSchema, refundSchema, transferClaimSchema } from '@/modules/payments/validation';

const mockFetch =
  (json: unknown, ok = true): FetchFn =>
  (async () => new Response(JSON.stringify(json), { status: ok ? 200 : 500 })) as FetchFn;

// THREAT (forged webhooks mark orders paid) → CONTROL (signature-first verify,
// independent of payload) → TEST: vectors computed here with node:crypto per
// the documented schemes — our verifiers must agree, attackers must fail.
describe('webhook signature verification', () => {
  const body = JSON.stringify({ event: 'charge.completed', data: { id: 123, tx_ref: 'DES-ABC123' } });

  it('accepts current Flutterwave HMAC-SHA256 scheme', () => {
    const hash = 's3cr3t-hash';
    const sig = createHmac('sha256', hash).update(body, 'utf8').digest('hex');
    expect(hmacSha256Hex(hash, body)).toBe(sig); // our helper == documented scheme
    expect(verifyFlutterwaveWebhook(body, { 'flutterwave-signature': sig }, hash)).toBe(true);
  });

  it('accepts legacy verif-hash and rejects everything else', () => {
    const hash = 's3cr3t-hash';
    expect(verifyFlutterwaveWebhook(body, { 'verif-hash': hash }, hash)).toBe(true);
    expect(verifyFlutterwaveWebhook(body, { 'verif-hash': 'wrong' }, hash)).toBe(false);
    expect(verifyFlutterwaveWebhook(body, { 'flutterwave-signature': '00'.repeat(32) }, hash)).toBe(false);
    expect(verifyFlutterwaveWebhook(body, {}, hash)).toBe(false);
    expect(verifyFlutterwaveWebhook(body, { 'verif-hash': hash }, undefined)).toBe(false);
  });

  it('verifies Stripe webhook signatures with timestamp tolerance', () => {
    const secret = 'whsec_test';
    const t = Math.floor(Date.now() / 1000);
    const signed = `${t}.${body}`;
    const v1 = createHmac('sha256', secret).update(signed, 'utf8').digest('hex');
    const sig = `t=${t},v1=${v1}`;
    expect(verifyStripeWebhook(body, sig, secret)).toBe(true);
    expect(verifyStripeWebhook(body + ' ', sig, secret)).toBe(false); // tampered body fails
    expect(verifyStripeWebhook(body, undefined, secret)).toBe(false);
    expect(verifyStripeWebhook(body, 't=123,v1=00', secret)).toBe(false); // bad sig fails
    const stale = `t=${t - 600},v1=${createHmac('sha256', secret).update(`${t - 600}.${body}`, 'utf8').digest('hex')}`;
    expect(verifyStripeWebhook(body, stale, secret)).toBe(false); // replay window closed
  });

  it('verifies Opay HMAC-SHA512 callbacks and rejects tampering', () => {
    const secret = 'opay-secret';
    const sig = opaySign(secret, body);
    expect(verifyOpayCallback(body, sig, secret)).toBe(true);
    expect(verifyOpayCallback(body, sig.slice(0, -1) + '0', secret)).toBe(false);
    expect(verifyOpayCallback(body, sig, undefined)).toBe(false);
  });
});

// THREAT (provider lies / network fails mid-handshake) → CONTROL (typed
// provider seam, explicit refusal paths, timeouts) → TEST with mocked fetch.
describe('provider drivers (mocked HTTP)', () => {
  const flwCfg = { baseUrl: 'https://api.flutterwave.com/v3', secretKey: 'sk', secretHash: 'h' };

  it('flutterwave init returns the hosted link; refusal throws non-retryable', async () => {
    const ok = await flutterwaveInit(mockFetch({ status: 'success', data: { link: 'https://pay.flw/x' } }), flwCfg, {
      txRef: 'DES-A1', amountKobo: 250000, email: 'a@b.co', name: 'Ada', redirectUrl: 'https://x/return', orderNumber: 'DES-A1',
    });
    expect(ok.authorizationUrl).toBe('https://pay.flw/x');
    await expect(
      flutterwaveInit(mockFetch({ status: 'error' }), flwCfg, { txRef: 'DES-A1', amountKobo: 1, email: 'a@b.co', name: 'Ada', redirectUrl: 'https://x', orderNumber: 'DES-A1' }),
    ).rejects.toBeInstanceOf(ProviderError);
  });

  it('flutterwave verify converts major units to kobo', async () => {
    const v = await flutterwaveVerify(
      mockFetch({ status: 'success', data: { status: 'successful', amount: 2500, currency: 'NGN', tx_ref: 'DES-A1' } }),
      flwCfg,
      '123',
    );
    expect(v).toMatchObject({ ok: true, status: 'successful', amountKobo: 250000, currency: 'NGN', txRef: 'DES-A1' });
  });

  it('stripe checkout init posts form-encoded sessions in kobo', async () => {
    const cfg = { secretKey: 'sk_test_x', webhookSecret: 'whsec_x' };
    let seen = { url: '', contentType: '', body: '', headers: {} as Record<string, string> };
    const capture: FetchFn = (async (url: unknown, init?: unknown) => {
      const i = init as { headers?: Record<string, string>; body?: string };
      seen = { url: String(url), contentType: i.headers?.['Content-Type'] ?? '', body: i.body ?? '', headers: i.headers ?? {} };
      return new Response(JSON.stringify({ id: 'cs_test_123', url: 'https://checkout.stripe.com/x' }));
    }) as FetchFn;
    const init = await stripeInit(capture, cfg, {
      email: 'a@b.co', amountKobo: 250000, reference: 'DES-A1', orderNumber: 'DES-A1',
      successUrl: 'https://x/return?session_id={CHECKOUT_SESSION_ID}', cancelUrl: 'https://x/cancel',
      idempotencyKey: 'test-key-1',
    });
    expect(init).toMatchObject({ sessionId: 'cs_test_123', authorizationUrl: 'https://checkout.stripe.com/x' });
    expect(seen.headers['Idempotency-Key']).toBe('test-key-1');
    expect(seen.url).toBe('https://api.stripe.com/v1/checkout/sessions');
    expect(seen.contentType).toBe('application/x-www-form-urlencoded');
    // URLSearchParams normalizes either raw or percent-encoded brackets.
    const form = new URLSearchParams(seen.body);
    expect(form.get('line_items[0][price_data][unit_amount]')).toBe('250000');
    expect(form.get('line_items[0][price_data][currency]')).toBe('ngn');
    expect(form.get('mode')).toBe('payment');
    expect(form.get('metadata[reference]')).toBe('DES-A1');
  });

  it('stripe retrieve maps paid sessions and metadata reference', async () => {
    const cfg = { secretKey: 'sk_test_x', webhookSecret: 'whsec_x' };
    const paid = await stripeRetrieveSession(
      mockFetch({ payment_status: 'paid', status: 'complete', amount_total: 250000, currency: 'ngn', metadata: { reference: 'DES-A1' }, payment_intent: 'pi_x' }),
      cfg,
      'cs_test_123',
    );
    expect(paid).toMatchObject({ paid: true, amountKobo: 250000, currency: 'NGN', reference: 'DES-A1', paymentIntent: 'pi_x' });
    const unpaid = await stripeRetrieveSession(
      mockFetch({ payment_status: 'unpaid', status: 'open', amount_total: 250000, currency: 'ngn', metadata: {} }),
      cfg,
      'cs_test_123',
    );
    expect(unpaid.paid).toBe(false);
  });

  it('opay cashier init returns hosted URL in kobo; refusal throws', async () => {
    const cfg = { baseUrl: 'https://liveapi.opaycheckout.com', merchantId: 'm', publicKey: 'pk', secretKey: 'sk', createPath: '/c', statusPath: '/s' };
    const r = await opayCashierInit(
      mockFetch({ code: '00000', data: { cashierUrl: 'https://opay/x', orderNo: 'OP123' } }),
      cfg,
      { reference: 'DES-A1', amountKobo: 250000, productName: 'Glowly order', returnUrl: 'https://x/r', callbackUrl: 'https://x/c' },
    );
    expect(r).toMatchObject({ authorizationUrl: 'https://opay/x', providerRef: 'OP123' });
    await expect(
      opayCashierInit(mockFetch({ code: '02004', message: 'duplicate' }), cfg, { reference: 'DES-A1', amountKobo: 1, productName: 'p', returnUrl: 'https://x', callbackUrl: 'https://x' }),
    ).rejects.toBeInstanceOf(ProviderError);
  });
});

describe('refund machine edges + payment validation', () => {
  it('allows admin refunds from paid-or-later states, never customers', () => {
    for (const from of ['PAID', 'FULFILLING', 'SHIPPED', 'DELIVERED']) {
      expect(allowedTransition(from, 'REFUNDED', 'admin')).toBe(true);
      expect(allowedTransition(from, 'REFUNDED', 'customer')).toBe(false);
    }
    expect(allowedTransition('PENDING', 'REFUNDED', 'admin')).toBe(false);
  });

  it('rejects unknown providers and money games in payment inputs', () => {
    expect(initPaymentSchema.safeParse({ orderId: '11111111-1111-1111-1111-111111111111', provider: 'crypto' }).success).toBe(false);
    expect(transferClaimSchema.safeParse({ orderId: '11111111-1111-1111-1111-111111111111', senderName: 'Ada', amountKobo: -5 }).success).toBe(false);
    expect(refundSchema.safeParse({ paymentId: '11111111-1111-1111-1111-111111111111', amountKobo: 100, reason: '' }).success).toBe(false);
    expect(confirmClaimSchema.safeParse({ claimId: 'not-a-uuid', approve: true }).success).toBe(false);
  });
});
