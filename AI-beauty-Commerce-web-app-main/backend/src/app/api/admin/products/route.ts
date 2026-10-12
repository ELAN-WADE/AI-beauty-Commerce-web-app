import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requireStaff } from '@/lib/admin';
import { audit } from '@/modules/audit/service';
import { createProduct } from '@/modules/catalog/service';
import { productCreateSchema } from '@/modules/catalog/validation';
import { revalidateStorefront } from '@/lib/storefront-revalidate';

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
