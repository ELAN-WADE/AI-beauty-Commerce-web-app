import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requireAuth } from '@/modules/auth/require-auth';
import { getProfile } from '@/modules/users/service';
import { listMessages, postMessage } from '@/modules/community/service';
import { chatMessageSchema, chatQuerySchema } from '@/modules/community/validation';

const CHAT_LIMIT = { limit: 30, windowMs: 60_000 };

export const GET = api(async ({ req }) => {
  const q = chatQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  return NextResponse.json({ messages: await listMessages(getDb(), q.channel, q.limit) });
});

export const POST = api(async ({ req }) => {
  const rl = checkRateLimit(`chat:${clientIp(req)}`, CHAT_LIMIT);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const db = getDb();
  const ctx = await requireAuth(db);
  const input = chatMessageSchema.parse(await readJson(req));
  const profile = await getProfile(db, ctx.userId);
  const msg = await postMessage(
    db,
    ctx.userId,
    { name: profile?.displayName || ctx.email.split('@')[0] || 'Member', avatar: profile?.avatarUrl ?? undefined },
    input,
  );
  return NextResponse.json({ message: msg }, { status: 201 });
});
