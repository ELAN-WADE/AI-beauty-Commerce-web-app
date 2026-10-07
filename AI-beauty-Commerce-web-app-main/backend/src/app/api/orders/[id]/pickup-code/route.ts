import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkSharedRateLimit } from '@/lib/rate-limit';
import { optionalAuth } from '@/modules/auth/require-auth';
import { issuePickupCode } from '@/modules/partners/service';
import { z } from 'zod';
type Context = { params: Promise<{ id: string }> };
export async function POST(req: Request, context: Context) {
  return api(async ({ req }) => {
    const { id } = await context.params;
    const db = getDb();
    if (!(await checkSharedRateLimit(db, `pickup:${id}:${clientIp(req)}`, { limit: 3, windowMs: 15 * 60_000 })).allowed) throw Errors.rateLimited(60);
    z.object({}).strict().parse(await readJson(req));
    const auth = await optionalAuth(db);
    return NextResponse.json(await issuePickupCode(db, z.string().uuid().parse(id), { userId: auth?.userId, token: req.headers.get('x-guest-order-token') ?? undefined }));
  })(req);
}
