import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requireAuth } from '@/modules/auth/require-auth';
import { createConversation, listConversations } from '@/modules/ai/service';
import { conversationSchema } from '@/modules/ai/validation';

export const GET = api(async () => {
  const db = getDb();
  const ctx = await requireAuth(db);
  return NextResponse.json({ conversations: await listConversations(db, ctx.userId) });
});

export const POST = api(async ({ req }) => {
  const rl = checkRateLimit(`ai:${clientIp(req)}`, Limits.ai);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const db = getDb();
  const ctx = await requireAuth(db);
  const input = conversationSchema.parse(await readJson(req));
  return NextResponse.json({ conversation: await createConversation(db, ctx.userId, input.title) }, { status: 201 });
});
