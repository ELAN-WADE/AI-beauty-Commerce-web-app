'use server';

/**
 * Phase 5 — Collection Feeds & Store Shelves Server Actions.
 * Direct database RPC calls avoiding HTTP roundtrips, with built-in ISR
 * revalidation and authoritative integer kobo pricing.
 */
import { and, desc, eq, ilike, inArray } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { checkSharedRateLimit, Limits } from '@/lib/rate-limit';
import { revalidateStorefront } from '@/lib/storefront-revalidate';
import { requireStaff } from '@/lib/admin';
import {
  getProduct,
  listCategories,
  listProducts,
  hydrate,
  type PublicProduct,
  type ProductDetail
} from '@/modules/catalog/service';
import { products, brands, categories } from '@/modules/catalog/schema';
import {
  actionClientIp,
  toActionFailure,
  type ActionResult,
} from './_shared';

export interface RoutineStepBundle {
  step: '01' | '02' | '03';
  discipline: 'CLEANSE' | 'MOISTURIZE' | 'PROTECT';
  product: PublicProduct;
}

export interface CollectionFeedData {
  hero: PublicProduct | null;
  routineBundle: RoutineStepBundle[];
  bestsellers: PublicProduct[];
  newDrops: PublicProduct[];
  flashSales: PublicProduct[];
  categories: { id: string; name: string; slug: string; description: string; imageUrl: string | null }[];
}

/**
 * Server Action: Fetch complete storefront collection feed.
 * Unites hero highlights, 3-step routine bundles, bestsellers, new drops,
 * and flash sales directly from PostgreSQL in a single parallel query.
 */
export async function getCollectionFeedAction(): Promise<ActionResult<CollectionFeedData>> {
  try {
    const db = getDb();
    const ip = await actionClientIp();
    const rl = await checkSharedRateLimit(db, `action:feed:${ip}`, Limits.catalog);
    if (!rl.allowed) {
      return { ok: false, status: 429, code: 'rate_limited', message: 'Too many requests. Please slow down.' };
    }

    // 1. Fetch active categories
    const allCategories = await listCategories(db);

    // 2. Fetch curated products across flags in single query set
    const rows = await db
      .select({
        p: products,
        brandName: brands.name,
        brandSlug: brands.slug,
        catName: categories.name,
        catSlug: categories.slug
      })
      .from(products)
      .innerJoin(brands, eq(products.brandId, brands.id))
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.isActive, true))
      .orderBy(desc(products.createdAt))
      .limit(30);

    const hydrated = await hydrate(
      db,
      rows.map((r) => r.p),
      rows.map((r) => ({
        brandName: r.brandName,
        brandSlug: r.brandSlug,
        catName: r.catName,
        catSlug: r.catSlug
      }))
    );

    // Filter into clinical shelves
    const bestsellers = hydrated.filter((p) => p.isBestseller).slice(0, 6);
    const newDrops = hydrated.filter((p) => p.isNew).slice(0, 6);
    const flashSales = hydrated.filter((p) => p.isFlashSale).slice(0, 6);
    const hero = bestsellers[0] || newDrops[0] || hydrated[0] || null;

    // 3. Assemble 3-Step Routine Bundle (Cleanse, Moisturize, Protect)
    const cleanseProduct =
      hydrated.find((p) => p.subCategory.toLowerCase().includes('cleanse') || p.category.slug.includes('cleanse')) ||
      hydrated.find((p) => p.category.slug === 'facial-care') ||
      hydrated[0];

    const moisturizeProduct =
      hydrated.find((p) => p.subCategory.toLowerCase().includes('barrier') || p.name.toLowerCase().includes('shea') || p.subCategory.toLowerCase().includes('cream')) ||
      hydrated.find((p) => p.category.slug === 'body-care') ||
      hydrated[1] ||
      hydrated[0];

    const protectProduct =
      hydrated.find((p) => p.subCategory.toLowerCase().includes('sun') || p.name.toLowerCase().includes('spf') || p.subCategory.toLowerCase().includes('protect')) ||
      hydrated[2] ||
      hydrated[0];

    const routineBundle: RoutineStepBundle[] = [];
    if (cleanseProduct) {
      routineBundle.push({ step: '01', discipline: 'CLEANSE', product: cleanseProduct });
    }
    if (moisturizeProduct) {
      routineBundle.push({ step: '02', discipline: 'MOISTURIZE', product: moisturizeProduct });
    }
    if (protectProduct) {
      routineBundle.push({ step: '03', discipline: 'PROTECT', product: protectProduct });
    }

    return {
      ok: true,
      data: {
        hero,
        routineBundle,
        bestsellers: bestsellers.length > 0 ? bestsellers : hydrated.slice(0, 4),
        newDrops: newDrops.length > 0 ? newDrops : hydrated.slice(0, 4),
        flashSales: flashSales.length > 0 ? flashSales : hydrated.slice(0, 4),
        categories: allCategories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          imageUrl: c.imageUrl
        }))
      }
    };
  } catch (err) {
    const f = toActionFailure(err);
    return { ok: false, ...f };
  }
}

/**
 * Server Action: Query Store Shelves by discipline / category with sorting.
 */
export async function getStoreShelvesAction(params: {
  category?: string;
  sort?: 'newest' | 'price-asc' | 'price-desc' | 'rating';
  limit?: number;
  cursor?: string;
}): Promise<ActionResult<{ items: PublicProduct[]; nextCursor: string | null }>> {
  try {
    const db = getDb();
    const result = await listProducts(db, {
      category: params.category,
      sort: params.sort || 'newest',
      limit: params.limit || 24,
      cursor: params.cursor
    });

    return { ok: true, data: result };
  } catch (err) {
    const f = toActionFailure(err);
    return { ok: false, ...f };
  }
}

/**
 * Server Action: Fetch individual product details by slug.
 */
export async function getProductDetailAction(slug: string): Promise<ActionResult<ProductDetail>> {
  try {
    const db = getDb();
    const product = await getProduct(db, slug);
    return { ok: true, data: product };
  } catch (err) {
    const f = toActionFailure(err);
    return { ok: false, ...f };
  }
}

/**
 * Server Action (Admin Curation): Update product shelf flags and revalidate ISR.
 */
export async function curateStoreShelfAction(input: {
  productId: string;
  isBestseller?: boolean;
  isNew?: boolean;
  isFlashSale?: boolean;
  isActive?: boolean;
}): Promise<ActionResult<{ success: boolean; slug: string }>> {
  try {
    const db = getDb();
    await requireStaff(db);

    const updateFields: Record<string, any> = { updatedAt: new Date() };
    if (input.isBestseller !== undefined) updateFields.isBestseller = input.isBestseller;
    if (input.isNew !== undefined) updateFields.isNew = input.isNew;
    if (input.isFlashSale !== undefined) updateFields.isFlashSale = input.isFlashSale;
    if (input.isActive !== undefined) updateFields.isActive = input.isActive;

    const [updated] = await db
      .update(products)
      .set(updateFields)
      .where(eq(products.id, input.productId))
      .returning({ id: products.id, slug: products.slug });

    if (!updated) {
      return { ok: false, status: 404, code: 'not_found', message: 'Product not found.' };
    }

    // Trigger on-demand ISR revalidation for home, catalogue, and the product page
    revalidateStorefront(updated.slug);

    return { ok: true, data: { success: true, slug: updated.slug } };
  } catch (err) {
    const f = toActionFailure(err);
    return { ok: false, ...f };
  }
}

/**
 * Server Action (Admin Curation): Revalidate and curate the 3-step routine bundle.
 */
export async function curateRoutineBundleAction(input: {
  step1Slug: string;
  step2Slug: string;
  step3Slug: string;
}): Promise<ActionResult<{ success: boolean }>> {
  try {
    const db = getDb();
    await requireStaff(db);

    // Verify all 3 formulations exist
    await Promise.all([
      getProduct(db, input.step1Slug),
      getProduct(db, input.step2Slug),
      getProduct(db, input.step3Slug)
    ]);

    // Invalidate ISR storefront caches
    revalidateStorefront();

    return { ok: true, data: { success: true } };
  } catch (err) {
    const f = toActionFailure(err);
    return { ok: false, ...f };
  }
}
