import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requireAuth } from '@/modules/auth/require-auth';
import { getProfile } from '@/modules/users/service';
import { createReview } from '@/modules/reviews/service';
import { createReviewSchema } from '@/modules/reviews/validation';

export const POST = api(async ({ req }) => {
  const rl = checkRateLimit(`review:${clientIp(req)}`, Limits.reviews);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const db = getDb();
  const ctx = await requireAuth(db);
  const input = createReviewSchema.parse(await readJson(req));
  const profile = await getProfile(db, ctx.userId);
  const authorName = profile?.displayName || ctx.email.split('@')[0] || 'Verified customer';
  return NextResponse.json({ review: await createReview(db, { userId: ctx.userId, authorName, ...input }) }, { status: 201 });
});
