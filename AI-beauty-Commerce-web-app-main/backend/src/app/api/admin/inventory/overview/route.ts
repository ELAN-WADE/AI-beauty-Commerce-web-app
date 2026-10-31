import { eq, desc } from 'drizzle-orm';
import { inventoryLocations, stockLevels, inventoryMovements, stockTransfers } from '@/modules/inventory/schema';
import { productVariants, products } from '@/modules/catalog/schema';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { api, clientIp, Errors } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requirePerm } from '@/lib/admin';
import { listProducts } from '@/modules/catalog/service';

/**
 * Central stock overview for the console inventory tab: full product graph
 * with live availability per variant (reuses the public hydrator — same
 * numbers the storefront sees, no second source of truth).
 */
const querySchema = z.object({
  limit: z.coerce.number().int().min(1).default(50).transform((v) => Math.min(v, 100)),
});

export const GET = api(async ({ req }) => {
  const rl = checkRateLimit(`admin:${clientIp(req)}`, Limits.admin);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const db = getDb();
  await requirePerm(db, 'inventory:write');
  const q = querySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  const page = await listProducts(db, { sort: 'newest', limit: q.limit });
  const [locations, matrix, movements, transfers] = await Promise.all([
    db.select().from(inventoryLocations).limit(200),
    db.select({ variantId: productVariants.id, sku: productVariants.sku, productName: products.name, locationId: stockLevels.locationId, pool: stockLevels.pool, onHand: stockLevels.onHand, reserved: stockLevels.reserved }).from(productVariants).innerJoin(products, eq(products.id, productVariants.productId)).leftJoin(stockLevels, eq(stockLevels.variantId, productVariants.id)).limit(2000),
    db.select().from(inventoryMovements).orderBy(desc(inventoryMovements.createdAt)).limit(100),
    db.select().from(stockTransfers).orderBy(desc(stockTransfers.dispatchedAt)).limit(100),
  ]);
  return NextResponse.json({ locations, matrix, movements, transfers,
    items: page.items.map((p) => ({
      slug: p.slug,
      name: p.name,
      variants: p.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        sizeLabel: v.sizeLabel,
        priceKobo: v.priceKobo,
        available: v.available,
      })),
      totalAvailable: p.totalAvailable,
    })),
    nextCursor: page.nextCursor,
  });
});
