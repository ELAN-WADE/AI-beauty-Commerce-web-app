import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, readJson } from '@/lib/errors';
import { requireAuth } from '@/modules/auth/require-auth';
import { getProfile } from '@/modules/users/service';
import { createReview } from '@/modules/reviews/service';
import { createReviewSchema } from '@/modules/reviews/validation';

export const POST = api(async ({ req }) => {
  const db = getDb();
  const ctx = await requireAuth(db);
  const input = createReviewSchema.parse(await readJson(req));
  const profile = await getProfile(db, ctx.userId);
  const authorName = profile?.displayName || ctx.email.split('@')[0] || 'Verified customer';
  return NextResponse.json({ review: await createReview(db, { userId: ctx.userId, authorName, ...input }) }, { status: 201 });
});
