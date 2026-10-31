import { readStorefront, saveStorefront, storefrontSchema } from '@/modules/workspaces/storefront';
import { DEFAULT_HERO_SETTINGS, moveHeroImage } from '@/storefront/lib/hero-settings';
import { adminPostSchema, publishAdminPost } from '@/modules/workspaces/publish-post';
import { listPosts } from '@/modules/community/service';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { workspaceView, workspaceWrite, adminWorkspaceWrite } from '@/modules/workspaces/service';
import { createProduct, updateProduct } from '@/modules/catalog/service';
import { productCreateSchema } from '@/modules/catalog/validation';

let client: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;
let owner: string;
let stranger: string;
const pg = () => db as never;
beforeAll(async () => {
  const { pgcrypto } = await import('@electric-sql/pglite/contrib/pgcrypto');
  const { uuid_ossp } = await import('@electric-sql/pglite/contrib/uuid_ossp');
  client = new PGlite({ extensions: { pgcrypto, uuid_ossp } });
  db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: './drizzle' });
  await db.insert(schema.roles).values({ id: 'CREATOR', description: 'Creator' }).onConflictDoNothing();
  const people = await db.insert(schema.users).values([{ email: 'owner@studio.example', passwordHash: 'x' }, { email: 'stranger@studio.example', passwordHash: 'x' }]).returning();
  owner = people[0].id; stranger = people[1].id;
  for (const userId of [owner, stranger]) {
    await db.insert(schema.userRoles).values({ userId, roleId: 'CREATOR' });
    await db.insert(schema.creators).values({ userId, name: 'Creator', promoCode: userId.slice(0, 8), verified: true });
  }
}, 120000);
afterAll(async () => { await client?.close(); });

describe('live workspace persistence and authorization', () => {
  it('publishes administrator media into the real community feed exactly once and keeps product tags', async () => {
    await db.insert(schema.profiles).values({ userId: owner, displayName: 'Saved administrator identity' }).onConflictDoNothing();
    const input = adminPostSchema.parse({ content: 'A real saved administrator post', mediaType: 'video', mediaUrl: 'https://media.example.test/actual-video.mp4' });
    const saved = await publishAdminPost(pg(), owner, input, 'admin-post-test');
    const replay = await publishAdminPost(pg(), owner, input, 'admin-post-test');
    expect(replay).toEqual({ id: saved.id, replay: true });
    const feed = await listPosts(pg(), { limit: 20 }, stranger);
    expect(feed.posts.filter(post => post.id === saved.id)).toHaveLength(1);
    const [post] = await db.select().from(schema.communityPosts).where(eq(schema.communityPosts.id, saved.id));
    expect(post).toMatchObject({ mediaType: 'video', mediaUrl: input.mediaUrl, rewardEligible: false, mediaVerified: false });
    await expect(publishAdminPost(pg(), owner, { ...input, content: 'Different' }, 'admin-post-test')).rejects.toMatchObject({ status: 409 });
    await expect(publishAdminPost(pg(), owner, { ...input, productSlug: 'not-published' }, 'admin-post-invalid')).rejects.toMatchObject({ status: 400 });
  });
  it('updates the owned creator profile and account identity together', async () => {
    await workspaceWrite(pg(), owner, { action: 'profile', kind: 'CREATOR', name: 'Saved creator identity', handle: '@saved-creator', address: '', phone: '+2348000000000', operatingHours: '' }, 'profile-identity-save');
    const [profile] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, owner));
    const [creator] = await db.select().from(schema.creators).where(eq(schema.creators.userId, owner));
    expect(profile).toMatchObject({ displayName: 'Saved creator identity', phone: '+2348000000000' });
    expect(creator).toMatchObject({ name: profile.displayName, handle: '@saved-creator' });
    expect(await db.select().from(schema.profiles).where(eq(schema.profiles.userId, stranger))).toHaveLength(0);
  });
  it('persists catalogue media/ingredient edits and rolls back an invalid variant edit', async () => {
    const [brand] = await db.insert(schema.brands).values({ name: 'Edit test brand', slug: 'edit-brand' }).returning();
    const [category] = await db.insert(schema.categories).values({ name: 'Edit test category', slug: 'edit-category' }).returning();
    const product = await createProduct(pg(), productCreateSchema.parse({ brandId: brand.id, categoryId: category.id, name: 'Original formulation', variants: [{ sku: 'EDIT-50', sizeLabel: '50ml', priceKobo: 150000 }], images: [{ url: 'https://example.com/old.jpg', alt: 'Original image' }] }));
    await updateProduct(pg(), product.id, { images: [{ url: 'https://example.com/new.jpg', alt: 'Updated image' }], ingredients: [{ name: 'Glycerin', description: 'Humectant', detail: 'Hydration' }] });
    const images = await db.select().from(schema.productImages).where(eq(schema.productImages.productId, product.id));
    expect(images.map(i => i.url)).toEqual(['https://example.com/new.jpg']);
    const ingredients = await db.select().from(schema.productIngredients).where(eq(schema.productIngredients.productId, product.id));
    expect(ingredients).toHaveLength(1);
    await expect(updateProduct(pg(), product.id, { name: 'Must roll back', variants: [{ id: crypto.randomUUID(), sku: 'INVALID', sizeLabel: '50ml', priceKobo: 200000, compareAtKobo: null, isActive: true, position: 0 }] })).rejects.toMatchObject({ status: 404 });
    const [unchanged] = await db.select().from(schema.products).where(eq(schema.products.id, product.id));
    expect(unchanged.name).toBe('Original formulation');
  });
  it('persists drafts, scopes reads/edits by owner and rejects stale versions', async () => {
    const draft = await workspaceWrite(pg(), owner, { action: 'save', kind: 'CREATOR', type: 'CONTENT', status: 'DRAFT', title: 'My routine', body: 'Actual creator content', url: '', productIds: [] }, 'draft-create-1') as typeof schema.workspaceRecords.$inferSelect;
    expect((await workspaceView(pg(), stranger, 'CREATOR')).records.some(r => r.id === draft.id)).toBe(false);
    await expect(workspaceWrite(pg(), stranger, { action: 'save', kind: 'CREATOR', type: 'CONTENT', status: 'SUBMITTED', id: draft.id, version: 1, title: 'Stolen routine', body: '', url: '', productIds: [] }, 'stranger-edit-1')).rejects.toMatchObject({ status: 404 });
    await workspaceWrite(pg(), owner, { action: 'save', kind: 'CREATOR', type: 'CONTENT', status: 'SUBMITTED', id: draft.id, version: 1, title: 'My routine', body: 'Actual creator content', url: '', productIds: [] }, 'owner-edit-1');
    await expect(workspaceWrite(pg(), owner, { action: 'save', kind: 'CREATOR', type: 'CONTENT', status: 'DRAFT', id: draft.id, version: 1, title: 'Stale routine', body: '', url: '', productIds: [] }, 'stale-edit-1')).rejects.toMatchObject({ status: 409 });
  });
  it('reviews content atomically and never publishes the same submission twice', async () => {
    const content = await workspaceWrite(pg(), owner, { action: 'save', kind: 'CREATOR', type: 'CONTENT', status: 'SUBMITTED', title: 'Publish routine', body: 'Reviewed instructions', url: '', productIds: [] }, 'content-submit-1') as typeof schema.workspaceRecords.$inferSelect;
    await adminWorkspaceWrite(pg(), owner, { action: 'review', id: content.id, version: 1, status: 'APPROVED', note: 'Brand reviewed' }, 'review-content-1');
    await expect(adminWorkspaceWrite(pg(), owner, { action: 'review', id: content.id, version: 1, status: 'APPROVED', note: 'Replay approval' }, 'review-content-2')).rejects.toMatchObject({ status: 409 });
    const posts = (await db.select().from(schema.communityPosts).where(eq(schema.communityPosts.userId, owner))).filter(post => post.content.includes('Reviewed instructions'));
    expect(posts).toHaveLength(1);
    expect(posts[0].rewardEligible).toBe(false);
  });
  it('shows published opportunities, deduplicates applications and rejects key misuse', async () => {
    const publication = await adminWorkspaceWrite(pg(), owner, { action: 'publish', type: 'CAMPAIGN', audience: 'CREATOR', active: true, title: 'New campaign', body: 'Brand brief', url: '', productIds: [] }, 'campaign-create-1');
    expect((await workspaceView(pg(), stranger, 'CREATOR')).records.some(r => r.id === publication.id)).toBe(true);
    const input = { action: 'apply', kind: 'CREATOR', publicationId: publication.id, title: 'New campaign', body: 'My pitch', url: '', productIds: [] } as const;
    const first = await workspaceWrite(pg(), owner, { ...input, productIds: [] }, 'application-key-1');
    const replay = await workspaceWrite(pg(), owner, { ...input, productIds: [] }, 'application-key-1');
    expect((replay as { id: string }).id).toBe((first as { id: string }).id);
    await expect(workspaceWrite(pg(), owner, { ...input, productIds: [] }, 'application-key-2')).rejects.toMatchObject({ status: 409 });
    await expect(workspaceWrite(pg(), stranger, { ...input, productIds: [] }, 'application-key-1')).rejects.toMatchObject({ status: 409 });
  });
  it('publishes approved creator media and a real formulation tag to the community', async () => {
    const [product] = await db.select().from(schema.products).limit(1);
    const content = await workspaceWrite(pg(), owner, { action: 'save', kind: 'CREATOR', type: 'CONTENT', status: 'SUBMITTED', title: 'Actual creator reel', body: 'Submitted caption', url: 'https://media.example.test/reel.mp4', productIds: [product.slug] }, 'media-submission-1') as typeof schema.workspaceRecords.$inferSelect;
    const reviewed = await adminWorkspaceWrite(pg(), owner, { action: 'review', id: content.id, version: 1, status: 'APPROVED', note: 'Reviewed actual media and attribution.' }, 'media-review-1');
    const postId = (reviewed.data as { communityPostId: string }).communityPostId;
    const [post] = await db.select().from(schema.communityPosts).where(eq(schema.communityPosts.id, postId));
    expect(post).toMatchObject({ mediaType: 'video', mediaUrl: 'https://media.example.test/reel.mp4', taggedProductId: product.id, rewardEligible: false, mediaVerified: false });
  });
});


describe('storefront editorial publication', () => {
  it('retains the actual PR kit products, bounds allocations, and preserves dispatch references through delivery', async () => {
    const [product] = await db.select().from(schema.products).limit(1);
    const kit = await adminWorkspaceWrite(pg(), owner, { action: 'publish', type: 'PR_BOX', audience: 'ALL', active: true, title: 'Actual PR kit', body: 'Administrator supplied kit details', url: '', productIds: [product.slug], details: { spotsLeft: 1 } }, 'actual-pr-kit');
    const request = { action: 'apply' as const, kind: 'CREATOR' as const, publicationId: kit.id, title: 'Kit request', body: 'Saved delivery address and phone', url: '', productIds: [] };
    const entry = await workspaceWrite(pg(), owner, request, 'actual-pr-request') as typeof schema.workspaceRecords.$inferSelect;
    expect(entry.data.productIds).toEqual([product.slug]);
    expect((await workspaceWrite(pg(), owner, request, 'actual-pr-request') as { id: string }).id).toBe(entry.id);
    await expect(workspaceWrite(pg(), stranger, request, 'kit-over-capacity')).rejects.toMatchObject({ status: 409 });
    await expect(adminWorkspaceWrite(pg(), owner, { action: 'review', id: entry.id, version: 1, status: 'DISPATCHED', note: 'Courier reference' }, 'kit-skip-review')).rejects.toMatchObject({ status: 409 });
    const approved = await adminWorkspaceWrite(pg(), owner, { action: 'review', id: entry.id, version: 1, status: 'APPROVED', note: 'Application reviewed' }, 'kit-review');
    const dispatched = await adminWorkspaceWrite(pg(), owner, { action: 'review', id: entry.id, version: approved.version, status: 'DISPATCHED', note: 'Saved courier reference' }, 'kit-dispatch');
    const delivered = await adminWorkspaceWrite(pg(), owner, { action: 'review', id: entry.id, version: dispatched.version, status: 'DELIVERED', note: 'Recipient confirmed delivery' }, 'kit-delivered');
    expect(delivered.data.shipping).toMatchObject({ trackingReference: 'Saved courier reference', deliveredAt: expect.any(String) });
  });
  it('reorders images and switches both hero modes without discarding slide copy', async () => {
    const first = await readStorefront(pg());
    const slides = [{ id: 'a', image: '/a.jpg', tag: '', headline: 'Slide A', subtext: 'First body', actionLabel: 'Shop', actionRoute: 'catalogue', isActive: true, displayOrder: 1 }, { id: 'b', image: '/b.jpg', tag: '', headline: 'Slide B', subtext: 'Second body', actionLabel: 'Shop', actionRoute: 'catalogue', isActive: false, displayOrder: 2 }];
    const config = storefrontSchema.parse({ hero: { ...DEFAULT_HERO_SETTINGS, mode: 'slideshow' }, heroSlides: moveHeroImage(slides, 'b', -1), routineSteps: [], brandStory: { tagline: '', heading: '', paragraph1: '', paragraph2: '', image: '/story.jpg', badge1: '', badge2: '' }, announcementTicker: { text: '', isActive: false } });
    const saved = await saveStorefront(pg(), owner, first.version, config);
    expect((await readStorefront(pg())).config?.hero.mode).toBe('slideshow');
    expect((await readStorefront(pg())).config?.heroSlides.map(slide => slide.id)).toEqual(['b', 'a']);
    await saveStorefront(pg(), owner, saved.version, { ...config, hero: { ...config.hero, mode: 'flex' } });
    expect((await readStorefront(pg())).config?.heroSlides).toEqual(config.heroSlides);
    expect(moveHeroImage(slides, 'a', -1)).toBe(slides);
  });
  it('persists complete content for public reads and refuses stale overwrites', async () => {
    const config = storefrontSchema.parse({ heroSlides: [{ id: 'hero-one', image: '/hero.jpg', tag: 'News', headline: 'New formulation', subtext: 'A new launch', actionLabel: 'Shop', actionRoute: 'catalogue', isActive: true }], routineSteps: [], brandStory: { tagline: 'Care', heading: 'Our story', paragraph1: 'First', paragraph2: 'Second', image: '/story.jpg', badge1: 'Origin', badge2: 'Quality' }, announcementTicker: { text: 'Launch offer', isActive: true } });
    const first = await readStorefront(pg());
    await saveStorefront(pg(), owner, first.version, config);
    const saved = await readStorefront(pg());
    expect(saved.config?.heroSlides[0].headline).toBe('New formulation');
    expect(saved.config?.announcementTicker.text).toBe('Launch offer');
    await expect(saveStorefront(pg(), stranger, first.version, { ...config, heroSlides: [] })).rejects.toMatchObject({ status: 409 });
    expect((await readStorefront(pg())).config).toEqual(config);
  });
  it('rejects executable image URLs and invalid navigation routes', () => {
    expect(storefrontSchema.safeParse({ heroSlides: [{ image: 'javascript:alert(1)' }] }).success).toBe(false);
  });
});

it('archives only owned editable drafts and keeps submitted content in review', async () => {
  const draft = await workspaceWrite(pg(), owner, { action: 'save', kind: 'CREATOR', type: 'CONTENT', status: 'DRAFT', title: 'Archive draft', body: '', url: '', productIds: [] }, 'archive-draft-create') as typeof schema.workspaceRecords.$inferSelect;
  await expect(workspaceWrite(pg(), stranger, { action: 'archive', kind: 'CREATOR', id: draft.id, version: 1 }, 'archive-stranger')).rejects.toMatchObject({ status: 404 });
  const archived = await workspaceWrite(pg(), owner, { action: 'archive', kind: 'CREATOR', id: draft.id, version: 1 }, 'archive-owner') as typeof schema.workspaceRecords.$inferSelect;
  expect(archived.status).toBe('ARCHIVED');
  await expect(workspaceWrite(pg(), owner, { action: 'save', kind: 'CREATOR', type: 'CONTENT', id: draft.id, version: 2, status: 'SUBMITTED', title: 'Revive archived', body: '', url: '', productIds: [] }, 'archive-revive')).rejects.toMatchObject({ status: 409 });
  const submitted = await workspaceWrite(pg(), owner, { action: 'save', kind: 'CREATOR', type: 'CONTENT', status: 'SUBMITTED', title: 'Review submission', body: '', url: '', productIds: [] }, 'archive-submit-create') as typeof schema.workspaceRecords.$inferSelect;
  await expect(workspaceWrite(pg(), owner, { action: 'archive', kind: 'CREATOR', id: submitted.id, version: 1 }, 'archive-submit-reject')).rejects.toMatchObject({ status: 409 });
});
