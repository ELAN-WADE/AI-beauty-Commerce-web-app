import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requireStaff } from '@/lib/admin';
import { createCategory } from '@/modules/catalog/service';
import { categorySchema } from '@/modules/catalog/validation';

export const POST = api(async ({ req }) => {
  const rl = checkRateLimit(`admin:${clientIp(req)}`, Limits.admin);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const db = getDb();
  await requireStaff(db);
  const created = await createCategory(db, categorySchema.parse(await readJson(req)));
  return NextResponse.json(created, { status: 201 });
});
