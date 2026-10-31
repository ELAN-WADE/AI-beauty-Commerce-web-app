import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { api, Errors, readJson } from '@/lib/errors';
import { checkSharedRateLimit, Limits } from '@/lib/rate-limit';
import { requireAuth } from '@/modules/auth/require-auth';
import { runSyncCart } from '@/app/actions/_shared';

const inputSchema = z.object({
  expectedUserId: z.string().uuid().optional(),
  items: z.array(z.object({ productId: z.string().trim().min(1).max(120), size: z.string().trim().min(1).max(100), quantity: z.number().int().min(1).max(99) }).strict()).max(100),
}).strict();
export const POST = api(async ({ req }) => {
  const db = getDb();
  const auth = await requireAuth(db);
  const input = inputSchema.parse(await readJson(req));
  if (input.expectedUserId && input.expectedUserId !== auth.userId) throw Errors.conflict('Your account changed. Refresh your bag before continuing.');
  if (!(await checkSharedRateLimit(db, 'action:cart:' + auth.userId, Limits.catalog)).allowed) throw Errors.rateLimited(60);
  const cart = await runSyncCart(db, { userId: auth.userId }, input.items);
  return NextResponse.json({ ...cart, ownerId: auth.userId }, { headers: { 'Cache-Control': 'no-store' } });
});
