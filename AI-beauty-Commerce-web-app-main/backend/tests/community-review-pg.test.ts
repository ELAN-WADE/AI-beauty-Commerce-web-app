import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from '@/db/schema';
import { createPost, listPosts, listModerationPosts, setPostVisibility, togglePostLike } from '@/modules/community/service';
import { communityPostFromApi } from '@/storefront/lib/community-data';
import { createReview, hasVerifiedPurchase, listApprovedBySlug, moderateReview } from '@/modules/reviews/service';
import { HQ_LOCATION_ID } from '@/modules/inventory/schema';
import { eq } from 'drizzle-orm';
let client: PGlite, db: ReturnType<typeof drizzle<typeof schema>>, buyer: string, reader: string, productId: string, variantId: string, orderId: string;
const pg = () => db as never;
beforeAll(async () => {
  const { pgcrypto } = await import('@electric-sql/pglite/contrib/pgcrypto');
  const { uuid_ossp } = await import('@electric-sql/pglite/contrib/uuid_ossp');
  client = new PGlite({ extensions: { pgcrypto, uuid_ossp } }); db = drizzle(client, { schema }); await migrate(db, { migrationsFolder: './drizzle' });
  const people = await db.insert(schema.users).values([{ email: 'buyer@community.example', passwordHash: 'fixture' }, { email: 'reader@community.example', passwordHash: 'fixture' }]).returning();
  buyer = people[0].id; reader = people[1].id;
  await db.insert(schema.inventoryLocations).values({ id: HQ_LOCATION_ID, code: 'HQ', name: 'Fixture warehouse', type: 'WAREHOUSE', city: 'Lagos', state: 'Lagos' }).onConflictDoNothing();
  const [brand] = await db.insert(schema.brands).values({ name: 'Saved brand', slug: 'community-brand' }).returning();
  const [category] = await db.insert(schema.categories).values({ name: 'Saved category', slug: 'community-category' }).returning();
  const [product] = await db.insert(schema.products).values({ name: 'Saved formulation', slug: 'shared-formulation', brandId: brand.id, categoryId: category.id }).returning(); productId = product.id;
  const [variant] = await db.insert(schema.productVariants).values({ productId, sku: 'SHARED-50', sizeLabel: '50ml', priceKobo: 10000 }).returning(); variantId = variant.id;
  const [order] = await db.insert(schema.orders).values({ orderNumber: 'DES-TESTREVIEW', userId: buyer, status: 'DELIVERED', paymentStatus: 'PAID', shippingAddress: {}, idempotencyKey: 'review-order', subtotalKobo: 10000, totalKobo: 10000 }).returning(); orderId = order.id;
  await db.insert(schema.orderItems).values({ orderId, variantId, productName: product.name, variantLabel: '50ml', sku: variant.sku, unitPriceKobo: 10000, qty: 1, lineTotalKobo: 10000 });
}, 120000);
afterAll(async () => { await client?.close(); });
describe('community to product and honest review workflow', () => {
  it('publishes entered text without injecting stock media or a verified-buyer identity', async () => {
    const post = await createPost(pg(), reader, { name: 'Actual reader' }, { content: 'My entered routine', taggedProductId: productId });
    expect(post).toMatchObject({ authorName: 'Actual reader', authorRole: 'Member', mediaUrl: null, content: 'My entered routine' });
    const feed = await listPosts(pg(), { limit: 20 }, reader);
    const record = feed.posts.find(item => item.id === post.id)!;
    expect(record.taggedProductSlug).toBe('shared-formulation');
    expect(communityPostFromApi({ ...record, createdAt: record.createdAt.toISOString(), mediaType: record.mediaType as 'image' | 'video' | null }).taggedProductId).toBe('shared-formulation');
  });
  it('persists likes and gives moderators a reversible visibility control', async () => {
    const [post] = (await listPosts(pg(), { limit: 20 }, reader)).posts;
    expect(await togglePostLike(pg(), reader, post.id)).toMatchObject({ liked: true, likesCount: 1 });
    expect(await togglePostLike(pg(), reader, post.id)).toMatchObject({ liked: false, likesCount: 0 });
    await setPostVisibility(pg(), post.id, false);
    expect((await listPosts(pg(), { limit: 20 }, reader)).posts.some(item => item.id === post.id)).toBe(false);
    expect((await listModerationPosts(pg())).posts.find(item => item.id === post.id)?.visible).toBe(false);
    await setPostVisibility(pg(), post.id, true);
    expect((await listPosts(pg(), { limit: 20 }, reader)).posts.some(item => item.id === post.id)).toBe(true);
  });
  it('approves a genuine paid purchase review and updates the actual product aggregate', async () => {
    const review = await createReview(pg(), { userId: buyer, authorName: 'Actual buyer', productId: 'shared-formulation', rating: 4, title: 'My experience', comment: 'My actual review' });
    expect(review).toMatchObject({ verifiedPurchase: true, status: 'approved', orderId });
    expect((await listApprovedBySlug(pg(), 'shared-formulation')).some(item => item.id === review.id)).toBe(true);
    const [product] = await db.select().from(schema.products).where(eq(schema.products.id, productId));
    expect(product.reviewsCount).toBe(1); expect(Number(product.rating)).toBe(4);
  });
  it('keeps an unpaid community review pending until moderation without giving it a purchase badge', async () => {
    const review = await createReview(pg(), { userId: reader, authorName: 'Actual reader', productId: 'shared-formulation', rating: 3, title: 'Routine experience', comment: 'My experience of a shared routine' });
    expect(review).toMatchObject({ verifiedPurchase: false, status: 'pending' });
    expect((await listApprovedBySlug(pg(), 'shared-formulation')).some(item => item.id === review.id)).toBe(false);
    await moderateReview(pg(), review.id, 'approved');
    expect((await listApprovedBySlug(pg(), 'shared-formulation')).find(item => item.id === review.id)?.verifiedPurchase).toBe(false);
  });
  it('does not grant purchase proof from a cancelled paid order', async () => {
    await db.update(schema.orders).set({ status: 'CANCELLED' }).where(eq(schema.orders.id, orderId));
    expect(await hasVerifiedPurchase(pg(), buyer, productId)).toEqual({ verified: false, orderId: null });
  });
});
