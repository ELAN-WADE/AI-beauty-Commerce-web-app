/**
 * Phase 2 — server-side catalogue reads (Server Components only).
 *
 * Why this file exists (low-bandwidth strategy):
 * - The SPA fetched the catalogue over HTTP *after* booting React (up to 5
 *   sequential `/api/products` pages on 3G-costly roundtrips, with a mock-data
 *   flash first). These helpers read the SAME Drizzle services directly inside
 *   Server Components: one indexed DB query per page render, zero HTTP hops,
 *   and the HTML/RSC payload already carries real products on first paint.
 * - NEVER import this file from a `'use client'` component (it pulls in the
 *   DB driver). Server `page.tsx` files map the result onto the storefront
 *   `Product` type and pass plain JSON down as props.
 * - React cache coalesces identical layout/page/metadata reads within a server
 *   render. It does not keep prices or availability across requests.
 * - An unavailable DB produces an empty result, never fabricated products.
 */
import { eq } from 'drizzle-orm';
import { cache } from 'react';
import { getDb, type AppDb } from '@/db/client';
import {
  getProduct,
  listProducts,
  type PublicProduct,
} from '@/modules/catalog/service';
import { products } from '@/modules/catalog/schema';
import type { Product as StorefrontProduct } from '@/storefront/types';

/** Same mapping as the client `mapOwned` — kept in sync by typecheck. */
export function toStorefrontProduct(o: PublicProduct): StorefrontProduct {
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

/** Null when no DB is configured/reachable — callers fall back, never throw. */
function resolveDb(explicit?: AppDb): AppDb | null {
  if (explicit) return explicit;
  try {
    return getDb();
  } catch {
    return null;
  }
}

/**
 * Full catalogue seed for first paint (mirrors the client keyset loop:
 * newest-first, max 5 pages × `limit`). Plain JSON, safe to pass as props.
 * Pass `db` in tests; pages omit it and use the pooled client.
 */
async function readCatalogSeed(limit = 100, db?: AppDb): Promise<StorefrontProduct[]> {
  try {
    const client = resolveDb(db);
    if (!client) return [];
    const items: PublicProduct[] = [];
    let cursor: string | null | undefined;
    for (let page = 0; page < 5; page++) {
      const res = await listProducts(client, {
        sort: 'newest',
        limit,
        ...(cursor ? { cursor } : {}),
      });
      items.push(...res.items);
      cursor = res.nextCursor;
      if (!cursor) break;
    }
    return items.map(toStorefrontProduct);
  } catch {
    return [];
  }
}

export const getCatalogSeed = cache(readCatalogSeed);

/** Single-product seed + metadata source. `null` = product unavailable. */
async function readProductSeed(slug: string, db?: AppDb): Promise<StorefrontProduct | null> {
  try {
    const client = resolveDb(db);
    if (!client) return null;
    const item = await getProduct(client, slug.toLowerCase());
    return toStorefrontProduct(item);
  } catch {
    return null;
  }
}

export const getProductSeed = cache(readProductSeed);

/** Slugs for `generateStaticParams` (capped; unknown slugs render on demand). */
export async function listProductSlugs(limit = 1000, db?: AppDb): Promise<string[]> {
  try {
    const client = resolveDb(db);
    if (!client) return [];
    const rows = await client
      .select({ slug: products.slug })
      .from(products)
      .where(eq(products.isActive, true))
      .limit(limit);
    return rows.map((r) => r.slug);
  } catch {
    return [];
  }
}
