import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, readJson } from '@/lib/errors';
import { requireAuth } from '@/modules/auth/require-auth';
import { listRecent, recordView } from '@/modules/cart/service';
import { recordViewSchema } from '@/modules/cart/validation';

export const GET = api(async () => {
  const db = getDb();
  const ctx = await requireAuth(db);
  return NextResponse.json({ recentlyViewed: await listRecent(db, ctx.userId) });
});

export const POST = api(async ({ req }) => {
  const db = getDb();
  const ctx = await requireAuth(db);
  const input = recordViewSchema.parse(await readJson(req));
  return NextResponse.json({ recentlyViewed: await recordView(db, ctx.userId, input.productId) }, { status: 201 });
});
