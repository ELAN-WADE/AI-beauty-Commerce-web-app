import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  flutterwaveInit,
  flutterwaveVerify,
  hmacSha256Hex,
  hmacSha512Hex,
  opayCashierInit,
  opaySign,
  paystackInit,
  paystackVerify,
  ProviderError,
  verifyFlutterwaveWebhook,
  verifyOpayCallback,
  verifyPaystackWebhook,
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

  it('verifies Paystack HMAC-SHA512 webhooks', () => {
    const secret = 'sk_test_x';
    const sig = createHmac('sha512', secret).update(body, 'utf8').digest('hex');
    expect(hmacSha512Hex(secret, body)).toBe(sig);
    expect(verifyPaystackWebhook(body, sig, secret)).toBe(true);
    expect(verifyPaystackWebhook(body + ' ', sig, secret)).toBe(false); // tampered body fails
    expect(verifyPaystackWebhook(body, undefined, secret)).toBe(false);
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

  it('paystack init/verify speak kobo natively', async () => {
    const cfg = { baseUrl: 'https://api.paystack.co', secretKey: 'sk' };
    const init = await paystackInit(mockFetch({ status: true, data: { authorization_url: 'https://paystack/x' } }), cfg, {
      email: 'a@b.co', amountKobo: 250000, reference: 'DES-A1', callbackUrl: 'https://x/return',
    });
    expect(init.authorizationUrl).toBe('https://paystack/x');
    const v = await paystackVerify(mockFetch({ status: true, data: { status: 'success', amount: 250000, currency: 'NGN' } }), cfg, 'DES-A1');
    expect(v).toMatchObject({ ok: true, amountKobo: 250000 });
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
