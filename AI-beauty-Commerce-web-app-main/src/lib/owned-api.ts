// Owned-backend catalogue client (Glowly S2). Strangler pattern: when
// VITE_API_URL is set, the storefront reads the owned Next.js API; otherwise
// it keeps running on local mocks. Never throws — null means "use fallback".
import type { Product } from '../types';
import { products as mockProducts } from '../data/products';

const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '');

export const isOwnedApiConfigured = Boolean(BASE);

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

export function mockCatalog(): Product[] {
  return mockProducts;
}
