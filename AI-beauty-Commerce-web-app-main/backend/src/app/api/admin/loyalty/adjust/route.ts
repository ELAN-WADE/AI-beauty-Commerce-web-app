import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requireStaff } from '@/lib/admin';
import { adjustPoints } from '@/modules/loyalty/service';
import { adjustPointsSchema } from '@/modules/loyalty/validation';

export const POST = api(async ({ req }) => {
  const rl = checkRateLimit(`admin:${clientIp(req)}`, Limits.admin);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const db = getDb();
  const ctx = await requireStaff(db);
  const input = adjustPointsSchema.parse(await readJson(req));
  return NextResponse.json(await adjustPoints(db, ctx.userId, input));
});
