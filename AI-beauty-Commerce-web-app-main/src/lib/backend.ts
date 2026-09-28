// Desla!™ Backend — unified API surface (Supabase + Redis, mock fallback).
// UI code should call these helpers instead of importing src/data/*.ts directly.
// Strategy per call: Redis cache → Supabase → local mock. Never throws for reads.

import { getSupabase, isSupabaseConfigured } from './supabase';
import { cacheGetOrLoad, cacheKeys, TTL, isRedisConfigured } from './redis';
import type {
  Product,
  Distributor,
  Creator,
  CommunityPost,
  ProductReview,
  Category,
  Order,
} from '../types';
import { products as mockProducts } from '../data/products';
import { distributors as mockDistributors } from '../data/distributors';
import { creators as mockCreators } from '../data/creators';
import { communityPosts as mockPosts } from '../data/communityPosts';
import { reviews as mockReviews } from '../data/reviews';
import { categories as mockCategories } from '../data/categories';

export const isBackendConfigured = isSupabaseConfigured;
export const isCacheConfigured = isRedisConfigured;

if (!isBackendConfigured && typeof console !== 'undefined') {
  console.info('[desla-backend] running on local mocks (set VITE_SUPABASE_URL/KEY to go live).');
}

// ---------- Row mappers (snake_case DB → camelCase app types) ----------

type AnyRow = Record<string, unknown>;
const str = (v: unknown, fb = ''): string => (typeof v === 'string' ? v : fb);
const num = (v: unknown, fb = 0): number => (typeof v === 'number' ? v : Number(v) || fb);
const bool = (v: unknown, fb = false): boolean => (typeof v === 'boolean' ? v : fb);
const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

function mapProduct(r: AnyRow): Product {
  return {
    id: str(r.id),
    sku: (r.sku as string) ?? undefined,
    name: str(r.name),
    brand: str(r.brand, 'DESLA!™'),
    tagline: str(r.tagline),
    rating: num(r.rating),
    reviewsCount: num(r.reviews_count),
    price: num(r.price),
    originalPrice: (r.original_price as number) ?? undefined,
    discountPercentage: (r.discount_percentage as number) ?? undefined,
    image: str(r.image_url),
    galleryImages: arr<string>(r.gallery_images),
    category: str(r.category_id, 'body-care'),
    subCategory: str(r.sub_category),
    sizes: arr<string>(r.sizes),
    inStock: bool(r.in_stock, true),
    stockCount: num(r.stock_count),
    isBestseller: bool(r.is_bestseller),
    isNew: bool(r.is_new),
    isFlashSale: bool(r.is_flash_sale),
    hashtag: (r.hashtag as string) ?? undefined,
    description: str(r.description),
    whatItDoes: arr<string>(r.what_it_does),
    keyIngredients: arr<Product['keyIngredients'][number]>(r.key_ingredients),
    howToUse: (r.how_to_use as Product['howToUse']) ?? {
      routine: '',
      step: '',
      instructions: '',
      precautions: '',
    },
    whoItsFor: (r.who_its_for as Product['whoItsFor']) ?? { skinTypes: [], concerns: [] },
    brandInfo: (r.brand_info as Product['brandInfo']) ?? {
      origin: 'Lagos, Nigeria',
      crueltyFree: true,
      guarantee: '',
    },
  };
}

function mapDistributor(r: AnyRow): Distributor {
  return {
    id: str(r.id),
    name: str(r.name),
    businessName: str(r.business_name),
    city: str(r.city),
    state: str(r.state),
    address: str(r.address),
    phone: str(r.phone),
    whatsapp: str(r.whatsapp),
    verified: bool(r.verified, true),
    tier: ((r.tier as Distributor['tier']) ?? 'Silver'),
    isOnlineOnly: bool(r.is_online_only),
    pickupAvailable: bool(r.pickup_available, true),
    operatingHours: str(r.operating_hours),
    rating: num(r.rating, 5),
    reviewsCount: num(r.reviews_count),
    stockedSkus: arr<string>(r.stocked_skus),
  };
}

function mapCreator(r: AnyRow): Creator {
  return {
    id: str(r.id),
    name: str(r.name),
    handle: str(r.handle),
    platform: ((r.platform as Creator['platform']) ?? 'Instagram'),
    niche: str(r.niche),
    avatar: str(r.avatar_url),
    promoCode: str(r.promo_code),
    discountPercent: num(r.discount_percent, 10),
    commissionRate: num(r.commission_rate, 12),
    totalSalesNgn: num(r.total_sales_ngn),
    commissionEarnedNgn: num(r.commission_earned_ngn),
    clicks: num(r.clicks),
    ordersCount: num(r.orders_count),
    verified: bool(r.verified, true),
  };
}

function mapReview(r: AnyRow): ProductReview {
  return {
    id: str(r.id),
    productId: str(r.product_id),
    productSku: (r.product_sku as string) ?? undefined,
    authorName: str(r.author_name),
    authorAvatar: (r.author_avatar as string) ?? undefined,
    rating: num(r.rating, 5),
    date: str(r.created_at, 'Just now'),
    title: str(r.title),
    comment: str(r.comment),
    verifiedPurchase: bool(r.verified_purchase),
    city: (r.city as string) ?? undefined,
    skinType: (r.skin_type as string) ?? undefined,
    photoUrl: (r.photo_url as string) ?? undefined,
    helpfulCount: num(r.helpful_count),
  };
}

function mapPost(r: AnyRow): CommunityPost {
  return {
    id: str(r.id),
    authorName: str(r.author_name),
    authorHandle: str(r.author_handle),
    authorAvatar: str(r.author_avatar),
    authorRole: ((r.author_role as CommunityPost['authorRole']) ?? 'Verified Buyer'),
    skinType: (r.skin_type as string) ?? undefined,
    timestamp: str(r.created_at, 'Just now'),
    content: str(r.content),
    mediaType: (r.media_type as CommunityPost['mediaType']) ?? undefined,
    mediaUrl: (r.media_url as string) ?? undefined,
    videoDuration: (r.video_duration as string) ?? undefined,
    taggedProductId: (r.tagged_product_id as string) ?? undefined,
    taggedProductSku: (r.tagged_product_sku as string) ?? undefined,
    taggedProductHashtag: (r.tagged_product_hashtag as string) ?? undefined,
    taggedProductName: (r.tagged_product_name as string) ?? undefined,
    likesCount: num(r.likes_count),
    commentsCount: num(r.comments_count),
    isTransformation: bool(r.is_transformation),
  };
}

// ---------- Catalog ----------

export async function fetchProducts(): Promise<Product[]> {
  const loader = async (): Promise<Product[]> => {
    const sb = getSupabase();
    if (!sb) return mockProducts;
    const { data, error } = await sb.from('products').select('*').order('created_at');
    if (error || !data || data.length === 0) return mockProducts;
    return (data as AnyRow[]).map(mapProduct);
  };
  try {
    return await cacheGetOrLoad<Product[]>(cacheKeys.productsList, TTL.productsList, loader);
  } catch {
    return mockProducts;
  }
}

export async function fetchProductById(id: string): Promise<Product | null> {
  const loader = async (): Promise<Product | null> => {
    const sb = getSupabase();
    if (!sb) return mockProducts.find((p) => p.id === id) ?? null;
    const { data, error } = await sb.from('products').select('*').eq('id', id).single();
    if (error || !data) return mockProducts.find((p) => p.id === id) ?? null;
    return mapProduct(data as AnyRow);
  };
  try {
    const cached = await cacheGetOrLoad<Product | null>(
      cacheKeys.product(id),
      TTL.product,
      loader,
    );
    return cached;
  } catch {
    return mockProducts.find((p) => p.id === id) ?? null;
  }
}

export async function fetchCategories(): Promise<Category[]> {
  const loader = async (): Promise<Category[]> => {
    const sb = getSupabase();
    if (!sb) return mockCategories;
    const { data, error } = await sb.from('categories').select('*');
    if (error || !data || data.length === 0) return mockCategories;
    return (data as AnyRow[]).map((r) => ({
      id: str(r.id),
      name: str(r.name),
      slug: str(r.slug),
      itemCount: num(r.item_count),
      image: str(r.image_url),
      isFeatured: bool(r.is_featured),
      description: str(r.description),
    }));
  };
  try {
    return await cacheGetOrLoad<Category[]>(cacheKeys.categories, TTL.categories, loader);
  } catch {
    return mockCategories;
  }
}

// ---------- Distributors / local stock ----------

export async function fetchDistributorsForCity(city: string): Promise<Distributor[]> {
  const loader = async (): Promise<Distributor[]> => {
    const sb = getSupabase();
    if (!sb) {
      return mockDistributors.filter((d) => d.city.toLowerCase() === city.toLowerCase());
    }
    const { data, error } = await sb.from('distributors').select('*').ilike('city', city);
    if (error || !data || data.length === 0) {
      return mockDistributors.filter((d) => d.city.toLowerCase() === city.toLowerCase());
    }
    return (data as AnyRow[]).map(mapDistributor);
  };
  try {
    return await cacheGetOrLoad<Distributor[]>(
      cacheKeys.cityDistributors(city),
      TTL.cityDistributors,
      loader,
    );
  } catch {
    return mockDistributors.filter((d) => d.city.toLowerCase() === city.toLowerCase());
  }
}

export async function fetchStockForProduct(
  productId: string,
): Promise<{ city: string; available: boolean; quantity: number }[]> {
  const sb = getSupabase();
  if (!sb) {
    return mockProducts.find((p) => p.id === productId)?.distributorStock ?? [];
  }
  const { data, error } = await sb.from('inventory').select('city,available,quantity').eq('product_id', productId);
  if (error || !data) return mockProducts.find((p) => p.id === productId)?.distributorStock ?? [];
  return (data as AnyRow[]).map((r) => ({
    city: str(r.city),
    available: bool(r.available, true),
    quantity: num(r.quantity),
  }));
}

// ---------- Creators ----------

export async function validateCreatorCode(
  code: string,
): Promise<{ success: boolean; message: string; creator?: Creator }> {
  const normalized = code.trim().toUpperCase();
  const loader = async (): Promise<Creator | null> => {
    const sb = getSupabase();
    if (!sb) return mockCreators.find((c) => c.promoCode === normalized) ?? null;
    const { data, error } = await sb.from('creators').select('*').eq('promo_code', normalized).single();
    if (error || !data) return mockCreators.find((c) => c.promoCode === normalized) ?? null;
    return mapCreator(data as AnyRow);
  };
  try {
    const creator = await cacheGetOrLoad<Creator | null>(
      cacheKeys.creatorCode(normalized),
      TTL.creatorCode,
      loader,
    );
    if (creator) {
      return {
        success: true,
        message: `Applied ${creator.name}'s Creator Code: ${creator.discountPercent}% off!`,
        creator,
      };
    }
  } catch {
    // fall through to mock check below
  }
  const mock = mockCreators.find((c) => c.promoCode === normalized);
  if (mock) {
    return { success: true, message: `Applied ${mock.name}'s Creator Code: ${mock.discountPercent}% off!`, creator: mock };
  }
  return { success: false, message: 'Invalid or expired Creator Promo Code.' };
}

// ---------- Reviews ----------

export async function fetchReviewsForProduct(productId: string): Promise<ProductReview[]> {
  const loader = async (): Promise<ProductReview[]> => {
    const sb = getSupabase();
    if (!sb) return mockReviews.filter((r) => r.productId === productId);
    const { data, error } = await sb
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    if (error || !data || data.length === 0) {
      return mockReviews.filter((r) => r.productId === productId);
    }
    return (data as AnyRow[]).map(mapReview);
  };
  try {
    return await cacheGetOrLoad<ProductReview[]>(
      cacheKeys.productReviews(productId),
      TTL.productReviews,
      loader,
    );
  } catch {
    return mockReviews.filter((r) => r.productId === productId);
  }
}

export async function submitReview(input: Omit<ProductReview, 'id' | 'date' | 'helpfulCount'>): Promise<ProductReview> {
  const sb = getSupabase();
  const fallback: ProductReview = {
    ...input,
    id: `rev-${Date.now()}`,
    date: 'Just now',
    helpfulCount: 1,
  };
  if (!sb) return fallback;
  const { data, error } = await sb
    .from('reviews')
    .insert({
      id: `rev-${Date.now()}`,
      product_id: input.productId,
      product_sku: input.productSku ?? null,
      author_name: input.authorName,
      author_avatar: input.authorAvatar ?? '',
      rating: input.rating,
      title: input.title,
      comment: input.comment,
      verified_purchase: input.verifiedPurchase,
      city: input.city ?? null,
      skin_type: input.skinType ?? null,
      photo_url: input.photoUrl ?? null,
    })
    .select('*')
    .single();
  if (error || !data) return fallback;
  return mapReview(data as AnyRow);
}

// ---------- Community ----------

export async function fetchCommunityFeed(): Promise<CommunityPost[]> {
  const loader = async (): Promise<CommunityPost[]> => {
    const sb = getSupabase();
    if (!sb) return mockPosts;
    const { data, error } = await sb
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error || !data || data.length === 0) return mockPosts;
    return (data as AnyRow[]).map(mapPost);
  };
  try {
    return await cacheGetOrLoad<CommunityPost[]>(cacheKeys.communityFeed, TTL.communityFeed, loader);
  } catch {
    return mockPosts;
  }
}

export async function fetchPostsForProduct(productId: string, hashtag?: string): Promise<CommunityPost[]> {
  const feed = await fetchCommunityFeed();
  return feed.filter(
    (p) =>
      p.taggedProductId === productId ||
      (hashtag != null && hashtag !== '' && p.taggedProductHashtag?.toLowerCase() === hashtag.toLowerCase()),
  );
}

// ---------- Orders (writes go straight to Supabase, no mock persistence) ----------

export interface CreateOrderInput {
  items: { productId: string; productName: string; brand: string; size: string; price: number; quantity: number; image: string }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  fulfillmentType: 'local' | 'central';
  distributorCity?: string;
  paymentMethod: string;
  shippingAddress: { name: string; street: string; city: string; state: string; phone: string };
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const sb = getSupabase();
  const id = `DES-${Math.floor(100000 + Math.random() * 900000)}`;
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const trackingSteps: Order['trackingSteps'] = [
    { title: 'Order Confirmed', timestamp: 'Just now', status: 'completed', description: 'Payment authorized' },
    {
      title: `Assigned to Verified ${input.distributorCity ?? 'Lagos'} Partner`,
      timestamp: 'Pending local fulfillment',
      status: 'current',
      description: `Allocated to local partner in ${input.distributorCity ?? 'Lagos'} for same-day dispatch`,
    },
    { title: 'Out for Delivery', timestamp: 'Upcoming', status: 'upcoming', description: 'Local courier dispatch' },
    { title: 'Delivered & Authentic Verification', timestamp: 'Upcoming', status: 'upcoming', description: 'Scan QR on box to verify batch' },
  ];
  const fallback: Order = {
    id,
    date,
    status: 'Processing',
    items: input.items,
    subtotal: input.subtotal,
    deliveryFee: input.deliveryFee,
    total: input.total,
    fulfillmentType: input.fulfillmentType,
    distributorCity: input.distributorCity,
    trackingSteps,
    shippingAddress: input.shippingAddress,
    paymentMethod: input.paymentMethod,
  };
  if (!sb) return fallback;
  const { error } = await sb.from('orders').insert({
    id,
    status: 'Processing',
    subtotal: input.subtotal,
    delivery_fee: input.deliveryFee,
    total: input.total,
    fulfillment_type: input.fulfillmentType,
    distributor_city: input.distributorCity ?? null,
    payment_method: input.paymentMethod,
    shipping_address: input.shippingAddress,
  });
  if (error) return fallback;
  await sb.from('order_items').insert(
    input.items.map((i) => ({
      order_id: id,
      product_id: i.productId,
      product_name: i.productName,
      brand: i.brand,
      size: i.size,
      price: i.price,
      quantity: i.quantity,
      image_url: i.image,
    })),
  );
  await sb.from('tracking_steps').insert(
    trackingSteps.map((s, position) => ({ order_id: id, position, ...s })),
  );
  return fallback;
}

// ---------- Authenticity ----------

export async function verifyAuthenticityCode(
  code: string,
): Promise<{ valid: boolean; message: string; productId?: string; batch?: string }> {
  const sb = getSupabase();
  if (!sb) {
    const ok = code.trim().toUpperCase().startsWith('DESLA-AUTH');
    return ok
      ? { valid: true, message: 'Demo mode: code format looks authentic. Connect Supabase for batch lookup.', productId: 'des-bo-01' }
      : { valid: false, message: 'Invalid code format.' };
  }
  const { data, error } = await sb
    .from('authenticity_codes')
    .select('code,product_id,batch,is_valid')
    .eq('code', code.trim())
    .single();
  if (error || !data) return { valid: false, message: 'Code not found. Possible counterfeit — contact Desla HQ.' };
  const row = data as AnyRow;
  if (!bool(row.is_valid, true)) return { valid: false, message: 'Code revoked. Possible counterfeit.' };
  await sb
    .from('authenticity_codes')
    .update({ verified_count: num((row as { verified_count?: number }).verified_count, 0) + 1 })
    .eq('code', code.trim());
  return { valid: true, message: `Authentic Desla!™ product (batch ${str(row.batch)}).`, productId: str(row.product_id), batch: str(row.batch) };
}
