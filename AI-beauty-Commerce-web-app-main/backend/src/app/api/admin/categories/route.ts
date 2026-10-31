import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { categories, products } from '@/modules/catalog/schema';
import { revalidateStorefront } from '@/lib/storefront-revalidate';
import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requirePerm } from '@/lib/admin';
import { audit } from '@/modules/audit/service';
import { createCategory } from '@/modules/catalog/service';
import { categorySchema } from '@/modules/catalog/validation';

export const POST = api(async ({ req, requestId }) => {
  const rl = checkRateLimit(`admin:${clientIp(req)}`, Limits.admin);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const db = getDb();
  const ctx = await requirePerm(db, 'products:write');
  const created = await createCategory(db, categorySchema.parse(await readJson(req)));
  await audit(db, { actorId: ctx.userId, action: 'category.create', entityType: 'category', entityId: created.id, after: { name: created.name }, ip: clientIp(req), requestId });
  revalidateStorefront();
  return NextResponse.json(created, { status: 201 });
});

export const DELETE = api(async ({ req, requestId }) => {
  const db = getDb(); const actor = await requirePerm(db, 'products:write');
  const { id } = z.object({ id: z.string().uuid() }).strict().parse(await readJson(req));
  await db.transaction(async tx => {
    const [category] = await tx.select().from(categories).where(eq(categories.id, id)).for('update');
    if (!category) throw Errors.notFound('Category not found.');
    const [product] = await tx.select({ id: products.id }).from(products).where(eq(products.categoryId, id)).limit(1);
    const [child] = await tx.select({ id: categories.id }).from(categories).where(eq(categories.parentId, id)).limit(1);
    if (product || child) throw Errors.conflict('Move products and child categories before deleting this category.');
    await tx.delete(categories).where(eq(categories.id, id));
    await audit(tx, { actorId: actor.userId, action: 'category.delete', entityType: 'category', entityId: id, before: { name: category.name }, requestId });
  });
  revalidateStorefront();
  return NextResponse.json({ deleted: true });
});
