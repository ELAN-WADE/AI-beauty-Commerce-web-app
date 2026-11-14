// Owned-backend client (Glowly S2+). Strangler pattern: when NEXT_PUBLIC_API_URL is
// set, the storefront talks to the owned Next.js API; otherwise it keeps
// running on local mocks. Reads never throw (null = use fallback); writes
// throw ApiError so callers can show messages.
import type { CartItem, Order, Product, Category, AdminOrder, AdminTransferClaim, AdminAuditLog, AdminInventoryItem } from '../types';

import { getEnv } from './env';
import { subscribeStorefrontSync } from './storefront-sync';
import { readAuthIntent, requestAuthScope } from './auth-flow';
import { isPartnerDesignPreview } from './partner-preview';
import { communityPostFromApi, type CommunityPostDto } from './community-data';
import { authSessionRevision, noteAuthResponse, shouldExpireAuthSession } from './auth-session';
const BASE = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

export const isOwnedApiConfigured = true;
if (process.env.NODE_ENV === 'production' && !BASE && (getEnv('VITE_STRICT_API') === 'true' || getEnv('VITE_STRICT_API') === '1')) {
  throw new Error('Production storefront requires NEXT_PUBLIC_API_URL.');
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}, sessionId?: string): Promise<T> {
  if (isPartnerDesignPreview()) throw new ApiError(403, 'design_preview', 'Design preview only. Exit preview and sign in to perform live actions.');
  if (!BASE) throw new ApiError(503, 'api_not_configured', 'Configure NEXT_PUBLIC_API_URL to connect the live backend.');
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
  const headers: Record<string, string> = { ...(isFormData ? {} : { 'Content-Type': 'application/json' }), ...(init.headers as Record<string, string> | undefined) };
  if (sessionId) headers['X-Session-Id'] = sessionId;
  headers['X-Desla-Auth-Context'] = requestAuthScope(path);
  let res: Response;
  const startedAt = authSessionRevision();
  try { res = await fetch(`${BASE}${path}`, { cache: 'no-store', ...init, headers, credentials: 'include', signal: init.signal ?? AbortSignal.timeout(process.env.NODE_ENV === 'development' ? 120000 : 25000) }); }
  catch { throw new ApiError(0, 'network_error', 'Cannot reach the service. Check your connection and try again.'); }
  const body = (await res.json().catch(() => null)) as { error?: { code?: string; message?: string } } | T;
  if (!res.ok) {
    const err = (body as { error?: { code?: string; message?: string } })?.error;
    if (typeof window !== 'undefined' && requestAuthScope(path) === requestAuthScope('/api/auth/me') && shouldExpireAuthSession(path, res.status, err?.code, startedAt)) window.dispatchEvent(new Event('desla:session-expired'));
    throw new ApiError(res.status, err?.code ?? 'request_failed', err?.message ?? `Request failed (${res.status}).`);
  }
  if (!body) throw new ApiError(502, 'invalid_response', 'The service returned an invalid response. Please try again.');
  noteAuthResponse(path, init.method || 'GET', true);
  return body as T;
}

/** Guest session id (localStorage). Server carts key off this until login. */
const SESSION_KEY = 'glowly-session-id';
const GUEST_ORDER_TOKENS = 'glowly-guest-order-tokens';
export function newGuestOrderToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}
export function rememberGuestOrderToken(id: string, number: string, token: string): void {
  const tokens = JSON.parse(localStorage.getItem(GUEST_ORDER_TOKENS) ?? '{}') as Record<string, string>;
  localStorage.setItem(GUEST_ORDER_TOKENS, JSON.stringify({ ...tokens, [id]: token, [number]: token }));
}
export function guestOrderToken(id: string): string | null {
  try {
    return (JSON.parse(localStorage.getItem(GUEST_ORDER_TOKENS) ?? '{}') as Record<string, string>)[id] ?? null;
  } catch { return null; }
}


/**
 * Live storefront synchronization via Server-Sent Events (SSE).
 * When an administrator creates, modifies, or toggles inventory/products,
 * the backend broadcasts an invalidation signal. This function listens and triggers
 * an automatic refresh callback so open storefront browser tabs stay synchronized
 * without requiring a manual page refresh.
 */
export function subscribeStorefrontSyncApi(onSync: (slug?: string | null) => void): () => void {
  return subscribeStorefrontSync(`${BASE}/api/storefront/sync`, onSync);
}

export async function resendVerificationEmail(email: string): Promise<{ ok: boolean }> {
  return apiFetch('/api/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) });
}
function guestHeaders(id: string, token?: string): Record<string, string> {
  const value = token ?? guestOrderToken(id);
  return value ? { 'X-Guest-Order-Token': value } : {};
}
export function guestSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `gs-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `gs-${Date.now()}`;
  }
}

export function newIdempotencyKey(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `ik-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

interface OwnedVariant {
  id: string;
  sku: string;
  sizeLabel: string;
  priceKobo: number;
  priceNgn: number;
  compareAtKobo: number | null;
  available: number;
}

interface OwnedProduct {
  presentation?: Partial<Product>;
  slug: string;
  name: string;
  brand: { name: string; slug: string };
  category: { name: string; slug: string };
  tagline: string;
  description: string;
  subCategory: string;
  hashtag: string | null;
  rating: number;
  reviewsCount: number;
  isBestseller: boolean;
  isNew: boolean;
  isFlashSale: boolean;
  minPriceKobo: number;
  minPriceNgn: number;
  totalAvailable: number;
  images: { url: string; alt: string }[];
  variants: OwnedVariant[];
}

export function mapOwned(o: OwnedProduct): Product {
  const gallery = o.images.map((i) => i.url);
  return {
    id: o.slug,
    sku: o.variants[0]?.sku,
    name: o.name,
    brand: o.brand.name,
    tagline: o.tagline,
    rating: o.rating,
    reviewsCount: o.reviewsCount,
    price: o.minPriceNgn,
    originalPrice: o.variants.find(variant => variant.priceKobo === o.minPriceKobo && variant.compareAtKobo && variant.compareAtKobo > variant.priceKobo)?.compareAtKobo! / 100 || undefined,
    discountPercentage: undefined,
    image: gallery[0] ?? '',
    galleryImages: gallery,
    category: o.category.slug,
    subCategory: o.subCategory,
    variants: o.variants.map(variant => ({ id: variant.id, sku: variant.sku, sizeLabel: variant.sizeLabel, priceNgn: variant.priceNgn, compareAtNgn: variant.compareAtKobo == null ? null : variant.compareAtKobo / 100, stock: variant.available, isActive: true })),
    sizes: o.variants.map((v) => v.sizeLabel),
    selectedSize: o.variants[0]?.sizeLabel,
    inStock: o.totalAvailable > 0,
    stockCount: o.totalAvailable,
    isBestseller: o.isBestseller,
    isNew: o.isNew,
    isFlashSale: o.isFlashSale,
    hashtag: o.hashtag ?? undefined,
    distributorStock: [],
    description: o.description,
    whatItDoes: [],
    keyIngredients: [],
    howToUse: { routine: '', step: '', instructions: '', precautions: '' },
    whoItsFor: { skinTypes: [], concerns: [] },
    brandInfo: { origin: '', crueltyFree: false, guarantee: '' },
    ...o.presentation,
  };
}

export async function fetchCatalogFromOwnedApi(limit = 100, fresh = false): Promise<Product[] | null> {
  if (isPartnerDesignPreview()) return null;
  if (!BASE) return null;
  try {
    const items: Product[] = [];
    let cursor: string | null = null;
    const revision = fresh ? String(Date.now()) : null;
    // Keyset pages until full (bounded: catalogue-scale loop, max 5 pages here).
    for (let page = 0; page < 5; page++) {
      const url = new URL(`${BASE}/api/products`);
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('sort', 'newest');
      if (revision) url.searchParams.set('_refresh', revision);
      if (cursor) url.searchParams.set('cursor', cursor);
      const res = await fetch(url.toString(), { cache: fresh ? 'no-store' : 'default' });
      if (!res.ok) return null;
      const body = (await res.json()) as { items: OwnedProduct[]; nextCursor: string | null };
      if (!Array.isArray(body.items)) return null;
      items.push(...body.items.map(mapOwned));
      cursor = body.nextCursor;
      if (!cursor) break;
    }
    return items;
  } catch {
    return null;
  }
}


export async function fetchCategoriesApi(): Promise<Category[] | null> {
  if (isPartnerDesignPreview()) return null;
  if (!BASE) return null;
  try {
    const res = await apiFetch<{ categories: Array<{ id: string; name: string; slug: string; description?: string; imageUrl?: string; isActive?: boolean }> }>('/api/categories');
    if (!res || !Array.isArray(res.categories)) return null;
    return res.categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description || 'Natural formulation crafted for skin resilience.',
      image: c.imageUrl || (c.slug === 'skincare' ? '/product_barrier_cream.jpg' : c.slug === 'body-care' ? '/carousel/photo_6_butter.jpg' : c.slug === 'fragrance' ? '/carousel/photo_3_apothecary.jpg' : c.slug === 'makeup' ? '/carousel/photo_7_application.jpg' : '/product_cleanser.jpg'),
      itemCount: 0,
      featured: true,
      subcategories: [],
    }));
  } catch {
    return null;
  }
}

// ---------- Auth (cookie session; no tokens in JS) ----------

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  roles: string[];
  sessionScope?: 'CUSTOMER' | 'ADMIN';
  permissions?: string[];
  signupIntent?: string;
  adminEntryPath?: string | null;
  mfaEnabled?: boolean;
  mfaVerified?: boolean;
  profile: { displayName: string; phone?: string; avatarUrl?: string } | null;
}

export async function apiRegister(email: string, password: string): Promise<{ ok: boolean; email: string }> {
  return apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, intent: readAuthIntent().intent }) });
}

export async function apiLogin(email: string, password: string): Promise<{ ok: boolean }> {
  return apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export async function apiLogout(): Promise<{ ok: boolean }> {
  return apiFetch('/api/auth/logout', { method: 'POST' });
}

export async function apiMe(): Promise<AuthUser | null> {
  try {
    return await apiFetch<AuthUser>('/api/auth/me');
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return null;
    throw e;
  }
}

export async function apiRequestPasswordReset(email: string): Promise<{ ok: boolean }> {
  return apiFetch('/api/auth/request-password-reset', { method: 'POST', body: JSON.stringify({ email }) });
}

export async function apiResetPassword(token: string, newPassword: string): Promise<{ ok: boolean }> {
  return apiFetch('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) });
}

export async function apiVerifyEmail(token: string): Promise<{ ok: boolean }> {
  return apiFetch('/api/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) });
}

export async function updateAccountProfile(input: { displayName?: string; phone?: string }): Promise<void> {
  await apiFetch('/api/me/profile', { method: 'PATCH', body: JSON.stringify(input) });
}

// ---------- Catalogue detail (variant resolution for cart sync) ----------

interface OwnedDetail extends OwnedProduct {
  attributes: { name: string; value: string }[];
  ingredients: { name: string; description: string; detail: string }[];
}

export const DETAIL_TTL_MS = 60_000;

interface CachedDetailEntry {
  data: OwnedDetail;
  expiresAt: number;
}

const detailCache = new Map<string, CachedDetailEntry>();
const inflightDetail = new Map<string, Promise<OwnedDetail | null>>();
let detailGeneration = 0;
export function invalidateProductDetails() {
  detailGeneration++; detailCache.clear(); inflightDetail.clear();
}

export async function fetchProductDetail(slug: string): Promise<OwnedDetail | null> {
  const key = slug.toLowerCase();
  const hit = detailCache.get(key);
  if (hit && Date.now() < hit.expiresAt) {
    return hit.data;
  }

  const inflight = inflightDetail.get(key);
  if (inflight) return inflight;

  const generation = detailGeneration;
  const req: Promise<OwnedDetail | null> = (async () => {
    try {
      const detail = await apiFetch<OwnedDetail>(`/api/products/${encodeURIComponent(key)}`);
      if (generation === detailGeneration) detailCache.set(key, { data: detail, expiresAt: Date.now() + DETAIL_TTL_MS });
      return detail;
    } catch {
      return null;
    }
  })();

  inflightDetail.set(key, req);
  req.finally(() => {
      if (generation === detailGeneration) inflightDetail.delete(key);
  });
  return req;
}

export async function resolveVariantId(productId: string, size: string): Promise<string | null> {
  const detail = await fetchProductDetail(productId);
  if (!detail || detail.variants.length === 0) return null;
  const exact = detail.variants.find((v) => v.sizeLabel.toLowerCase() === size.toLowerCase());
  return (exact ?? detail.variants[0]).id;
}

// ---------- Server cart ----------

export interface ServerCartLine {
  id: string;
  variantId: string;
  sku: string;
  sizeLabel: string;
  productSlug: string;
  productName: string;
  unitPriceKobo: number;
  qty: number;
  available: number;
}

export async function syncCartToServer(items: { productId: string; size: string; quantity: number }[], expectedUserId?: string): Promise<{ ownerId: string; lines: ServerCartLine[] }> {
  return apiFetch('/api/cart/sync', { method: 'POST', body: JSON.stringify({ items, expectedUserId }) });
}

/** Fold the guest cart into the user cart after login (best-effort). */
export async function mergeServerCart(): Promise<void> {
  if (!BASE) return;
  await apiFetch('/api/cart/merge', { method: 'POST', body: JSON.stringify({ sessionId: guestSessionId() }) }).catch(() => null);
}

// ---------- Checkout + payments ----------

export interface CheckoutAddressInput {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  deliveryNotes?: string;
}

export interface ServerOrderView {
  shipment?: { provider: string; trackingReference: string; status: string };
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotalKobo: number;
  deliveryFeeKobo: number;
  totalKobo: number;
  fulfilmentMethod?: string;
  createdAt?: string;
  shippingAddress?: { fullName?: string; name?: string; street?: string; city?: string; state?: string; phone?: string };
  history?: { toStatus: string; createdAt: string }[];
  items: { variantId: string; productName: string; variantLabel: string; sku: string; unitPriceKobo: number; qty: number; lineTotalKobo: number }[];
}

export async function serverCheckout(
  address: CheckoutAddressInput,
  voucherCode?: string,
  creatorCode?: string,
  fulfilment?: { locationId?: string; method?: 'DELIVERY' | 'PICKUP' },
  idempotencyKey = newIdempotencyKey(),
  guestAccessToken?: string,
): Promise<{ order: ServerOrderView; replay: boolean }> {
  const sessionId = guestSessionId();
  const { fullName, phone, street, city, state, email, deliveryNotes } = address;
  return apiFetch('/api/checkout', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({
      sessionId,
      guestAddress: { fullName, phone, street, city, state, country: 'NG' },
      guestEmail: email,
      ...(guestAccessToken ? { guestAccessToken } : {}),
      note: deliveryNotes ?? '',
      ...(voucherCode ? { voucherCode } : {}),
      ...(creatorCode ? { creatorCode } : {}),
      ...(fulfilment?.locationId ? { fulfilmentLocationId: fulfilment.locationId } : {}),
      ...(fulfilment?.method ? { fulfilmentMethod: fulfilment.method } : {}),
    }),
  }, sessionId);
}

// ---------- Location-aware fulfilment (routing) ----------

export interface FulfilmentOption {
  locationId: string;
  name: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  operatingHours: string;
  method: 'DELIVERY' | 'PICKUP';
  feeKobo: number;
  etaText: string;
  isLocal: boolean;
}

export async function locateStockApi(input: {
  city: string;
  state: string;
  method: 'DELIVERY' | 'PICKUP';
  items: { variantId: string; qty: number }[];
}): Promise<{ options: FulfilmentOption[]; recommendedLocationId: string | null; hasFullCart: boolean } | null> {
  if (!BASE) return null;
  return apiFetch('/api/routing/locate-stock', { method: 'POST', body: JSON.stringify(input) });
}

// ---------- Creator referral (?ref=CODE) ----------

const REF_KEY = 'desla-referral-code';

export function storeReferralFromUrl(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = (params.get('ref') ?? params.get('referral') ?? '').trim().toUpperCase();
    if (/^[A-Z0-9]{3,20}$/.test(ref)) {
      try {
        sessionStorage.setItem(REF_KEY, ref);
        localStorage.setItem(REF_KEY, ref);
      } catch { /* storage unavailable */ }
      try {
        void validateCreatorCodeLive(ref).catch(() => null);
      } catch { /* best-effort click funnel only */ }
      return ref;
    }
  } catch { /* non-browser or malformed URL */ }
  return null;
}

export function storedReferralCode(): string | null {
  try {
    return sessionStorage.getItem(REF_KEY) ?? localStorage.getItem(REF_KEY);
  } catch {
    return null;
  }
}

export function clearReferralCode(): void {
  try {
    sessionStorage.removeItem(REF_KEY);
    localStorage.removeItem(REF_KEY);
  } catch { /* ignore */ }
}

// ---------- Partner operations (role-gated, owner-scoped) ----------

const pendingPartnerWrites = new Map<string, { fingerprint: string; key: string }>();
async function retryablePartnerWrite(path: string, payload: Record<string, unknown>): Promise<unknown> {
  const slot = `desla-pending:${path}:${payload.action}:${payload.kind ?? ''}`;
  const fingerprint = JSON.stringify(payload);
  let attempt = pendingPartnerWrites.get(slot);
  try { attempt ??= JSON.parse(sessionStorage.getItem(slot) ?? 'null') ?? undefined; } catch { /* Memory fallback. */ }
  if (!attempt || attempt.fingerprint !== fingerprint) attempt = { fingerprint, key: newIdempotencyKey() };
  pendingPartnerWrites.set(slot, attempt);
  try { sessionStorage.setItem(slot, JSON.stringify(attempt)); } catch { /* Memory fallback. */ }
  const result = await apiFetch(path, { method: 'POST', headers: { 'Idempotency-Key': attempt.key }, body: fingerprint });
  pendingPartnerWrites.delete(slot);
  try { sessionStorage.removeItem(slot); } catch { /* Memory fallback. */ }
  return result;
}
export async function writePartnerWorkspace(payload: Record<string, unknown>): Promise<any> {
  return retryablePartnerWrite('/api/partner/workspace', payload);
}

export async function saveAdminCatalogueProduct(product: Partial<Product>, idempotencyKey: string): Promise<void> {
  const isUuid = (v?: string) => Boolean(v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v));
  const payload = {
    ...(product.serverId ? { serverId: product.serverId, version: product.version } : {}),
    slug: (product.slug || product.name || product.id || 'item').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120),
    name: product.name,
    brand: product.brand,
    category: product.category,
    tagline: product.tagline ?? '',
    description: product.description ?? '',
    subCategory: product.subCategory ?? '',
    hashtag: product.hashtag,
    isActive: product.isActive ?? product.inStock ?? true,
    isNew: product.isNew ?? false,
    isBestseller: product.isBestseller ?? false,
    isFlashSale: product.isFlashSale ?? false,
    image: product.image,
    galleryImages: product.galleryImages ?? [],
    variants: (product.variants ?? []).map(({ id, sku, sizeLabel, priceNgn, compareAtNgn, stock, isActive }) => ({
      ...(isUuid(id) ? { id } : {}), sku, sizeLabel, priceNgn, compareAtNgn: compareAtNgn ?? null, stock, isActive,
    })),
    whatItDoes: product.whatItDoes ?? [],
    whoItsFor: product.whoItsFor ?? { skinTypes: [], concerns: [] },
    keyIngredients: product.keyIngredients ?? [],
    howToUse: product.howToUse ?? { routine: '', step: '', instructions: '', precautions: '' },
    brandInfo: product.brandInfo ?? { origin: '', crueltyFree: false, guarantee: '' },
    customBadge: product.customBadge,
  };
  await apiFetch('/api/admin/catalogue', {
    method: 'POST', headers: { 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(payload),
  });
}

export async function uploadProductMediaApi(file: File): Promise<{ url: string; filename: string; size: number; mimeType: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/admin/media/upload', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const message = (errorBody && errorBody.error && errorBody.error.message) || ('Upload failed with status ' + res.status);
    throw new Error(message);
  }
  return await res.json();
}

// ---------- Cryptocurrency API Integration ----------

export type CryptoRatesDto = Record<string, CryptoRateDto>;

export interface CryptoRateDto {
  asset: 'USDT' | 'BTC' | 'ETH' | 'SOL';
  name: string;
  usdPrice: number;
  ngnPrice: number;
  change24h: number;
  networks: string[];
  decimals: number;
  networkFee?: string;
  defaultNetwork?: string;
  supportedNetworks?: string[];
}

export interface CryptoInitDto {
  paymentId: string;
  attemptId: string;
  reference: string;
  orderId: string;
  asset: string;
  network: string;
  amountNgn: number;
  cryptoAmount: string;
  networkFeeCrypto: string;
  totalCrypto: string;
  exchangeRateNgn: string;
  depositAddress: string;
  qrPayload: string;
  status: string;
  expiresAt: string;
  expiresInSeconds: number;
  replay: boolean;
}

export interface CryptoStatusDto {
  id: string;
  orderId: string;
  asset: string;
  network: string;
  depositAddress: string;
  amountNgn: number;
  cryptoAmount: string;
  networkFeeCrypto: string;
  totalCrypto: string;
  txHash: string | null;
  confirmations: number;
  requiredConfirmations: number;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'EXPIRED' | 'FAILED';
  expiresAt: string;
  verifiedAt: string | null;
  orderNumber: string;
  isExpired: boolean;
  secondsRemaining: number;
}

export interface CryptoTransactionAdminDto {
  id: string;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  asset: string;
  network: string;
  amountNgn: number;
  totalCrypto: string;
  depositAddress: string;
  txHash: string | null;
  confirmations: number;
  requiredConfirmations: number;
  status: string;
  createdAt: string;
  verifiedAt: string | null;
  explorerUrl: string | null;
}

export async function fetchCryptoRates(): Promise<Record<string, CryptoRateDto>> {
  return apiFetch('/api/crypto/rates');
}

export async function initCryptoPayment(orderId: string, asset: string, network: string, idempotencyKey: string): Promise<CryptoInitDto> {
  return apiFetch('/api/payments/crypto/init', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ orderId, asset, network }),
  });
}

export async function verifyCryptoPayment(paymentId: string, txHash?: string): Promise<{ paymentId: string; orderId: string; orderNumber: string; status: string; txHash: string; verifiedAt: string; alreadySettled: boolean }> {
  return apiFetch('/api/payments/crypto/verify', {
    method: 'POST',
    body: JSON.stringify({ paymentId, txHash }),
  });
}

export async function getCryptoPaymentStatus(paymentId: string): Promise<CryptoStatusDto> {
  return apiFetch(`/api/payments/crypto/verify?paymentId=${encodeURIComponent(paymentId)}`);
}

export async function fetchAdminCryptoTransactions(): Promise<CryptoTransactionAdminDto[]> {
  const res = await apiFetch<{ transactions: CryptoTransactionAdminDto[] }>('/api/admin/crypto/transactions');
  return res.transactions || [];
}

export async function fetchPartnerDashboard(kind: 'DISTRIBUTOR' | 'CREATOR'): Promise<any> {
  if (!BASE) return null;
  return apiFetch(`/api/partner?kind=${kind}`);
}

export interface WholesaleItem {
  variantId: string; sku: string; name: string; size: string; unitPriceKobo: number;
  unitsPerCarton: number; minimumCartons: number; available: number;
}
export interface WholesaleQuote {
  tier: string; locationId: string; subtotalKobo: number; deliveryFeeKobo: number; totalKobo: number; quoteFingerprint: string;
  shippingAddress: { fullName: string; street: string; city: string; state: string; phone: string };
  items: { variantId: string; productName: string; variantLabel: string; sku: string; cartons: number; unitsPerCarton: number; qty: number; unitPriceKobo: number; lineTotalKobo: number }[];
}
export interface WholesaleOrder extends ServerOrderView {
  kind: 'WHOLESALE'; createdAt: string; wholesaleTerms: WholesaleQuote;
  wholesaleDispatchedAt: string | null; wholesaleReceivedAt: string | null; wholesaleReturnedAt: string | null;
}
export interface WholesaleDashboard {
  tier: string; location: { id: string; name: string; city: string; address: string };
  items: WholesaleItem[]; orders: WholesaleOrder[];
}
export function fetchWholesale(): Promise<WholesaleDashboard> {
  return apiFetch('/api/partner/wholesale');
}
export function quoteWholesale(items: { variantId: string; cartons: number }[]): Promise<WholesaleQuote> {
  return apiFetch('/api/partner/wholesale', { method: 'POST', body: JSON.stringify({ action: 'quote', items }) });
}
export function buyWholesale(items: { variantId: string; cartons: number }[], quoteFingerprint: string, key: string): Promise<{ order: WholesaleOrder; replay: boolean }> {
  return apiFetch('/api/partner/wholesale', { method: 'POST', headers: { 'Idempotency-Key': key }, body: JSON.stringify({ action: 'checkout', items, quoteFingerprint }) });
}
export function wholesaleOrderAction(action: 'receive' | 'cancel', orderId: string): Promise<WholesaleOrder> {
  return apiFetch('/api/partner/wholesale', { method: 'POST', body: JSON.stringify({ action, orderId }) });
}
export function recordWholesaleSale(input: { variantId: string; qty: number; note: string }, key: string): Promise<{ recorded: boolean }> {
  return apiFetch('/api/partner/wholesale', { method: 'POST', headers: { 'Idempotency-Key': key }, body: JSON.stringify({ action: 'directSale', ...input }) });
}

export async function partnerOrderTransition(input: {
  orderId: string; transition: 'ACCEPT' | 'DISPATCH' | 'READY_PICKUP' | 'CONFIRM_PICKUP' | 'COMPLETE_DELIVERY'; code?: string; note?: string;
}): Promise<{ result: ServerOrderView }> {
  return apiFetch('/api/partner', {
    method: 'POST',
    body: JSON.stringify({ action: 'order', kind: 'DISTRIBUTOR', orderId: input.orderId, transition: input.transition, ...(input.code ? { code: input.code } : {}), note: input.note ?? '' }),
  });
}

export async function partnerBankRegister(kind: 'DISTRIBUTOR' | 'CREATOR', bank: { bankCode: string; bankName: string; accountName: string; accountNumber: string }): Promise<unknown> {
  return apiFetch('/api/partner', { method: 'POST', body: JSON.stringify({ action: 'bank', kind, ...bank }) });
}

export async function partnerWithdraw(kind: 'DISTRIBUTOR' | 'CREATOR', input: { bankAccountId: string; amountKobo: number }): Promise<unknown> {
  return retryablePartnerWrite('/api/partner', { action: 'withdraw', kind, ...input });
}

export async function partnerRestock(input: { variantId: string; qty: number }): Promise<unknown> {
  return retryablePartnerWrite('/api/partner', { action: 'restock', kind: 'DISTRIBUTOR', ...input });
}

export async function uploadPartnerMedia(file: File): Promise<{ url: string; fileName: string; size: number }> {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch<{ url: string; fileName: string; size: number }>('/api/partner/media/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function partnerReceiveTransfer(transferId: string): Promise<unknown> {
  return apiFetch('/api/partner', { method: 'POST', body: JSON.stringify({ action: 'receive', kind: 'DISTRIBUTOR', transferId }) });
}

export async function requestPickupCode(orderId: string, _email?: string): Promise<{ code: string; expiresAt: string } | null> {
  return apiFetch(`/api/orders/${encodeURIComponent(orderId)}/pickup-code`, { method: 'POST', headers: guestHeaders(orderId), body: JSON.stringify({}) });
}

// ---------- Admin network (locations, transfers, payouts) ----------

export async function fetchNetworkOverview(): Promise<unknown | null> {
  if (!BASE) return null;
  try {
    return await apiFetch('/api/admin/network');
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return null;
    throw e;
  }
}

export async function networkCommand(input: Record<string, unknown>): Promise<unknown> {
  if (input.action === 'transfer') return retryablePartnerWrite('/api/admin/network', input);
  return apiFetch('/api/admin/network', {
    method: 'POST',
    headers: { 'Idempotency-Key': newIdempotencyKey() },
    body: JSON.stringify(input),
  });
}

export type PayProvider = 'flutterwave' | 'stripe' | 'opay' | 'transfer';

export interface InitResult {
  attemptId: string;
  reference: string;
  provider: PayProvider;
  authorizationUrl: string | null;
  bankDetails?: { bankName: string; accountNumber: string; accountName: string };
  replay: boolean;
}

export async function initPayment(orderId: string, provider: PayProvider, _guestEmail?: string, idempotencyKey = newIdempotencyKey()): Promise<InitResult> {
  return apiFetch('/api/payments/init', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey, ...guestHeaders(orderId) },
    body: JSON.stringify({ orderId, provider }),
  }, guestSessionId());
}

export interface PaymentStatus {
  reference: string;
  provider: string;
  status: string;
  authorizationUrl: string | null;
  settled: boolean;
  orderId: string;
  orderNumber: string;
}

/** Guest capability for a payment attempt (persisted at init; survives reload). */
export function paymentTokenFor(reference: string): string | null {
  try { return localStorage.getItem(`glowly-payment-token:${reference}`); } catch { return null; }
}

/** Most recent payment reference from this browser (resume/verify affordance). */
export function lastPaymentReference(): string | null {
  try { return localStorage.getItem('glowly-last-reference'); } catch { return null; }
}

export async function paymentStatus(reference: string): Promise<PaymentStatus> {
  const token = paymentTokenFor(reference);
  return apiFetch(`/api/payments/status?reference=${encodeURIComponent(reference)}`, { headers: token ? { 'X-Guest-Order-Token': token } : {} }, guestSessionId());
}

// ---------- Orders (tracking screens) ----------

export async function fetchServerOrder(orderId: string, token?: string): Promise<ServerOrderView & { history: { toStatus: string; createdAt: string }[]; shippingAddress: { name?: string; street?: string; city?: string; state?: string; phone?: string } } | null> {
  try {
    return await apiFetch(`/api/orders/${encodeURIComponent(orderId)}`, { headers: guestHeaders(orderId, token && /^[a-f0-9]{64}$/.test(token) ? token : undefined) }, guestSessionId());
  } catch {
    return null;
  }
}

/** Map a server order view onto the storefront Order type (tracking UI). */
export function mapServerOrder(view: ServerOrderView, fallbackItems: CartItem[], paymentMethod: string): Order {
  const statusLabels: Record<string, Order['status']> = { PENDING: 'Processing', PAID: 'Processing', FULFILLING: 'Awaiting Packing', READY_PICKUP: 'Ready for Pickup', SHIPPED: 'In Transit', DELIVERED: 'Delivered', CANCELLED: 'Cancelled', REFUNDED: 'Cancelled' };
  const labels: Record<string, string> = { PENDING: 'Order placed', PAID: 'Payment confirmed', FULFILLING: 'Preparing order', READY_PICKUP: 'Ready for pickup', SHIPPED: 'Dispatched', DELIVERED: 'Delivered', CANCELLED: 'Cancelled', REFUNDED: 'Refunded' };
  const address = view.shippingAddress;
  const history = [...(view.history || [])].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  return {
    id: view.orderNumber, serverId: view.id, serverStatus: view.status, paymentStatus: view.paymentStatus,
    fulfilmentMethod: view.fulfilmentMethod === 'PICKUP' ? 'PICKUP' : view.fulfilmentMethod === 'DELIVERY' ? 'DELIVERY' : undefined,
    date: view.createdAt ? new Date(view.createdAt).toLocaleString() : '',
    status: statusLabels[view.status] || 'Processing',
    items: view.items.map(item => {
      const local = fallbackItems.find(cart => cart.product.name === item.productName);
      return { productId: item.variantId, productName: item.productName, brand: local?.product.brand || '', size: item.variantLabel, price: item.unitPriceKobo / 100, quantity: item.qty, image: local?.product.image || '' };
    }),
    subtotal: view.subtotalKobo / 100, deliveryFee: view.deliveryFeeKobo / 100, total: view.totalKobo / 100,
    trackingSteps: history.map((event, index) => ({ title: labels[event.toStatus] || event.toStatus, timestamp: new Date(event.createdAt).toLocaleString(), status: index === history.length - 1 && !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(view.status) ? 'current' as const : 'completed' as const, description: labels[event.toStatus] || event.toStatus })),
    shippingAddress: { name: address?.fullName || address?.name || '', street: address?.street || '', city: address?.city || '', state: address?.state || '', phone: address?.phone || '' },
    shipment: view.shipment,
    paymentMethod,
  };
}

// ---------- Reviews / wishlist / loyalty (fire-and-forget mirrors) ----------

export async function submitReviewApi(input: { productId: string; rating: number; title: string; comment: string }): Promise<{ review: { id: string; status: string } }> {
  // productId is the storefront slug; the server resolves slug → uuid.
  return apiFetch('/api/reviews', { method: 'POST', body: JSON.stringify(input) });
}

export async function fetchLoyalty(): Promise<{ points: number } | null> {
  if (!BASE) return null;
  try {
    return await apiFetch('/api/me/loyalty');
  } catch {
    return null;
  }
}

// ---------- Transfer claims (manual bank-transfer proof) ----------

export interface TransferClaimInput {
  orderId: string; // server uuid (see orderUuid helpers below)
  guestEmail?: string;
  senderName: string;
  amountKobo: number;
  bankName?: string;
  narration?: string;
  transferDate?: string;
}

export async function submitTransferClaim(input: TransferClaimInput): Promise<{ claim: { id: string; status: string } }> {
  const { guestEmail: _guestEmail, ...claim } = input;
  return apiFetch('/api/payments/transfer-claim', {
    method: 'POST',
    headers: guestHeaders(input.orderId),
    body: JSON.stringify(claim),
  }, guestSessionId());
}

/** orderNumber (local) ↔ server uuid mapping for claim/tracking continuity. */
const ORDER_MAP_KEY = 'glowly-order-uuids';

function readOrderMap(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(ORDER_MAP_KEY) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

export function rememberServerOrder(orderNumber: string, serverUuid: string): void {
  try {
    const map = readOrderMap();
    map[orderNumber] = serverUuid;
    localStorage.setItem(ORDER_MAP_KEY, JSON.stringify(map));
  } catch {
    // storage unavailable — claim flow degrades gracefully
  }
}

export function serverOrderUuid(orderNumber: string): string | null {
  try {
    return readOrderMap()[orderNumber] ?? null;
  } catch {
    return null;
  }
}

// ---------- Loyalty (full view + redeem) ----------

export interface LoyaltyVoucher {
  code: string;
  amountKobo: number;
  status: string;
}

export interface LoyaltyActivity {
  id?: string;
  title: string;
  points: number;
  date?: string;
}

export interface LoyaltyView {
  points: number;
  vouchers: LoyaltyVoucher[];
  activity: LoyaltyActivity[];
  tiers: { points: number; amountKobo: number }[];
}

export async function fetchLoyaltyView(): Promise<LoyaltyView | null> {
  if (!BASE) return null;
  try {
    return await apiFetch<LoyaltyView>('/api/me/loyalty');
  } catch {
    return null;
  }
}

export async function redeemLoyaltyVoucher(points: number): Promise<{ voucher: LoyaltyVoucher }> {
  return apiFetch('/api/me/loyalty', { method: 'POST', body: JSON.stringify({ points }) });
}

// ---------- AI concierge (authenticated; mock thread otherwise) ----------

export interface ChatMsg {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  recommendedProductIds?: string[];
}

const conversationVersions = new Map<string, number>();
export function resetAiConversation(ownerId: string) {
  conversationVersions.set(ownerId, (conversationVersions.get(ownerId) ?? 0) + 1);
  try { localStorage.removeItem('desla-ai-conversation:' + ownerId); } catch { /* Storage is optional. */ }
}

/** A conversation ID is a reference, never an authentication credential. */
export async function aiChat(content: string, ownerId: string): Promise<{ user: ChatMsg; assistant: ChatMsg; provider: string }> {
  if (!ownerId) throw new ApiError(401, 'unauthorized', 'Sign in to use your saved conversation.');
  const key = 'desla-ai-conversation:' + ownerId;
  const revision = authSessionRevision();
  const conversationVersion = conversationVersions.get(ownerId) ?? 0;
  const current = () => {
    if (revision !== authSessionRevision()) throw new ApiError(409, 'session_changed', 'Your account changed. Please send your message again.');
    if (conversationVersion !== (conversationVersions.get(ownerId) ?? 0)) throw new ApiError(409, 'conversation_changed', 'Your conversation was restarted. Please send your message again.');
  };
  let id: string | null = null;
  try { localStorage.removeItem('glowly-ai-conv'); id = localStorage.getItem(key); } catch { /* Storage is optional. */ }
  for (let attempt = 0; attempt < 2; attempt++) {
    current();
    if (!id) {
      const created = await apiFetch<{ conversation: { id: string } }>('/api/ai/conversations', { method: 'POST', body: JSON.stringify({}) });
      current();
      id = created.conversation.id;
      try { localStorage.setItem(key, id); } catch { /* This turn still works without storage. */ }
    }
    try {
      const res = await apiFetch<{ userMessage: { id: string; content: string }; assistantMessage: { id: string; content: string }; grounded: { slug: string }[]; provider: string }>(`/api/ai/conversations/${encodeURIComponent(id)}/messages`, { method: 'POST', body: JSON.stringify({ content }) });
      current();
      if (!res.assistantMessage || !res.userMessage) throw new ApiError(502, 'chat_failed', 'The assistant returned an incomplete reply.');
      return { user: { id: res.userMessage.id, sender: 'user', text: res.userMessage.content, timestamp: 'Just now' }, assistant: { id: res.assistantMessage.id, sender: 'assistant', text: res.assistantMessage.content, timestamp: 'Just now', recommendedProductIds: (res.grounded ?? []).map(product => product.slug) }, provider: res.provider };
    } catch (error) {
      current();
      if (!(error instanceof ApiError) || error.status !== 404 || attempt > 0) throw error;
      id = null;
      try { localStorage.removeItem(key); } catch { /* Storage is optional. */ }
    }
  }
  throw new ApiError(502, 'chat_failed', 'The assistant could not open your conversation.');
}

// ---------- Skin profile mirror (fire-and-forget after local scan) ----------

const SKIN_ENUM = ['oily', 'dry', 'combination', 'sensitive', 'normal'] as const;

export async function mirrorSkinProfile(input: { skinType: string; concerns: string[] }): Promise<void> {
  if (!BASE) return;
  const skinType = input.skinType.trim().toLowerCase();
  if (!(SKIN_ENUM as readonly string[]).includes(skinType)) return;
  await apiFetch('/api/me/skin-profile', {
    method: 'PUT',
    body: JSON.stringify({ skinType, concerns: input.concerns.slice(0, 12), notes: '' }),
  }).catch(() => null);
}

// ---------- Wishlist mirror (authenticated; silent for guests) ----------

export async function mirrorWishlist(productId: string, size: string | undefined, wishlisted: boolean): Promise<void> {
  if (!BASE) return;
  try {
    const detail = await fetchProductDetail(productId);
    const variant = detail?.variants.find((v) => v.sizeLabel.toLowerCase() === (size ?? '').toLowerCase()) ?? detail?.variants[0];
    if (!variant) return;
    if (wishlisted) {
      await apiFetch('/api/me/wishlist', { method: 'POST', body: JSON.stringify({ variantId: variant.id }) });
    } else {
      await apiFetch(`/api/me/wishlist?variantId=${encodeURIComponent(variant.id)}`, { method: 'DELETE' });
    }
  } catch {
    // 401 guests, network blips — local state remains the source of truth
  }
}

// ---------- Admin Console Operations (STAFF / ADMIN / SUPER_ADMIN) ----------

export async function fetchAdminOrders(status?: string, limit = 50): Promise<{ orders: AdminOrder[] } | null> {
  if (!BASE) return null;
  try {
    const url = new URL(`${BASE}/api/admin/orders`);
    if (status) url.searchParams.set('status', status);
    url.searchParams.set('limit', String(limit));
    const res = await apiFetch<{ orders: AdminOrder[] }>(url.pathname + url.search);
    return res;
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return null;
    throw e;
  }
}

export async function updateAdminOrderStatus(orderId: string, status: string): Promise<{ ok: boolean; order?: unknown }> {
  return apiFetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function fetchAdminTransferClaims(status?: 'pending' | 'confirmed' | 'rejected'): Promise<{ claims: AdminTransferClaim[] } | null> {
  if (!BASE) return null;
  try {
    const url = new URL(`${BASE}/api/admin/transfer-claims`);
    if (status) url.searchParams.set('status', status);
    return await apiFetch<{ claims: AdminTransferClaim[] }>(url.pathname + url.search);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return null;
    throw e;
  }
}

export async function confirmAdminTransferClaim(claimId: string, approve: boolean, note?: string): Promise<{ ok: boolean }> {
  return apiFetch('/api/admin/transfer-claims/confirm', {
    method: 'POST',
    body: JSON.stringify({ claimId, approve, note }),
  });
}

export async function fetchAdminAudits(limit = 20): Promise<{ audit: AdminAuditLog[] } | null> {
  if (!BASE) return null;
  try {
    return await apiFetch<{ audit: AdminAuditLog[] }>(`/api/admin/audit?limit=${limit}`);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return null;
    throw e;
  }
}

// ---------- Distributors (directory + city stock + applications) ----------

import type { Distributor } from '../types';

interface OwnedDistributor {
  id: string;
  name: string;
  businessName: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  whatsapp: string;
  verified: boolean;
  tier: 'Bronze' | 'Silver' | 'Gold';
  isOnlineOnly: boolean;
  pickupAvailable: boolean;
  operatingHours: string;
  rating: number | string;
  reviewsCount: number;
  stockedSkus: string[];
  location: Distributor['location'];
  stock: Distributor['stock'];
}

function mapDistributor(d: OwnedDistributor): Distributor {
  return {
    id: d.id,
    name: d.name,
    businessName: d.businessName,
    city: d.city,
    state: d.state,
    address: d.address,
    phone: d.phone,
    whatsapp: d.whatsapp,
    verified: d.verified,
    tier: d.tier,
    isOnlineOnly: d.isOnlineOnly,
    pickupAvailable: d.location?.pickupEnabled ?? d.pickupAvailable,
    operatingHours: d.operatingHours,
    rating: Number(d.rating),
    reviewsCount: d.reviewsCount,
    stockedSkus: d.stockedSkus,
    location: d.location,
    stock: d.stock,
  };
}

export async function fetchDistributors(city?: string): Promise<Distributor[] | null> {
  if (!BASE) return null;
    const q = city ? `?limit=100&city=${encodeURIComponent(city)}` : '?limit=100';
    const body = await apiFetch<{ distributors: OwnedDistributor[] }>(`/api/distributors${q}`);
    return body.distributors.map(mapDistributor);
}

export interface CityStock {
  distributorId: string;
  name: string;
  businessName: string;
  city: string;
  address: string;
  phone: string;
  pickupAvailable: boolean;
  quantity: number;
}

export async function fetchStockNearCity(variantId: string, city: string): Promise<CityStock[] | null> {
  if (!BASE) return null;
  try {
    const body = await apiFetch<{ stock: CityStock[] }>(
      `/api/distributors/stock?variantId=${encodeURIComponent(variantId)}&city=${encodeURIComponent(city)}`
    );
    return body.stock;
  } catch {
    return null;
  }
}

export interface ApplicationReceipt { id: string; status: string; reviewNote?: string }

export async function submitDistributorApplication(input: {
  name: string;
  businessName?: string;
  city: string;
  state?: string;
  address: string;
  phone: string;
  whatsapp?: string;
}): Promise<ApplicationReceipt> {
  if (!BASE) throw new Error('Connect the live backend to submit an application.');
  const body = await apiFetch<{ application: ApplicationReceipt }>('/api/distributors', { method: 'POST', body: JSON.stringify(input) });
  return body.application;
}

// ---------- Creators (directory, validation, applications) ----------

import type { Creator, CommunityPost, CommunityMessage, ProductReview } from '../types';

interface OwnedCreator {
  name: string;
  handle: string;
  platform: 'Instagram' | 'TikTok' | 'YouTube';
  niche: string;
  avatarUrl: string;
  promoCode: string;
  discountPercent: number;
}

function mapCreator(c: OwnedCreator): Creator {
  return {
    id: c.promoCode,
    name: c.name,
    handle: c.handle,
    platform: c.platform,
    niche: c.niche,
    avatar: c.avatarUrl,
    promoCode: c.promoCode,
    discountPercent: c.discountPercent,
    commissionRate: 0,
    totalSalesNgn: 0,
    commissionEarnedNgn: 0,
    clicks: 0,
    ordersCount: 0,
    verified: true,
  };
}

export async function fetchCreators(): Promise<Creator[] | null> {
  if (!BASE) return null;
  try {
    const body = await apiFetch<{ creators: OwnedCreator[] }>('/api/creators');
    return body.creators.map(mapCreator);
  } catch {
    return null;
  }
}

export async function validateCreatorCodeLive(code: string): Promise<{ success: boolean; discountPercent: number; name: string }> {
  const body = await apiFetch<{ name: string; promoCode: string; discountPercent: number }>(
    `/api/creators?code=${encodeURIComponent(code.trim())}`
  );
  return { success: true, discountPercent: body.discountPercent, name: body.name };
}

export async function submitCreatorApplication(input: { name: string; handle: string; platform: 'Instagram' | 'TikTok' | 'YouTube'; niche: string }): Promise<ApplicationReceipt> {
  if (!BASE) throw new Error('Connect the live backend to submit an application.');
  const body = await apiFetch<{ application: ApplicationReceipt }>('/api/creators', { method: 'POST', body: JSON.stringify(input) });
  return body.application;
}

// ---------- Community (posts, likes, chat) ----------

export async function fetchCommunityPosts(): Promise<CommunityPost[] | null> {
  if (!BASE) return null;
  try {
    const body = await apiFetch<{ posts: CommunityPostDto[] }>('/api/community/posts?limit=50');
    return body.posts.map(communityPostFromApi);
  } catch {
    return null;
  }
}

export async function createCommunityPostApi(input: {
  content: string;
  taggedProductId?: string;
  taggedProductHashtag?: string;
  mediaType?: 'image' | 'video';
  mediaUrl?: string;
  mediaId?: string;
}): Promise<CommunityPost> {
  const { taggedProductHashtag, ...fields } = input;
  const result = await apiFetch<{ post: CommunityPostDto }>('/api/community/posts', { method: 'POST', body: JSON.stringify({ ...fields, taggedHashtag: taggedProductHashtag }) });
  return communityPostFromApi(result.post);
}

export async function fetchPartnerWorkspace(kind: 'CREATOR' | 'DISTRIBUTOR'): Promise<any> {
  return apiFetch(`/api/partner/workspace?kind=${kind}`);
}

export async function likeCommunityPostApi(postId: string): Promise<{ likesCount: number; liked: boolean }> {
  return apiFetch(`/api/community/posts/${encodeURIComponent(postId)}/like`, { method: 'POST' });
}

export async function fetchPostCommentsApi(postId: string): Promise<import('../types').CommunityComment[]> {
  if (!BASE) return [];
  const body = await apiFetch<{ comments: import('../types').CommunityComment[] }>(
    `/api/community/posts/${encodeURIComponent(postId)}/comments?limit=100`,
  );
  return body.comments ?? [];
}

export async function createPostCommentApi(
  postId: string,
  input: { content: string; parentCommentId?: string },
): Promise<{ comment: import('../types').CommunityComment; commentsCount: number }> {
  return apiFetch(`/api/community/posts/${encodeURIComponent(postId)}/comments`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

interface OwnedChatMessage {
  id: string;
  senderName: string;
  senderAvatar: string;
  channel: string;
  message: string;
  likes: number;
  createdAt: string;
}

function mapChatMessage(m: OwnedChatMessage): CommunityMessage {
  return { id: m.id, senderName: m.senderName, senderAvatar: m.senderAvatar, time: m.createdAt, message: m.message, likes: m.likes, channel: m.channel };
}

export async function fetchCommunityChat(channel = 'routine'): Promise<CommunityMessage[] | null> {
  if (!BASE) return null;
  try {
    const body = await apiFetch<{ messages: OwnedChatMessage[] }>(`/api/community/chat?channel=${encodeURIComponent(channel)}&limit=50`);
    return body.messages.map(mapChatMessage);
  } catch {
    return null;
  }
}

export async function sendCommunityChatApi(channel: string, message: string): Promise<CommunityMessage> {
  const result = await apiFetch<{ message: OwnedChatMessage }>('/api/community/chat', { method: 'POST', body: JSON.stringify({ channel, message }) });
  return mapChatMessage(result.message);
}

// ---------- Reviews (approved list per product) ----------

interface OwnedReview {
  authorName?: string; authorAvatar?: string; verifiedPurchase?: boolean; helpfulCount?: number; createdAt?: string;
  id: string;
  product_id: string;
  product_sku?: string;
  author_name: string;
  author_avatar?: string;
  rating: number;
  title: string;
  comment: string;
  verified_purchase: boolean;
  city?: string;
  skin_type?: string;
  photo_url?: string;
  helpful_count: number;
  created_at: string;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 'Just now';
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export async function fetchProductReviewsApi(productSlug: string): Promise<ProductReview[] | null> {
  if (!BASE) return null;
  try {
    const body = await apiFetch<{ reviews: OwnedReview[] }>(`/api/products/${encodeURIComponent(productSlug)}/reviews?limit=20`);
    return body.reviews.map((r) => ({
      id: r.id,
      productId: productSlug,
      productSku: r.product_sku,
      authorName: r.authorName ?? r.author_name ?? '',
      authorAvatar: r.authorAvatar ?? r.author_avatar,
      rating: r.rating,
      date: r.createdAt || r.created_at ? timeAgo(r.createdAt || r.created_at) : '',
      title: r.title,
      comment: r.comment,
      verifiedPurchase: r.verifiedPurchase ?? r.verified_purchase ?? false,
      city: r.city,
      skinType: r.skin_type,
      photoUrl: r.photo_url,
      helpfulCount: r.helpfulCount ?? r.helpful_count ?? 0,
    }));
  } catch {
    return null;
  }
}

// ---------- Admin reads (console tabs) ----------

export interface InventoryOverviewRow {
  slug: string;
  name: string;
  variants: { id: string; sku: string; sizeLabel: string; priceKobo: number; available: number }[];
  totalAvailable: number;
}

export async function fetchInventoryOverview(): Promise<InventoryOverviewRow[] | null> {
  if (!BASE) return null;
  try {
    const body = await apiFetch<{ items: InventoryOverviewRow[] }>('/api/admin/inventory/overview?limit=100');
    return body.items;
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return null;
    throw e;
  }
}

export async function adjustStockApi(variantId: string, delta: number, reason: string): Promise<void> {
  await apiFetch('/api/admin/inventory', { method: 'POST', body: JSON.stringify({ variantId, delta, reason }) });
}

export interface AdminUserRow {
  id: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  roles: string[];
  createdAt: string;
}

export async function fetchAdminUsers(): Promise<AdminUserRow[] | null> {
  if (!BASE) return null;
  try {
    const body = await apiFetch<{ users: AdminUserRow[] }>('/api/admin/users?limit=100');
    return body.users;
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return null;
    throw e;
  }
}


export async function uploadCommunityMediaApi(file: File): Promise<string> {
  const staged = await apiFetch<{ mediaId: string; uploadUrl: string }>('/api/community/media', { method: 'POST', body: JSON.stringify({ mime: file.type, bytes: file.size }) });
  const target = new URL(staged.uploadUrl);
  if (target.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && target.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(target.hostname))) throw new Error('The upload address is invalid.');
  const saved = await fetch(target.toString(), { method: 'PUT', body: file, credentials: 'omit', redirect: 'error', headers: { 'Content-Type': file.type } });
  if (!saved.ok) throw new Error('The media could not be uploaded. Your text is preserved; retry the upload.');
  return staged.mediaId;
}
