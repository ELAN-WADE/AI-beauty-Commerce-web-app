import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requirePerm } from '@/lib/admin';
import { grantRole, revokeRole } from '@/modules/auth/service';
import { audit } from '@/modules/audit/service';

const grantSchema = z.object({ role: z.string().min(1).max(30) }).strict();
const revokeQuery = z.object({ role: z.string().min(1).max(30) });
type Ctx = { params: Promise<{ id: string }> };

async function gate(req: Request) {
  const rl = checkRateLimit(`admin:${clientIp(req)}`, Limits.admin);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const db = getDb();
  const ctx = await requirePerm(db, 'roles:grant');
  return { db, ctx, ip: clientIp(req) };
}

export async function POST(req: Request, { params }: Ctx) {
  return api(async ({ requestId }) => {
    const { id } = await params;
    const { db, ctx, ip } = await gate(req);
    const input = grantSchema.parse(await readJson(req));
    const result = await grantRole(db, { userId: id, roleId: input.role.toUpperCase(), grantedBy: ctx.userId, granterRoles: ctx.roles });
    await audit(db, { actorId: ctx.userId, action: 'role.grant', entityType: 'user', entityId: id, after: result, ip, requestId });
    return NextResponse.json(result, { status: 201 });
  })(req);
}

export async function DELETE(req: Request, { params }: Ctx) {
  return api(async ({ requestId }) => {
    const { id } = await params;
    const { db, ctx, ip } = await gate(req);
    const q = revokeQuery.parse(Object.fromEntries(new URL(req.url).searchParams));
    const result = await revokeRole(db, { userId: id, roleId: q.role.toUpperCase(), revokedBy: ctx.userId });
    await audit(db, { actorId: ctx.userId, action: 'role.revoke', entityType: 'user', entityId: id, after: result, ip, requestId });
    return NextResponse.json(result);
  })(req);
}
