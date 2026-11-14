import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { clientIp, enforceOrigin, Errors, readJson, toErrorResponse } from '@/lib/errors';
import { checkSharedRateLimit, Limits } from '@/lib/rate-limit';
import { requireAuth } from '@/modules/auth/require-auth';
import { getProfile } from '@/modules/users/service';
import { createPostComment, listPostComments } from '@/modules/community/service';
import { createPostCommentSchema, postCommentQuerySchema } from '@/modules/community/validation';

type Ctx = { params: Promise<{ id: string }> };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: Request, { params }: Ctx) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    const { id } = await params;
    if (!UUID_RE.test(id)) throw Errors.notFound('Post not found.');
    const db = getDb();
    const q = postCommentQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
    const comments = await listPostComments(db, id, q.limit);
    const res = NextResponse.json(
      {
        comments: comments.map((c) => ({
          ...c,
          createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
        })),
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
    res.headers.set('x-request-id', requestId);
    return res;
  } catch (err) {
    return toErrorResponse(err, requestId);
  }
}

export async function POST(req: Request, { params }: Ctx) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    enforceOrigin(req);
    const db = getDb();
    const ip = clientIp(req);
    const rl = await checkSharedRateLimit(db, `comment:${ip}`, Limits.apiMutation);
    if (!rl.allowed) throw Errors.rateLimited(Math.max(1, Math.ceil(rl.retryAfterMs / 1000)));
    const { id } = await params;
    if (!UUID_RE.test(id)) throw Errors.notFound('Post not found.');
    const ctx = await requireAuth(db);
    const input = createPostCommentSchema.parse(await readJson(req));
    const profile = await getProfile(db, ctx.userId);
    const result = await createPostComment(
      db,
      ctx.userId,
      id,
      {
        name: profile?.displayName || ctx.email.split('@')[0] || 'Member',
        avatar: profile?.avatarUrl ?? undefined,
      },
      input,
    );
    const res = NextResponse.json(
      {
        comment: {
          ...result.comment,
          createdAt:
            result.comment.createdAt instanceof Date
              ? result.comment.createdAt.toISOString()
              : result.comment.createdAt,
        },
        commentsCount: result.commentsCount,
      },
      { status: 201 },
    );
    res.headers.set('x-request-id', requestId);
    return res;
  } catch (err) {
    return toErrorResponse(err, requestId);
  }
}
