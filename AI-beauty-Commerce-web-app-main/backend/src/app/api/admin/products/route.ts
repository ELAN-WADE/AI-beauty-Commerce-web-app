import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requireStaff } from '@/lib/admin';
import { createProduct } from '@/modules/catalog/service';
import { productCreateSchema } from '@/modules/catalog/validation';

export const POST = api(async ({ req }) => {
  const rl = checkRateLimit(`admin:${clientIp(req)}`, Limits.admin);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const db = getDb();
  await requireStaff(db);
  const input = productCreateSchema.parse(await readJson(req));
  const created = await createProduct(db, input);
  return NextResponse.json(created, { status: 201 });
});
