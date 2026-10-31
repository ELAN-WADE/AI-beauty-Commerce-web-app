import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Db } from '@/db/client';
import { Errors } from '@/lib/errors';
import { products } from '@/modules/catalog/schema';
import { users } from '@/modules/auth/schema';
import { communityPosts } from '@/modules/community/schema';
import { profiles } from '@/modules/users/schema';
import { audit } from '@/modules/audit/service';
import { workspaceRecords } from './schema';
export const adminPostSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  mediaType: z.enum(['image', 'video']).optional(),
  mediaUrl: z.string().url().max(2000).refine(url => /^https?:\/\//.test(url)).optional(),
  productSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
}).strict().refine(input => Boolean(input.mediaType) === Boolean(input.mediaUrl), 'Choose a media type and a saved media URL together.');
export async function publishAdminPost(db: Db, actorId: string, input: z.infer<typeof adminPostSchema>, key: string) {
  return db.transaction(async tx => {
    await tx.select({ id: users.id }).from(users).where(eq(users.id, actorId)).for('update');
    const scopedKey = 'admin-post:' + actorId + ':' + key;
    const [existing] = await tx.select().from(workspaceRecords).where(eq(workspaceRecords.idempotencyKey, scopedKey));
    if (existing) {
      if (existing.body !== JSON.stringify(input)) throw Errors.conflict('This publish request was already used for different content.');
      return { id: existing.data.communityPostId!, replay: true };
    }
    const [profile] = await tx.select().from(profiles).where(eq(profiles.userId, actorId));
    if (!profile?.displayName) throw Errors.badRequest('Save your account display name before publishing.');
    const [product] = input.productSlug ? await tx.select({ id: products.id }).from(products).where(and(eq(products.slug, input.productSlug), eq(products.isActive, true))) : [];
    if (input.productSlug && !product) throw Errors.badRequest('Select a currently published product.');
    const [post] = await tx.insert(communityPosts).values({ userId: actorId, authorName: profile.displayName, authorAvatar: profile.avatarUrl || '', authorRole: 'Member', content: input.content, mediaType: input.mediaType, mediaUrl: input.mediaUrl, taggedProductId: product?.id, rewardEligible: false, mediaVerified: false }).returning({ id: communityPosts.id });
    await tx.insert(workspaceRecords).values({ audience: 'ALL', kind: 'CMS', title: 'Community publication', body: JSON.stringify(input), status: 'PUBLISHED', idempotencyKey: scopedKey, data: { communityPostId: post.id } });
    await audit(tx, { actorId, action: 'community.post.publish', entityType: 'community_post', entityId: post.id });
    return { id: post.id, replay: false };
  });
}
