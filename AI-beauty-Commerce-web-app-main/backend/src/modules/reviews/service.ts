import { and, desc, eq, or, sql } from 'drizzle-orm';
import type { AppDb, Db } from '../../db/client';
import { Errors } from '../../lib/errors';
import { products } from '../catalog/schema';
import { orderItems } from '../orders/schema';
import { orders } from '../orders/schema';
import { productVariants } from '../catalog/schema';
import { reviewHelpful, reviews } from './schema';
import type { CreateReviewInput } from './validation';

/** Verified = paid, non-cancelled order containing the product (server-checked). */
export async function hasVerifiedPurchase(db: Db, userId: string, productId: string): Promise<{ verified: boolean; orderId: string | null }> {
  const rows = await db
    .select({ orderId: orders.id })
    .from(orders)
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .innerJoin(productVariants, eq(orderItems.variantId, productVariants.id))
    .where(
      and(
        eq(orders.userId, userId),
        eq(productVariants.productId, productId),
        eq(orders.paymentStatus, 'PAID'),
      ),
    )
    .limit(1);
  return rows[0] ? { verified: true, orderId: rows[0].orderId } : { verified: false, orderId: null };
}

/** Recompute denormalized counters from approved reviews (single writer pattern). */
export async function recomputeAggregate(db: Db, productId: string): Promise<void> {
  const rows = await db
    .select({ count: sql<number>`count(*)`, avg: sql<string | null>`avg(${reviews.rating})` })
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.status, 'approved')));
  const count = Number(rows[0]?.count ?? 0);
  const avg = rows[0]?.avg === null || rows[0]?.avg === undefined ? '0' : String(Number(rows[0].avg).toFixed(2));
  await db.update(products).set({ reviewsCount: count, rating: avg, updatedAt: new Date() }).where(eq(products.id, productId));
}

/** Accept a uuid or a storefront slug; rejects inactive products. */
export async function resolveProductId(db: Db, slugOrId: string): Promise<string> {
  const rows = await db
    .select({ id: products.id, isActive: products.isActive })
    .from(products)
    .where(or(eq(products.id, slugOrId), eq(products.slug, slugOrId.toLowerCase())))
    .limit(1);
  const p = rows[0];
  if (!p || !p.isActive) throw Errors.notFound('Product not found.');
  return p.id;
}

export async function createReview(db: AppDb, input: { userId: string; authorName: string } & CreateReviewInput) {
  return db.transaction(async (tx) => {
    const productId = await resolveProductId(tx, input.productId);
    const { verified, orderId } = await hasVerifiedPurchase(tx, input.userId, productId);
    const [review] = await tx
      .insert(reviews)
      .values({
        productId,
        userId: input.userId,
        orderId,
        authorName: input.authorName,
        rating: input.rating,
        title: input.title,
        comment: input.comment,
        verifiedPurchase: verified,
        status: verified ? 'approved' : 'pending',
      })
      .returning();
    if (verified) await recomputeAggregate(tx, productId);
    return review;
  });
}

export async function listApproved(db: Db, productId: string, limit = 20) {
  const lim = Math.min(50, Math.max(1, limit));
  return db.select().from(reviews).where(and(eq(reviews.productId, productId), eq(reviews.status, 'approved'))).orderBy(desc(reviews.createdAt)).limit(lim);
}

export async function listApprovedBySlug(db: Db, slug: string, limit = 20) {
  const p = await db.select({ id: products.id }).from(products).where(eq(products.slug, slug.toLowerCase())).limit(1);
  if (!p[0]) throw Errors.notFound('Product not found.');
  return listApproved(db, p[0].id, limit);
}

export async function toggleHelpful(db: AppDb, userId: string, reviewId: string) {
  return db.transaction(async (tx) => {
    const rows = await tx.select().from(reviews).where(eq(reviews.id, reviewId)).limit(1);
    const review = rows[0];
    if (!review || review.status !== 'approved') throw Errors.notFound('Review not found.');
    const voted = await tx.select().from(reviewHelpful).where(and(eq(reviewHelpful.reviewId, reviewId), eq(reviewHelpful.userId, userId))).limit(1);
    if (voted[0]) {
      await tx.delete(reviewHelpful).where(and(eq(reviewHelpful.reviewId, reviewId), eq(reviewHelpful.userId, userId)));
      const next = Math.max(0, review.helpfulCount - 1);
      await tx.update(reviews).set({ helpfulCount: next }).where(eq(reviews.id, reviewId));
      return { helpfulCount: next, voted: false };
    }
    await tx.insert(reviewHelpful).values({ reviewId, userId });
    await tx.update(reviews).set({ helpfulCount: review.helpfulCount + 1 }).where(eq(reviews.id, reviewId));
    return { helpfulCount: review.helpfulCount + 1, voted: true };
  });
}

export async function moderateReview(db: AppDb, reviewId: string, status: 'approved' | 'rejected') {
  return db.transaction(async (tx) => {
    const [review] = await tx.update(reviews).set({ status, updatedAt: new Date() }).where(eq(reviews.id, reviewId)).returning();
    if (!review) throw Errors.notFound('Review not found.');
    await recomputeAggregate(tx, review.productId);
    return review;
  });
}

export async function listForModeration(db: AppDb, status?: string, limit = 20) {
  const lim = Math.min(100, Math.max(1, limit));
  return db
    .select()
    .from(reviews)
    .where(status ? eq(reviews.status, status) : undefined)
    .orderBy(desc(reviews.createdAt))
    .limit(lim);
}
