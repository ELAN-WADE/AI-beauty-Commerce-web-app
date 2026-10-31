import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requireStaff } from '@/lib/admin';
import { audit } from '@/modules/audit/service';
import { createProduct } from '@/modules/catalog/service';
import { productCreateSchema } from '@/modules/catalog/validation';
import { revalidateStorefront } from '@/lib/storefront-revalidate';
import { desc, eq } from 'drizzle-orm';
import { products, productVariants, categories, brands, productImages } from '@/modules/catalog/schema';

export const GET = api(async () => {
  const db = getDb();
  await requireStaff(db);
  const [items, variants, categoryRows, brandRows, images] = await Promise.all([
    db.select().from(products).orderBy(desc(products.updatedAt)).limit(300),
    db.select().from(productVariants).limit(3000), db.select().from(categories).limit(500),
    db.select().from(brands).limit(500), db.select().from(productImages).limit(3000),
  ]);
  return NextResponse.json({ products: items.map(p => ({ ...p, variants: variants.filter(v => v.productId === p.id), images: images.filter(i => i.productId === p.id) })), categories: categoryRows, brands: brandRows }, { headers: { 'Cache-Control': 'no-store' } });
});

export const POST = api(async ({ req, requestId }) => {
  const rl = checkRateLimit(`admin:${clientIp(req)}`, Limits.admin);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const db = getDb();
  const ctx = await requireStaff(db);
  const input = productCreateSchema.parse(await readJson(req));
  const created = await createProduct(db, input);
  await audit(db, { actorId: ctx.userId, action: 'product.create', entityType: 'product', entityId: created.id, after: { slug: created.slug, variants: created.variantIds.length }, ip: clientIp(req), requestId });
  // Phase 2: new product → home/catalogue ISR refresh on next hit.
  revalidateStorefront(created.slug);
  return NextResponse.json(created, { status: 201 });
});
