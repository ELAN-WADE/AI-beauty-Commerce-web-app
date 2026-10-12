/**
 * Phase 5 proof: engagement/community action cores run the IDENTICAL services
 * as their REST routes (same validation, same auth-shaped errors) with zero
 * HTTP. Auth-dependent cores are exercised at the service level here (server
 * actions themselves need Next request scope); route parity is by construction
 * (same schemas, same service calls). Runs on PGlite — no Postgres needed.
 */
import { describe, expect, it, beforeAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from '@/db/schema';
import { users } from '@/modules/auth/schema';
import { brands, categories, products, productVariants, productImages } from '@/modules/catalog/schema';
import { HQ_LOCATION_ID, inventoryLocations, stockLevels } from '@/modules/inventory/schema';
import { createReview, listApprovedBySlug, moderateReview, resolveProductId, toggleHelpful } from '@/modules/reviews/service';
import { addWishlist, listWishlist, removeWishlist } from '@/modules/cart/service';
import { adjustPoints, getLoyaltyView, redeemToVoucher } from '@/modules/loyalty/service';
import { upsertSkinProfile, getSkinProfile } from '@/modules/skin/service';
import { createPost, listPosts, postMessage, togglePostLike } from '@/modules/community/service';
import { createReviewSchema } from '@/modules/reviews/validation';
import { skinProfileSchema } from '@/modules/skin/validation';
import { chatMessageSchema, createPostSchema } from '@/modules/community/validation';

let db: PgliteDatabase<typeof schema>;
let userId: string;
let variantId: string;

beforeAll(async () => {
  const { pgcrypto } = await import('@electric-sql/pglite/contrib/pgcrypto');
  const { uuid_ossp } = await import('@electric-sql/pglite/contrib/uuid_ossp');
  const client = new PGlite({ extensions: { pgcrypto, uuid_ossp } });
  db = drizzle(client, { schema });
  await migrate(db as never, { migrationsFolder: './drizzle' });

  await db
    .insert(inventoryLocations)
    .values({ id: HQ_LOCATION_ID, code: 'HQ', name: 'Lagos HQ', type: 'WAREHOUSE', city: 'Lagos', state: 'Lagos' })
    .onConflictDoNothing();
  const [user] = await db.insert(users).values({ email: 'engaged@example.com', passwordHash: 'x' }).returning({ id: users.id });
  userId = user.id;
  const [brand] = await db.insert(brands).values({ name: 'Desla', slug: 'desla' }).returning({ id: brands.id });
  const [category] = await db.insert(categories).values({ name: 'Skincare', slug: 'skincare' }).returning({ id: categories.id });
  const [product] = await db
    .insert(products)
    .values({ brandId: brand.id, categoryId: category.id, name: 'Engage Oil', slug: 'engage-oil', tagline: 't', description: 'd', subCategory: 'Body' })
    .returning({ id: products.id });
  const [variant] = await db
    .insert(productVariants)
    .values({ productId: product.id, sku: 'EO-50', sizeLabel: '50ml', priceKobo: 9000, position: 0 })
    .returning({ id: productVariants.id });
  variantId = variant.id;
  await db.insert(productImages).values({ productId: product.id, url: '/engage.jpg', alt: 'Engage', position: 0 });
  await db.insert(stockLevels).values({ locationId: HQ_LOCATION_ID, pool: 'PLATFORM', variantId: variant.id, onHand: 5, reserved: 0 });
}, 120000);

const pg = () => db as never;

describe('reviews (submitReviewAction core: createReview)', () => {
  it('creates a pending review by slug and lists it once approved-path runs', async () => {
    // Action-level input accepts slug-or-uuid; the resolver handles both
    // (this is the Phase 5 fix — REST zod 422'd slug submits silently).
    const resolved = await resolveProductId(pg(), 'ENGAGE-OIL');
    expect(resolved).toBeDefined();
    const review = await createReview(pg(), { userId, authorName: 'Engaged', productId: 'engage-oil', rating: 5, title: 'Loved it', comment: 'Glowy for days.' });
    expect(review.status).toBe('pending'); // no verified purchase yet
    expect(review.rating).toBe(5);
    expect(await listApprovedBySlug(pg(), 'engage-oil')).toHaveLength(0);
    // Moderation approves → votable + publicly listed (same services the actions call).
    await moderateReview(pg(), review.id, 'approved');
    const helpful = await toggleHelpful(pg(), userId, review.id);
    expect(helpful.voted).toBe(true);
    expect(helpful.helpfulCount).toBe(1);
    expect(await listApprovedBySlug(pg(), 'engage-oil')).toHaveLength(1);
  });

  it('rejects out-of-range ratings at the schema boundary', async () => {
    expect(() => createReviewSchema.parse({ productId: 'engage-oil', rating: 6, title: '', comment: 'x' })).toThrow();
  });
});

describe('wishlist (toggleWishlistAction core)', () => {
  it('adds then removes a variant idempotently', async () => {
    await addWishlist(pg(), userId, variantId);
    expect((await listWishlist(pg(), userId)).length).toBe(1);
    await addWishlist(pg(), userId, variantId);
    expect((await listWishlist(pg(), userId)).length).toBe(1); // no duplicates
    await removeWishlist(pg(), userId, variantId);
    expect((await listWishlist(pg(), userId)).length).toBe(0);
  });
});

describe('loyalty redeem (redeemVoucherAction core)', () => {
  it('funds via adjustPoints then mints a tier voucher', async () => {
    await adjustPoints(pg(), userId, { userId, points: 1000, note: 'test funding' });
    const before = await getLoyaltyView(pg(), userId);
    expect(before.points).toBe(1000);
    const voucher = await redeemToVoucher(pg(), userId, 500);
    expect(voucher.code).toMatch(/^GLW-/);
    expect(voucher.amountKobo).toBeGreaterThan(0);
    const after = await getLoyaltyView(pg(), userId);
    expect(after.points).toBe(500);
  });
});

describe('skin profile (saveSkinProfileAction core)', () => {
  it('upserts and reads back the profile', async () => {
    const parsed = skinProfileSchema.parse({ skinType: 'oily', concerns: ['acne', 'shine'], notes: '' });
    await upsertSkinProfile(pg(), userId, parsed);
    const profile = await getSkinProfile(pg(), userId);
    expect(profile?.skinType).toBe('oily');
    expect(profile?.concerns).toEqual(['acne', 'shine']);
  });

  it('rejects unknown skin types at the schema boundary', async () => {
    expect(() => skinProfileSchema.parse({ skinType: 'martian', concerns: [], notes: '' })).toThrow();
  });
});

describe('community (post/like/chat cores)', () => {
  it('creates a tagged post, toggles a like, and stores chat', async () => {
    const post = await createPost(
      pg(),
      userId,
      { name: 'Engaged' },
      createPostSchema.parse({ content: 'My routine with #glow', taggedHashtag: '#glow' }),
    );
    expect(post.id).toBeDefined();
    const feed = await listPosts(pg(), { limit: 10 });
    expect(feed.posts.some((p) => p.id === post.id)).toBe(true);

    const liked = await togglePostLike(pg(), userId, post.id);
    expect(liked.liked).toBe(true);
    const unliked = await togglePostLike(pg(), userId, post.id);
    expect(unliked.liked).toBe(false);

    const msg = await (async () => {
      const { postMessage: pm } = await import('@/modules/community/service');
      return pm(pg(), userId, { name: 'Engaged' }, chatMessageSchema.parse({ channel: 'routine', message: 'Hello glow gang' }));
    })();
    expect(msg.message).toBe('Hello glow gang');
  });
});
