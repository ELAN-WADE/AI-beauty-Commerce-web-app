/**
 * Phase 2 — on-demand ISR invalidation for the storefront.
 *
 * Time-based `revalidate` alone would serve stale prices/stock for up to an
 * hour after an admin change (the catalogue prices in integer kobo with
 * row-locked stock — staleness here costs money). So every admin write that
 * changes what shoppers see calls `revalidateStorefront()` *after* commit:
 * time-based revalidation stays only as a safety net.
 *
 * All helpers are best-effort and never throw into admin API responses.
 */
import { revalidatePath, revalidateTag } from 'next/cache';
import { eq } from 'drizzle-orm';
import type { AppDb } from '@/db/client';
import { productVariants, products } from '@/modules/catalog/schema';

export type SyncEvent = { type: 'CATALOG_UPDATE'; slug?: string | null; timestamp: number };
type SyncListener = (event: SyncEvent) => void;

// In-memory set of connected clients for live SSE revalidation
const listeners = new Set<SyncListener>();

export function subscribeStorefrontSync(listener: SyncListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function broadcastStorefrontSync(slug?: string | null): void {
  const event: SyncEvent = {
    type: 'CATALOG_UPDATE',
    slug: slug ?? null,
    timestamp: Date.now(),
  };
  for (const listener of listeners) {
    try {
      listener(event);
    } catch {
      // client disconnected
    }
  }
}

export function revalidateStorefront(slug?: string | null): void {
  for (const tag of ['public-catalogue', 'public-editorial']) {
    try { revalidateTag(tag); } catch { /* TTL remains the fallback outside a Next request. */ }
  }
  for (const path of ['/', '/catalogue']) {
    try {
      revalidatePath(path);
    } catch {
      // Prerender/edge context without cache access — time-based fallback covers it.
    }
  }
  const clean = (slug ?? '').trim().toLowerCase();
  if (clean) {
    try {
      revalidatePath(`/products/${encodeURIComponent(clean)}`);
    } catch {
      // ignore — see above
    }
  }
  // Broadcast live sync signal to all open storefront client tabs
  broadcastStorefrontSync(clean || null);
}

/** Resolve a product slug from a variant id (inventory adjusts only know variants). */
export async function slugForVariant(db: AppDb, variantId: string): Promise<string | null> {
  try {
    const rows = await db
      .select({ slug: products.slug })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(eq(productVariants.id, variantId))
      .limit(1);
    return rows[0]?.slug ?? null;
  } catch {
    return null;
  }
}
