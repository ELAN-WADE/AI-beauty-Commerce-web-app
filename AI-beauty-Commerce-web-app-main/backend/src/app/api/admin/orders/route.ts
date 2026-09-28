import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { api, clientIp, Errors } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requirePerm } from '@/lib/admin';
import { listAllOrders } from '@/modules/orders/service';
import { orderStatusSchema } from '@/modules/cart/validation';

const querySchema = z.object({
  status: orderStatusSchema.shape.status.optional(),
  limit: z.coerce.number().int().min(1).default(20).transform((v) => Math.min(v, 100)),
});

export const GET = api(async ({ req }) => {
  const rl = checkRateLimit(`admin:${clientIp(req)}`, Limits.admin);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const db = getDb();
  await requirePerm(db, 'orders:read:all');
  const q = querySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  return NextResponse.json(await listAllOrders(db, q));
});
