import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, Errors, readJson } from '@/lib/errors';
import { requirePerm } from '@/lib/admin';
import { adminPostSchema, publishAdminPost } from '@/modules/workspaces/publish-post';
import { listModerationPosts } from '@/modules/community/service';
import { z } from 'zod';
export const GET = api(async ({ req }) => {
  const db = getDb(); await requirePerm(db, 'reviews:moderate');
  const cursor = z.string().max(500).optional().parse(new URL(req.url).searchParams.get('cursor') ?? undefined);
  return NextResponse.json(await listModerationPosts(db, cursor), { headers: { 'Cache-Control': 'private, no-store' } });
});
export const POST = api(async ({ req }) => {
  const db = getDb(), actor = await requirePerm(db, 'reviews:moderate');
  const key = req.headers.get('Idempotency-Key');
  if (!key || key.length < 8 || key.length > 128) throw Errors.badRequest('Idempotency-Key is required.');
  const input = adminPostSchema.parse(await readJson(req, 8192));
  return NextResponse.json(await publishAdminPost(db, actor.userId, input, key), { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
});
