import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { optionalAuth, requireAuth } from '@/modules/auth/require-auth';
import { getProfile } from '@/modules/users/service';
import { createPost, listPosts } from '@/modules/community/service';
import { products } from '@/modules/catalog/schema';
import { and, eq } from 'drizzle-orm';
import { createPostSchema, postQuerySchema } from '@/modules/community/validation';

export const GET = api(async ({ req }) => {
  const q = postQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  const db = getDb();
  const auth = await requireAuth(db);
  return NextResponse.json(await listPosts(db, q, auth.userId), { headers: { 'Cache-Control': 'private, no-store' } });
});

export const POST = api(async ({ req }) => {
  const rl = checkRateLimit(`posts:${clientIp(req)}`, Limits.posts);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const db = getDb();
  const ctx = await requireAuth(db);
  const input = createPostSchema.parse(await readJson(req));
  let taggedProductSlug: string | undefined;
  if (input.taggedProductId) {
    const byId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.taggedProductId);
    const [product] = await db.select({ id: products.id, slug: products.slug }).from(products).where(and(eq(products.isActive, true), byId ? eq(products.id, input.taggedProductId) : eq(products.slug, input.taggedProductId))).limit(1);
    if (!product) throw Errors.badRequest('Tagged product is unavailable.');
    input.taggedProductId = product.id; taggedProductSlug = product.slug;
  }
  const profile = await getProfile(db, ctx.userId);
  const post = await createPost(
    db,
    ctx.userId,
    { name: profile?.displayName || ctx.email.split('@')[0] || 'Member', avatar: profile?.avatarUrl ?? undefined },
    input,
  );
  return NextResponse.json({ post: { ...post, taggedProductSlug } }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
});
