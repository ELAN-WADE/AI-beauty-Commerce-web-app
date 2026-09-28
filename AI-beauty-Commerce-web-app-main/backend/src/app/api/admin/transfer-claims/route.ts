import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { api, clientIp, Errors } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requireStaff } from '@/lib/admin';
import { listClaims } from '@/modules/payments/service';

const querySchema = z.object({ status: z.enum(['pending', 'confirmed', 'rejected']).optional() });

/** Admin queue of manual transfer claims (fulfilment ops). */
export const GET = api(async ({ req }) => {
  const rl = checkRateLimit(`admin:${clientIp(req)}`, Limits.admin);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const db = getDb();
  await requireStaff(db);
  const q = querySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  return NextResponse.json({ claims: await listClaims(db, q.status) });
});
