// Owned-backend client (Glowly S2+). Strangler pattern: when VITE_API_URL is
// set, the storefront talks to the owned Next.js API; otherwise it keeps
// running on local mocks. Reads never throw (null = use fallback); writes
// throw ApiError so callers can show messages.
import type { CartItem, Order, Product, AdminOrder, AdminTransferClaim, AdminAuditLog, AdminInventoryItem } from '../types';

const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '');

export const isOwnedApiConfigured = Boolean(BASE);

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function apiFetch<T>(path: string, init: RequestInit = {}, sessionId?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(init.headers as Record<string, string> | undefined) };
  if (sessionId) headers['X-Session-Id'] = sessionId;
  const res = await fetch(`${BASE}${path}`, { ...init, headers, credentials: 'include' });
  const body = (await res.json().catch(() => null)) as { error?: { code?: string; message?: string } } | T;
  if (!res.ok) {
    const err = (body as { error?: { code?: string; message?: string } })?.error;
    throw new ApiError(res.status, err?.code ?? 'request_failed', err?.message ?? `Request failed (${res.status}).`);
  }
  return body as T;
}

/** Guest session id (localStorage). Server carts key off this until login. */
const SESSION_KEY = 'glowly-session-id';
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

function mapOwned(o: OwnedProduct): Product {
  const gallery = o.images.map((i) => i.url);
  return {
    id: o.slug,
    sku: o.variants[0]?.sku,
    name: o.name,
    brand: o.brand.name,
    tagline: o.tagline,
    rating: o.rating,
    reviewsCount: o.reviewsCount,
    price: Math.round(o.minPriceNgn),
    originalPrice: undefined,
    discountPercentage: undefined,
    image: gallery[0] ?? '',
    galleryImages: gallery,
    category: o.category.slug,
    subCategory: o.subCategory,
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
    brandInfo: { origin: 'Lagos, Nigeria', crueltyFree: true, guarantee: '' },
  };
}

export async function fetchCatalogFromOwnedApi(limit = 100): Promise<Product[] | null> {
  if (!BASE) return null;
  try {
    const items: Product[] = [];
    let cursor: string | null = null;
    // Keyset pages until full (bounded: catalogue-scale loop, max 5 pages here).
    for (let page = 0; page < 5; page++) {
      const url = new URL(`${BASE}/api/products`);
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('sort', 'newest');
      if (cursor) url.searchParams.set('cursor', cursor);
      const res = await fetch(url.toString());
      if (!res.ok) return null;
      const body = (await res.json()) as { items: OwnedProduct[]; nextCursor: string | null };
      if (!Array.isArray(body.items)) return null;
      items.push(...body.items.map(mapOwned));
      cursor = body.nextCursor;
      if (!cursor) break;
    }
    return items.length > 0 ? items : null;
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
  profile: { displayName: string; phone?: string; avatarUrl?: string } | null;
}

export async function apiRegister(email: string, password: string): Promise<{ ok: boolean; email: string }> {
  return apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) });
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

export async function apiRequestPasswordReset(email: string): Promise<{ ok: boolean; _devResetToken?: string }> {
  return apiFetch('/api/auth/request-password-reset', { method: 'POST', body: JSON.stringify({ email }) });
}

export async function apiResetPassword(token: string, newPassword: string): Promise<{ ok: boolean }> {
  return apiFetch('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) });
}

export async function apiVerifyEmail(token: string): Promise<{ ok: boolean }> {
  return apiFetch('/api/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) });
}

// ---------- Catalogue detail (variant resolution for cart sync) ----------

interface OwnedDetail extends OwnedProduct {
  attributes: { name: string; value: string }[];
  ingredients: { name: string; description: string; detail: string }[];
}

const detailCache = new Map<string, OwnedDetail>();

export async function fetchProductDetail(slug: string): Promise<OwnedDetail | null> {
  if (!BASE) return null;
  const cached = detailCache.get(slug.toLowerCase());
  if (cached) return cached;
  try {
    const detail = await apiFetch<OwnedDetail>(`/api/products/${encodeURIComponent(slug.toLowerCase())}`);
    detailCache.set(slug.toLowerCase(), detail);
    return detail;
  } catch {
    return null;
  }
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

export async function syncCartToServer(items: { productId: string; size: string; quantity: number }[]): Promise<void> {  if (!BASE) return;
  const sessionId = guestSessionId();
  // Replace server cart with local lines (variant-resolved, server-priced).
  await apiFetch('/api/cart/items', { method: 'DELETE' }, sessionId).catch(() => null);
  for (const item of items) {
    const variantId = await resolveVariantId(item.productId, item.size);
    if (!variantId) continue; // unknown to server (mock-only product) — skip line
    await apiFetch('/api/cart/items', { method: 'POST', body: JSON.stringify({ variantId, qty: Math.min(99, item.quantity) }) }, sessionId).catch(() => null);
  }
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
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotalKobo: number;
  deliveryFeeKobo: number;
  totalKobo: number;
  items: { variantId: string; productName: string; variantLabel: string; sku: string; unitPriceKobo: number; qty: number; lineTotalKobo: number }[];
}

export async function serverCheckout(
  address: CheckoutAddressInput,
  voucherCode?: string,
  creatorCode?: string,
): Promise<{ order: ServerOrderView; replay: boolean }> {
  const sessionId = guestSessionId();
  const { fullName, phone, street, city, state, email, deliveryNotes } = address;
  return apiFetch('/api/checkout', {
    method: 'POST',
    headers: { 'Idempotency-Key': newIdempotencyKey() },
    body: JSON.stringify({
      sessionId,
      guestAddress: { fullName, phone, street, city, state, country: 'NG' },
      guestEmail: email,
      note: deliveryNotes ?? '',
      ...(voucherCode ? { voucherCode } : {}),
      ...(creatorCode ? { creatorCode } : {}),
    }),
  }, sessionId);
}

export type PayProvider = 'flutterwave' | 'paystack' | 'opay' | 'transfer';

export interface InitResult {
  attemptId: string;
  reference: string;
  provider: PayProvider;
  authorizationUrl: string | null;
  bankDetails?: { bankName: string; accountNumber: string; accountName: string };
  replay: boolean;
}

export async function initPayment(orderId: string, provider: PayProvider, guestEmail?: string): Promise<InitResult> {
  return apiFetch('/api/payments/init', {
    method: 'POST',
    body: JSON.stringify({ orderId, provider, ...(guestEmail ? { guestEmail } : {}) }),
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

export async function paymentStatus(reference: string, guestEmail?: string): Promise<PaymentStatus> {
  const q = guestEmail ? `?guestEmail=${encodeURIComponent(guestEmail)}` : '';
  return apiFetch(`/api/payments/status?reference=${encodeURIComponent(reference)}${q ? `&${q.slice(1)}` : ''}`, {}, guestSessionId());
}

// ---------- Orders (tracking screens) ----------

export async function fetchServerOrder(orderId: string, guestEmail?: string): Promise<ServerOrderView & { history: { toStatus: string; createdAt: string }[]; shippingAddress: { name?: string; street?: string; city?: string; state?: string; phone?: string } } | null> {
  try {
    const q = guestEmail ? `?email=${encodeURIComponent(guestEmail)}` : '';
    return await apiFetch(`/api/orders/${encodeURIComponent(orderId)}${q}`, {}, guestSessionId());
  } catch {
    return null;
  }
}

/** Map a server order view onto the storefront Order type (tracking UI). */
export function mapServerOrder(view: ServerOrderView, fallbackItems: CartItem[], paymentMethod: string): Order {
  const items = view.items.length > 0
    ? view.items.map((i) => {
      const local = fallbackItems.find((c) => c.product.name === i.productName);
      return {
        productId: i.variantId,
        productName: i.productName,
        brand: local?.product.brand ?? 'DESLA!™',
        size: i.variantLabel,
        price: Math.round(i.unitPriceKobo / 100),
        quantity: i.qty,
        image: local?.product.image ?? '',
      };
    })
    : fallbackItems.map((ci) => ({
      productId: ci.productId,
      productName: ci.product.name,
      brand: ci.product.brand,
      size: ci.size,
      price: ci.unitPrice,
      quantity: ci.quantity,
      image: ci.product.image,
    }));
  const subtotal = Math.round(view.subtotalKobo / 100);
  const deliveryFee = Math.round(view.deliveryFeeKobo / 100);
  return {
    id: view.orderNumber,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: view.status === 'PENDING' ? 'Processing' : view.status === 'DELIVERED' ? 'Delivered' : view.status === 'CANCELLED' ? 'Cancelled' : 'Shipped',
    items,
    subtotal,
    deliveryFee,
    total: Math.round(view.totalKobo / 100),
    fulfillmentType: 'local',
    trackingSteps: [
      { title: 'Order Confirmed', timestamp: 'Just now', status: 'completed', description: `Order ${view.orderNumber} created` },
      { title: 'Payment', timestamp: view.paymentStatus === 'PAID' ? 'Confirmed' : 'Pending', status: view.paymentStatus === 'PAID' ? 'completed' : 'current', description: view.paymentStatus === 'PAID' ? 'Payment verified' : 'Awaiting payment confirmation' },
      { title: 'Out for Delivery', timestamp: 'Upcoming', status: 'upcoming', description: 'Local courier dispatch' },
      { title: 'Delivered', timestamp: 'Upcoming', status: 'upcoming', description: 'Delivered to your address' },
    ],
    shippingAddress: { name: '', street: '', city: '', state: '', phone: '' },
    paymentMethod,
  };
}

// ---------- Reviews / wishlist / loyalty (fire-and-forget mirrors) ----------

export async function submitReviewApi(input: { productId: string; rating: number; title: string; comment: string }): Promise<void> {
  if (!BASE) return;
  // productId is the storefront slug; the server resolves slug → uuid.
  await apiFetch('/api/reviews', { method: 'POST', body: JSON.stringify(input) }).catch(() => null);
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
  return apiFetch('/api/payments/transfer-claim', {
    method: 'POST',
    body: JSON.stringify(input),
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

const CONV_KEY = 'glowly-ai-conv';

function convId(): string | null {
  try {
    return localStorage.getItem(CONV_KEY);
  } catch {
    return null;
  }
}

/** One chat turn against the owned assistant (catalogue-grounded, quota'd). */
export async function aiChat(content: string): Promise<{ user: ChatMsg; assistant: ChatMsg; provider: string }> {
  let id = convId();
  if (!id) {
    const created = await apiFetch<{ conversation: { id: string } }>('/api/ai/conversations', { method: 'POST', body: JSON.stringify({}) });
    id = created.conversation.id;
    try {
      localStorage.setItem(CONV_KEY, id);
    } catch {
      // storage unavailable — conversation simply won't persist
    }
  }
  const res = await apiFetch<{
    userMessage: { id: string; content: string };
    assistantMessage: { id: string; content: string };
    grounded: { slug: string }[];
    provider: string;
  }>(`/api/ai/conversations/${encodeURIComponent(id)}/messages`, { method: 'POST', body: JSON.stringify({ content }) });
  // Dead conversation (deleted server-side): reset once and retry.
  if (!res?.assistantMessage) throw new ApiError(500, 'chat_failed', 'Assistant is unavailable.');
  return {
    user: { id: res.userMessage.id, sender: 'user', text: res.userMessage.content, timestamp: 'Just now' },
    assistant: {
      id: res.assistantMessage.id,
      sender: 'assistant',
      text: res.assistantMessage.content,
      timestamp: 'Just now',
      recommendedProductIds: (res.grounded ?? []).map((g) => g.slug),
    },
    provider: res.provider,
  };
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
  business_name: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  whatsapp: string;
  verified: boolean;
  tier: 'Bronze' | 'Silver' | 'Gold';
  is_online_only: boolean;
  pickup_available: boolean;
  operating_hours: string;
  rating: number | string;
  reviews_count: number;
}

function mapDistributor(d: OwnedDistributor): Distributor {
  return {
    id: d.id,
    name: d.name,
    businessName: d.business_name,
    city: d.city,
    state: d.state,
    address: d.address,
    phone: d.phone,
    whatsapp: d.whatsapp,
    verified: d.verified,
    tier: d.tier,
    isOnlineOnly: d.is_online_only,
    pickupAvailable: d.pickup_available,
    operatingHours: d.operating_hours,
    rating: Number(d.rating),
    reviewsCount: d.reviews_count,
    stockedSkus: [],
  };
}

export async function fetchDistributors(city?: string): Promise<Distributor[] | null> {
  if (!BASE) return null;
  try {
    const q = city ? `?city=${encodeURIComponent(city)}` : '';
    const body = await apiFetch<{ distributors: OwnedDistributor[] }>(`/api/distributors${q}`);
    return body.distributors.map(mapDistributor);
  } catch {
    return null;
  }
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

export async function submitDistributorApplication(input: {
  name: string;
  businessName?: string;
  city: string;
  state?: string;
  address: string;
  phone: string;
  whatsapp?: string;
}): Promise<void> {
  if (!BASE) return;
  await apiFetch('/api/distributors', { method: 'POST', body: JSON.stringify(input) }).catch(() => null);
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

function mapCreator(c: OwnedCreator, index: number): Creator {
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
    ordersCount: index,
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

export async function submitCreatorApplication(input: { name: string; handle?: string; platform?: string; niche?: string }): Promise<void> {
  if (!BASE) return;
  await apiFetch('/api/creators', { method: 'POST', body: JSON.stringify({ ...input, code: input.name }) }).catch(() => null);
}

// ---------- Community (posts, likes, chat) ----------

interface OwnedPost {
  id: string;
  author_name: string;
  author_handle: string;
  author_avatar: string;
  author_role: string;
  skin_type?: string;
  content: string;
  media_type?: 'image' | 'video';
  media_url?: string;
  tagged_product_id?: string;
  tagged_product_hashtag?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

function mapPost(p: OwnedPost): CommunityPost {
  return {
    id: p.id,
    authorName: p.author_name,
    authorHandle: p.author_handle,
    authorAvatar: p.author_avatar,
    authorRole: p.author_role,
    skinType: p.skin_type,
    timestamp: p.created_at,
    content: p.content,
    mediaType: p.media_type,
    mediaUrl: p.media_url,
    taggedProductId: p.tagged_product_id,
    taggedProductHashtag: p.tagged_product_hashtag,
    likesCount: p.likes_count,
    commentsCount: p.comments_count,
    likedByMe: false,
  } as unknown as CommunityPost;
}

export async function fetchCommunityPosts(): Promise<CommunityPost[] | null> {
  if (!BASE) return null;
  try {
    const body = await apiFetch<{ posts: OwnedPost[] }>('/api/community/posts?limit=50');
    return body.posts.map(mapPost);
  } catch {
    return null;
  }
}

export async function createCommunityPostApi(input: {
  content: string;
  taggedProductId?: string;
  taggedProductHashtag?: string;
}): Promise<void> {
  if (!BASE) return;
  await apiFetch('/api/community/posts', { method: 'POST', body: JSON.stringify(input) }).catch(() => null);
}

export async function likeCommunityPostApi(postId: string): Promise<void> {
  if (!BASE) return;
  await apiFetch(`/api/community/posts/${encodeURIComponent(postId)}/like`, { method: 'POST' }).catch(() => null);
}

interface OwnedChatMessage {
  id: string;
  sender_name: string;
  sender_avatar: string;
  channel: string;
  message: string;
  likes: number;
  created_at: string;
}

function mapChatMessage(m: OwnedChatMessage): CommunityMessage {
  return { id: m.id, senderName: m.sender_name, senderAvatar: m.sender_avatar, time: m.created_at, message: m.message, likes: m.likes, channel: m.channel };
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

export async function sendCommunityChatApi(channel: string, message: string): Promise<void> {
  if (!BASE) return;
  await apiFetch('/api/community/chat', { method: 'POST', body: JSON.stringify({ channel, message }) }).catch(() => null);
}

// ---------- Reviews (approved list per product) ----------

interface OwnedReview {
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
      authorName: r.author_name,
      authorAvatar: r.author_avatar,
      rating: r.rating,
      date: timeAgo(r.created_at),
      title: r.title,
      comment: r.comment,
      verifiedPurchase: r.verified_purchase,
      city: r.city,
      skinType: r.skin_type,
      photoUrl: r.photo_url,
      helpfulCount: r.helpful_count,
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

