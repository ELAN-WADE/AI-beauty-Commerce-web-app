import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Provider seam (§11, §16). Every secret stays server-side; the browser only
 * ever sees hosted-checkout URLs. Amounts cross this boundary in KOBO except
 * where the provider mandates major units (Flutterwave) — converted here.
 *
 * Verified 2026-09 against developer.flutterwave.com (v3 Standard + verify +
 * webhooks) and documentation.opaycheckout.com (Cashier auth + callbacks).
 * Opay's exact Cashier-create/status PATHS are env-overridable (OPAY_*_PATH)
 * because dashboard docs vary by merchant configuration — confirm at onboarding.
 */

export type FetchFn = typeof fetch;

export class ProviderError extends Error {
  constructor(message: string, public retryable = true) {
    super(message);
  }
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function hmacSha256Hex(secret: string, body: string): string {
  return createHmac('sha256', secret).update(body, 'utf8').digest('hex');
}

export function hmacSha512Hex(secret: string, body: string): string {
  return createHmac('sha512', secret).update(body, 'utf8').digest('hex');
}

async function callApi(
  fetchFn: FetchFn,
  url: string,
  init: RequestInit,
  provider: string,
  timeoutMs = 8000,
): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetchFn(url, { ...init, signal: ctrl.signal });
  } catch (err) {
    throw new ProviderError(`${provider} unreachable (${String(err)})`, true);
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    throw new ProviderError(`${provider} HTTP ${res.status}`, res.status >= 500);
  }
  try {
    return await res.json();
  } catch {
    throw new ProviderError(`${provider} returned non-JSON`, true);
  }
}

// ---------- Flutterwave v3 Standard ----------

export interface FlwConfig {
  baseUrl: string; // https://api.flutterwave.com/v3
  secretKey: string;
  secretHash: string; // webhook secret hash (dashboard)
}

export async function flutterwaveInit(
  fetchFn: FetchFn,
  cfg: FlwConfig,
  input: { txRef: string; amountKobo: number; email: string; name: string; phone?: string; redirectUrl: string; orderNumber: string },
): Promise<{ authorizationUrl: string }> {
  const body = {
    tx_ref: input.txRef,
    amount: Number((input.amountKobo / 100).toFixed(2)), // FLW takes MAJOR units
    currency: 'NGN',
    redirect_url: input.redirectUrl,
    customer: { email: input.email, name: input.name, phonenumber: input.phone ?? '' },
    customizations: { title: 'Glowly Beauty & Skincare' },
    meta: { order_number: input.orderNumber },
  };
  const data = (await callApi(fetchFn, `${cfg.baseUrl}/payments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.secretKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, 'flutterwave')) as { status?: string; data?: { link?: string } };
  if (data?.status !== 'success' || !data?.data?.link) {
    throw new ProviderError('Flutterwave refused the payment request', false);
  }
  return { authorizationUrl: data.data.link };
}

export interface FlwVerify {
  ok: boolean;
  status: string;
  amountKobo: number;
  currency: string;
  txRef: string;
}

export async function flutterwaveVerify(
  fetchFn: FetchFn,
  cfg: FlwConfig,
  transactionId: string,
): Promise<FlwVerify> {
  const data = (await callApi(
    fetchFn,
    `${cfg.baseUrl}/transactions/${encodeURIComponent(transactionId)}/verify`,
    { headers: { Authorization: `Bearer ${cfg.secretKey}` } },
    'flutterwave',
  )) as { status?: string; data?: { status?: string; amount?: number; currency?: string; tx_ref?: string } };
  const d = data?.data ?? {};
  return {
    ok: data?.status === 'success',
    status: d.status ?? 'unknown',
    amountKobo: Math.round(Number(d.amount ?? 0) * 100),
    currency: d.currency ?? '',
    txRef: d.tx_ref ?? '',
  };
}

/**
 * Webhook auth: current docs use HMAC-SHA256 → `flutterwave-signature`;
 * older integrations use plaintext `verif-hash`. Accept either (both compared
 * in constant time); reject when no secret hash is configured at all.
 */
export function verifyFlutterwaveWebhook(
  rawBody: string,
  headers: Record<string, string | undefined>,
  secretHash: string | undefined,
): boolean {
  if (!secretHash) return false;
  const sig = headers['flutterwave-signature'];
  if (sig && safeEqual(sig, hmacSha256Hex(secretHash, rawBody))) return true;
  const legacy = headers['verif-hash'];
  if (legacy && safeEqual(legacy, secretHash)) return true;
  return false;
}

// ---------- Stripe (international cards via Checkout Sessions) ----------

export interface StripeConfig {
  secretKey: string; // sk_live_… / sk_test_…
  webhookSecret: string; // whsec_… (dashboard endpoint secret)
}

const STRIPE_API = 'https://api.stripe.com';

function stripeForm(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

async function stripeCall(
  fetchFn: FetchFn,
  path: string,
  cfg: StripeConfig,
  params: Record<string, string>,
  method = 'POST',
  idempotencyKey?: string,
): Promise<unknown> {
  return callApi(
    fetchFn,
    `${STRIPE_API}${path}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${cfg.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        // Retry safety: Stripe dedupes POSTs carrying a previously seen key,
        // so timeouts and webhook-driven retries cannot double-charge.
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      },
      ...(method === 'POST' ? { body: stripeForm(params) } : {}),
    },
    'stripe',
  );
}

export async function stripeInit(
  fetchFn: FetchFn,
  cfg: StripeConfig,
  input: {
    email: string;
    amountKobo: number; // NGN smallest unit — Stripe takes minor units natively
    reference: string; // our stable attempt reference (echoed in metadata)
    orderNumber: string;
    successUrl: string; // must contain {CHECKOUT_SESSION_ID}; Stripe fills it
    cancelUrl: string;
    idempotencyKey: string; // our attempt key: safe retry of session creation
  },
): Promise<{ sessionId: string; authorizationUrl: string }> {
  const data = (await stripeCall(fetchFn, '/v1/checkout/sessions', cfg, {
    'payment_method_types[0]': 'card',
    'line_items[0][price_data][currency]': 'ngn',
    'line_items[0][price_data][unit_amount]': String(input.amountKobo),
    'line_items[0][price_data][product_data][name]': `Desla order ${input.orderNumber}`,
    'line_items[0][quantity]': '1',
    mode: 'payment',
    customer_email: input.email,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    'metadata[reference]': input.reference,
    'metadata[order_number]': input.orderNumber,
  }, 'POST', input.idempotencyKey)) as { id?: string; url?: string };
  if (!data?.id || !data?.url) {
    throw new ProviderError('Stripe refused the payment request', false);
  }
  return { sessionId: data.id, authorizationUrl: data.url };
}

export interface StripeSession {
  paid: boolean;
  status: string;
  amountKobo: number;
  currency: string;
  reference: string;
  paymentIntent: string | null;
}

export async function stripeRetrieveSession(
  fetchFn: FetchFn,
  cfg: StripeConfig,
  sessionId: string,
): Promise<StripeSession> {
  const data = ((await stripeCall(fetchFn, `/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, cfg, {}, 'GET')) as {
    payment_status?: string;
    status?: string;
    amount_total?: number;
    currency?: string;
    metadata?: { reference?: string };
    payment_intent?: string;
  }) ?? {};
  return {
    paid: data.payment_status === 'paid',
    status: data.status ?? 'unknown',
    amountKobo: Number(data.amount_total ?? 0),
    currency: String(data.currency ?? '').toUpperCase(),
    reference: data.metadata?.reference ?? '',
    paymentIntent: data.payment_intent ?? null,
  };
}

/**
 * Docs (Stripe signature verification without the SDK):
 * `Stripe-Signature: t=1492774577,v1=<hex>` where v1 =
 * HMAC-SHA256(endpoint secret, `${t}.${rawBody}`). Timestamps older than
 * 5 minutes are rejected (replay defence); comparisons are constant-time.
 */
export function verifyStripeWebhook(
  rawBody: string,
  signatureHeader: string | undefined,
  webhookSecret: string | undefined,
  nowMs = Date.now(),
): boolean {
  if (!signatureHeader || !webhookSecret) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((p) => {
      const i = p.indexOf('=');
      return i < 0 ? [p.trim(), ''] : [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    }),
  );
  const t = Number(parts.t ?? NaN);
  const v1 = parts.v1 ?? '';
  if (!Number.isFinite(t) || !v1) return false;
  if (Math.abs(nowMs - t * 1000) > 5 * 60_000) return false;
  return safeEqual(v1, hmacSha256Hex(webhookSecret, `${t}.${rawBody}`));
}

export async function stripeRefundPaymentIntent(
  fetchFn: FetchFn,
  cfg: StripeConfig,
  input: { paymentIntent: string; amountKobo: number; idempotencyKey: string },
): Promise<{ id: string }> {
  const data = (await stripeCall(fetchFn, '/v1/refunds', cfg, {
    payment_intent: input.paymentIntent,
    amount: String(input.amountKobo),
  }, 'POST', input.idempotencyKey)) as { id?: string };
  if (!data?.id) throw new ProviderError('Stripe refused the refund', false);
  return { id: data.id };
}

// ---------- Opay Cashier (hosted page — we never touch card data) ----------

export interface OpayConfig {
  baseUrl: string; // https://liveapi.opaycheckout.com (test: testapi.…)
  merchantId: string;
  publicKey: string; // create-payment auth
  secretKey: string; // HMAC-SHA512 signing for status/refund/callbacks
  createPath: string; // CONFIRM on merchant dashboard; env-overridable
  statusPath: string; // CONFIRM on merchant dashboard; env-overridable
}

/** Docs: signature = HMAC-SHA512(payload, secret key); header carries it + MerchantId. */
export function opaySign(secretKey: string, payload: string): string {
  return hmacSha512Hex(secretKey, payload);
}

export async function opayCashierInit(
  fetchFn: FetchFn,
  cfg: OpayConfig,
  input: { reference: string; amountKobo: number; productName: string; returnUrl: string; callbackUrl: string; email?: string },
): Promise<{ authorizationUrl: string; providerRef: string }> {
  const payload = {
    reference: input.reference,
    amount: { total: input.amountKobo, currency: 'NGN' }, // docs: CENT units
    product: { name: input.productName, description: 'Glowly order' },
    country: 'NG',
    returnUrl: input.returnUrl,
    callbackUrl: input.callbackUrl,
    ...(input.email ? { userEmail: input.email } : {}),
  };
  const raw = JSON.stringify(payload);
  const data = (await callApi(fetchFn, `${cfg.baseUrl}${cfg.createPath}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.publicKey}`, MerchantId: cfg.merchantId, 'Content-Type': 'application/json' },
    body: raw,
  }, 'opay')) as { code?: string; message?: string; data?: { cashierUrl?: string; payUrl?: string; redirectUrl?: string; orderNo?: string; reference?: string; status?: string } };
  if (data?.code !== '00000' || !data?.data) {
    throw new ProviderError(`Opay refused the payment request (${data?.code ?? 'no-code'}: ${data?.message ?? 'unknown'})`, false);
  }
  const url = data.data.cashierUrl ?? data.data.payUrl ?? data.data.redirectUrl;
  if (!url) throw new ProviderError('Opay returned no checkout URL', false);
  return { authorizationUrl: url, providerRef: String(data.data.orderNo ?? data.data.reference ?? input.reference) };
}

export async function opayStatus(
  fetchFn: FetchFn,
  cfg: OpayConfig,
  query: { orderNo?: string; reference?: string },
): Promise<{ status: string; amountKobo: number }> {
  const raw = JSON.stringify(query);
  const data = (await callApi(fetchFn, `${cfg.baseUrl}${cfg.statusPath}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${opaySign(cfg.secretKey, raw)}`, MerchantId: cfg.merchantId, 'Content-Type': 'application/json' },
    body: raw,
  }, 'opay')) as { code?: string; data?: { status?: string; amount?: { total?: number } } };
  if (data?.code !== '00000' || !data?.data) {
    throw new ProviderError('Opay status check failed', true);
  }
  return { status: data.data.status ?? 'UNKNOWN', amountKobo: Number(data.data.amount?.total ?? 0) };
}

/**
 * Callback auth: HMAC-SHA512 over the raw body compared against the signature
 * header (docs: "Callback Notification Signature"). Exact header name varies
 * by dashboard configuration — the route passes every plausible header; the
 * scheme itself (not the name) is what's verified here.
 */
export function verifyOpayCallback(rawBody: string, signature: string | undefined, secretKey: string | undefined): boolean {
  if (!signature || !secretKey) return false;
  return safeEqual(signature, opaySign(secretKey, rawBody));
}
