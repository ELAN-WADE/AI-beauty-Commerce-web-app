import { and, desc, eq, lt, or } from 'drizzle-orm';
import type { AppDb, Db } from '../../db/client';
import { Errors } from '../../lib/errors';
import { decodeCursor, encodeCursor } from '../../lib/cursor';
import { orders } from '../orders/schema';
import { products } from '../catalog/schema';
import { creators } from '../creators/schema';
import { communityMessages, communityPosts, postLikes } from './schema';
import type { createPostSchema } from './validation';
import type { z } from 'zod';

type CreatePostInput = z.infer<typeof createPostSchema>;

async function buyerRole(db: Db, userId: string): Promise<'Verified Buyer' | 'Member'> {
  const rows = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.paymentStatus, 'PAID')))
    .limit(1);
  return rows.length > 0 ? 'Verified Buyer' : 'Member';
}

export async function listPosts(db: Db, filter: { productId?: string; hashtag?: string; limit: number; cursor?: string }) {
  const cursor = decodeCursor(filter.cursor);
  const conds = [eq(communityPosts.visible, true)];
  if (filter.productId) conds.push(eq(communityPosts.taggedProductId, filter.productId));
  if (filter.hashtag) conds.push(eq(communityPosts.taggedHashtag, filter.hashtag.toLowerCase()));
  const rows = await db
    .select()
    .from(communityPosts)
    .where(
      cursor
        ? and(...conds, or(lt(communityPosts.createdAt, new Date(cursor.k)), and(eq(communityPosts.createdAt, new Date(cursor.k)), lt(communityPosts.id, cursor.id))))
        : and(...conds),
    )
    .orderBy(desc(communityPosts.createdAt), desc(communityPosts.id))
    .limit(filter.limit + 1);
  const hasMore = rows.length > filter.limit;
  const page = hasMore ? rows.slice(0, filter.limit) : rows;
  const last = page[page.length - 1];
  return {
    posts: page,
    nextCursor: hasMore && last ? encodeCursor({ k: (last.createdAt as Date).toISOString(), id: last.id }) : null,
  };
}

export async function createPost(db: AppDb, userId: string, author: { name: string; handle?: string; avatar?: string }, input: CreatePostInput) {
  if (input.taggedProductId) {
    const p = await db.select({ id: products.id }).from(products).where(eq(products.id, input.taggedProductId)).limit(1);
    if (!p[0]) throw Errors.notFound('Tagged product not found.');
  }
  const role = await buyerRole(db, userId);
  // Server-side creator link: a verified creator profile owned by the author
  // makes the post reward-attributable. Clients can never set this.
  const [creator] = await db
    .select({ id: creators.id })
    .from(creators)
    .where(and(eq(creators.userId, userId), eq(creators.verified, true)))
    .limit(1);
  const [post] = await db
    .insert(communityPosts)
    .values({
      userId,
      authorName: author.name,
      authorHandle: author.handle ?? '',
      authorAvatar: author.avatar ?? '',
      authorRole: role,
      creatorId: creator?.id ?? null,
      content: input.content,
      mediaType: input.mediaType,
      mediaUrl: input.mediaUrl,
      taggedProductId: input.taggedProductId,
      taggedHashtag: input.taggedHashtag?.toLowerCase(),
    })
    .returning();
  return post;
}

export async function togglePostLike(db: AppDb, userId: string, postId: string) {
  return db.transaction(async (tx) => {
    const rows = await tx.select().from(communityPosts).where(eq(communityPosts.id, postId)).for('update').limit(1);
    const post = rows[0];
    if (!post || !post.visible) throw Errors.notFound('Post not found.');
    const voted = await tx.select().from(postLikes).where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId))).limit(1);
    if (voted[0]) {
      await tx.delete(postLikes).where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
      const next = Math.max(0, post.likesCount - 1);
      await tx.update(communityPosts).set({ likesCount: next }).where(eq(communityPosts.id, postId));
      return { likesCount: next, liked: false };
    }
    await tx.insert(postLikes).values({ postId, userId });
    await tx.update(communityPosts).set({ likesCount: post.likesCount + 1 }).where(eq(communityPosts.id, postId));
    return { likesCount: post.likesCount + 1, liked: true };
  });
}

export async function setPostVisibility(db: AppDb, postId: string, visible: boolean) {
  const [post] = await db.update(communityPosts).set({ visible }).where(eq(communityPosts.id, postId)).returning({ id: communityPosts.id });
  if (!post) throw Errors.notFound('Post not found.');
  return { id: post.id, visible };
}

/**
 * Admin reward gate: only eligible + visible posts settle. Hiding a post
 * (visible=false) pauses future settlement; already-settled windows keep
 * their ledger rows (audit trail) and release net of refunds.
 */
export async function setRewardEligible(db: AppDb, postId: string, eligible: boolean) {
  const [post] = await db
    .update(communityPosts)
    .set({ rewardEligible: eligible })
    .where(eq(communityPosts.id, postId))
    .returning({ id: communityPosts.id });
  if (!post) throw Errors.notFound('Post not found.');
  return { id: post.id, rewardEligible: eligible };
}

export async function listMessages(db: Db, channel: string, limit: number) {
  return db
    .select()
    .from(communityMessages)
    .where(eq(communityMessages.channel, channel))
    .orderBy(desc(communityMessages.createdAt))
    .limit(limit);
}

export async function postMessage(db: AppDb, userId: string, sender: { name: string; avatar?: string }, input: { channel: string; message: string }) {
  const [msg] = await db
    .insert(communityMessages)
    .values({ userId, senderName: sender.name, senderAvatar: sender.avatar ?? '', channel: input.channel, message: input.message })
    .returning();
  return msg;
}
