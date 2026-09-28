import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requireStaff } from '@/lib/admin';
import { audit } from '@/modules/audit/service';
import { createCategory } from '@/modules/catalog/service';
import { categorySchema } from '@/modules/catalog/validation';

export const POST = api(async ({ req, requestId }) => {
  const rl = checkRateLimit(`admin:${clientIp(req)}`, Limits.admin);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const db = getDb();
  const ctx = await requireStaff(db);
  const created = await createCategory(db, categorySchema.parse(await readJson(req)));
  await audit(db, { actorId: ctx.userId, action: 'category.create', entityType: 'category', entityId: created.id, after: { name: created.name }, ip: clientIp(req), requestId });
  return NextResponse.json(created, { status: 201 });
});
