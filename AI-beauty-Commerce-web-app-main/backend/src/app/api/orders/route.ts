import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { api } from '@/lib/errors';
import { requireAuth } from '@/modules/auth/require-auth';
import { listOwnOrders } from '@/modules/orders/service';

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).default(20).transform((v) => Math.min(v, 100)),
  cursor: z.string().max(500).optional(),
});

export const GET = api(async ({ req }) => {
  const db = getDb();
  const ctx = await requireAuth(db);
  const q = querySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  return NextResponse.json(await listOwnOrders(db, ctx.userId, q.limit, q.cursor));
});
