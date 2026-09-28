import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { clientIp, Errors, readJson, toErrorResponse } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requireAuth } from '@/modules/auth/require-auth';
import { getMessages, postMessage } from '@/modules/ai/service';
import { chatMessageSchema } from '@/modules/ai/validation';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    const { id } = await params;
    const db = getDb();
    const ctx = await requireAuth(db);
    const res = NextResponse.json({ messages: await getMessages(db, ctx.userId, id) });
    res.headers.set('x-request-id', requestId);
    return res;
  } catch (err) {
    return toErrorResponse(err, requestId);
  }
}

/** One chat turn: daily per-user quota (abuse/resource control, §14). */
export async function POST(req: Request, { params }: Ctx) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    const db = getDb();
    const ctx = await requireAuth(db);
    const rl = checkRateLimit(`ai-chat:${ctx.userId}`, Limits.ai);
    if (!rl.allowed) throw Errors.rateLimited(60);
    const { id } = await params;
    const input = chatMessageSchema.parse(await readJson(req));
    const res = NextResponse.json(await postMessage(db, ctx.userId, id, input.content));
    res.headers.set('x-request-id', requestId);
    return res;
  } catch (err) {
    return toErrorResponse(err, requestId);
  }
}
