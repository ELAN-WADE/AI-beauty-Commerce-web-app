'use server';

/**
 * Phase 5 — engagement Server Actions (reviews, wishlist, loyalty, skin).
 *
 * Single-attempt semantics: all storefront callers treat these as
 * fire-and-forget mirrors (today's REST `.catch(() => null)`), EXCEPT loyalty
 * redeem which surfaces errors. There is deliberately NO REST fallback here:
 * these services are not idempotent (a retried review/like/skin-write would
 * duplicate), and a dropped mirror degrades to the same silence as a failed
 * REST call today. Reads stay REST (cacheable GETs).
 *
 * One behavior fix vs REST: review submit accepts a product slug OR uuid
 * (the REST zod required uuid-only, so storefront slug submits 422'd
 * silently). Resolution goes through the same `resolveProductId`.
 */
import { z } from 'zod';
import { getDb } from '@/db/client';
import { checkRateLimit, checkSharedRateLimit, Limits } from '@/lib/rate-limit';
import { requireAuth } from '@/modules/auth/require-auth';
import { getProfile } from '@/modules/users/service';
import { createReview, resolveProductId } from '@/modules/reviews/service';
import { createReviewSchema } from '@/modules/reviews/validation';
import { addWishlist, removeWishlist } from '@/modules/cart/service';
import { wishlistAddSchema } from '@/modules/cart/validation';
import { redeemToVoucher } from '@/modules/loyalty/service';
import { redeemSchema } from '@/modules/loyalty/validation';
import { upsertSkinProfile } from '@/modules/skin/service';
import { skinProfileSchema } from '@/modules/skin/validation';
import { getProduct } from '@/modules/catalog/service';
import { toActionFailure, type ActionResult } from './_shared';

async function authorNameFor(userId: string, email: string): Promise<string> {
  const profile = await getProfile(getDb(), userId).catch(() => null);
  return profile?.displayName || email.split('@')[0] || 'Member';
}

export async function submitReviewAction(input: {
  productId: string;
  rating: number;
  title: string;
  comment: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const db = getDb();
    const ctx = await requireAuth(db);
    // User-keyed (shared mobile NATs must not throttle innocent neighbors).
    if (!checkRateLimit(`action:review:${ctx.userId}`, Limits.reviews).allowed) {
      return { ok: false, status: 429, code: 'rate_limited', message: 'Too many reviews. Slow down and try again.' };
    }
    const parsed = createReviewSchema
      .extend({ productId: z.string().trim().min(1).max(120) })
      .parse(input);
    const productId = await resolveProductId(db, parsed.productId);
    const review = await createReview(db, {
      userId: ctx.userId,
      authorName: await authorNameFor(ctx.userId, ctx.email),
      productId,
      rating: parsed.rating,
      title: parsed.title,
      comment: parsed.comment,
    });
    return { ok: true, data: { id: review.id } };
  } catch (err) {
    const f = toActionFailure(err);
    return { ok: false, ...f };
  }
}

export async function toggleWishlistAction(input: {
  slug: string;
  sizeLabel?: string;
  wished: boolean;
}): Promise<ActionResult<{ wished: boolean }>> {
  try {
    const db = getDb();
    const ctx = await requireAuth(db);
    if (!checkRateLimit(`action:wishlist:${ctx.userId}`, Limits.wishlist).allowed) {
      return { ok: false, status: 429, code: 'rate_limited', message: 'Too many requests. Slow down and try again.' };
    }
    const slug = z.string().trim().min(1).max(120).parse(input.slug);
    // Server-side variant resolution (kills the client's detail-fetch roundtrip).
    const detail = await getProduct(db, slug.toLowerCase());
    if (detail.variants.length === 0) return { ok: false, status: 404, code: 'not_found', message: 'Product not found.' };
    const want = (input.sizeLabel ?? '').trim().toLowerCase();
    const variant =
      detail.variants.find((v) => v.sizeLabel.toLowerCase() === want) ?? detail.variants[0];
    const { variantId } = wishlistAddSchema.parse({ variantId: variant.id });
    if (input.wished) await addWishlist(db, ctx.userId, variantId);
    else await removeWishlist(db, ctx.userId, variantId);
    return { ok: true, data: { wished: input.wished } };
  } catch (err) {
    const f = toActionFailure(err);
    return { ok: false, ...f };
  }
}

export async function redeemVoucherAction(
  points: number,
): Promise<ActionResult<{ code: string; amountKobo: number; status: string }>> {
  try {
    const db = getDb();
    const ctx = await requireAuth(db);
    // Money-adjacent: shared DB quota so multi-instance deploys enforce one budget.
    // Shared namespace with POST /api/me/loyalty.
    const rl = await checkSharedRateLimit(db, `loyalty:${ctx.userId}`, Limits.loyaltyRedeem);
    if (!rl.allowed) {
      return { ok: false, status: 429, code: 'rate_limited', message: 'Too many redemptions. Wait a while and try again.' };
    }
    const parsed = redeemSchema.parse({ points });
    const voucher = await redeemToVoucher(db, ctx.userId, parsed.points);
    return { ok: true, data: { code: voucher.code, amountKobo: voucher.amountKobo, status: voucher.status } };
  } catch (err) {
    const f = toActionFailure(err);
    return { ok: false, ...f };
  }
}

export async function saveSkinProfileAction(input: {
  skinType: string;
  concerns: string[];
}): Promise<ActionResult<{ ok: true }>> {
  try {
    const db = getDb();
    const ctx = await requireAuth(db);
    if (!checkRateLimit(`action:skin:${ctx.userId}`, Limits.reviews).allowed) {
      return { ok: false, status: 429, code: 'rate_limited', message: 'Too many requests. Slow down and try again.' };
    }
    const parsed = skinProfileSchema.parse({ skinType: input.skinType.trim().toLowerCase(), concerns: input.concerns.slice(0, 12), notes: '' });
    await upsertSkinProfile(db, ctx.userId, parsed);
    return { ok: true, data: { ok: true as const } };
  } catch (err) {
    const f = toActionFailure(err);
    return { ok: false, ...f };
  }
}
