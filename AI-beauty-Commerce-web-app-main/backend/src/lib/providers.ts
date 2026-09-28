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

// ---------- Paystack ----------

export interface PaystackConfig {
  baseUrl: string; // https://api.paystack.co
  secretKey: string;
}

export async function paystackInit(
  fetchFn: FetchFn,
  cfg: PaystackConfig,
  input: { email: string; amountKobo: number; reference: string; callbackUrl: string },
): Promise<{ authorizationUrl: string }> {
  const data = (await callApi(fetchFn, `${cfg.baseUrl}/transaction/initialize`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.secretKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: input.email, amount: input.amountKobo, reference: input.reference, callback_url: input.callbackUrl }),
  }, 'paystack')) as { status?: boolean; data?: { authorization_url?: string } };
  if (data?.status !== true || !data?.data?.authorization_url) {
    throw new ProviderError('Paystack refused the payment request', false);
  }
  return { authorizationUrl: data.data.authorization_url };
}

export async function paystackVerify(
  fetchFn: FetchFn,
  cfg: PaystackConfig,
  reference: string,
): Promise<{ ok: boolean; status: string; amountKobo: number; currency: string }> {
  const data = (await callApi(
    fetchFn,
    `${cfg.baseUrl}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${cfg.secretKey}` } },
    'paystack',
  )) as { status?: boolean; data?: { status?: string; amount?: number; currency?: string } };
  const d = data?.data ?? {};
  return { ok: data?.status === true, status: d.status ?? 'unknown', amountKobo: Number(d.amount ?? 0), currency: d.currency ?? '' };
}

/** Docs: x-paystack-signature = HMAC-SHA512(raw body, secret key). */
export function verifyPaystackWebhook(rawBody: string, signature: string | undefined, secretKey: string | undefined): boolean {
  if (!signature || !secretKey) return false;
  return safeEqual(signature, hmacSha512Hex(secretKey, rawBody));
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
