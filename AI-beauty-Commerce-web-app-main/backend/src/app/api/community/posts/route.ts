import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, readJson } from '@/lib/errors';
import { requireAuth } from '@/modules/auth/require-auth';
import { getProfile } from '@/modules/users/service';
import { createPost, listPosts } from '@/modules/community/service';
import { createPostSchema, postQuerySchema } from '@/modules/community/validation';

export const GET = api(async ({ req }) => {
  const q = postQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  return NextResponse.json(await listPosts(getDb(), q));
});

export const POST = api(async ({ req }) => {
  const db = getDb();
  const ctx = await requireAuth(db);
  const input = createPostSchema.parse(await readJson(req));
  const profile = await getProfile(db, ctx.userId);
  const post = await createPost(
    db,
    ctx.userId,
    { name: profile?.displayName || ctx.email.split('@')[0] || 'Member', avatar: profile?.avatarUrl ?? undefined },
    input,
  );
  return NextResponse.json({ post }, { status: 201 });
});
