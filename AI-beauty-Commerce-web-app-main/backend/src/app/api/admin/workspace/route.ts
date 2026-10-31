import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { api, Errors, readJson } from '@/lib/errors';
import { requirePerm } from '@/lib/admin';
import { workspaceRecords } from '@/modules/workspaces/schema';
import { adminWorkspaceCommand } from '@/modules/workspaces/validation';
import { adminWorkspaceWrite } from '@/modules/workspaces/service';

export const GET = api(async () => {
  const db = getDb();
  await requirePerm(db, 'products:write');
  return NextResponse.json({ records: await db.select().from(workspaceRecords).orderBy(desc(workspaceRecords.updatedAt)).limit(300) }, { headers: { 'Cache-Control': 'no-store' } });
});
export const POST = api(async ({ req }) => {
  const db = getDb();
  const auth = await requirePerm(db, 'products:write');
  const key = req.headers.get('Idempotency-Key');
  if (!key || key.length < 8 || key.length > 128) throw Errors.badRequest('Idempotency-Key required.');
  const input = adminWorkspaceCommand.parse(await readJson(req));
  return NextResponse.json({ result: await adminWorkspaceWrite(db, auth.userId, input, key) });
});
