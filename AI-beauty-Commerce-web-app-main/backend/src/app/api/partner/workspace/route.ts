import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, Errors, readJson } from '@/lib/errors';
import { requireAuth } from '@/modules/auth/require-auth';
import { workspaceCommand, workspaceKind } from '@/modules/workspaces/validation';
import { workspaceView, workspaceWrite } from '@/modules/workspaces/service';

export const GET = api(async ({ req }) => {
  const db = getDb();
  const auth = await requireAuth(db);
  const kind = workspaceKind.parse(new URL(req.url).searchParams.get('kind'));
  return NextResponse.json(await workspaceView(db, auth.userId, kind), { headers: { 'Cache-Control': 'no-store' } });
});
export const POST = api(async ({ req }) => {
  const db = getDb();
  const auth = await requireAuth(db);
  const key = req.headers.get('Idempotency-Key');
  if (!key || key.length < 8 || key.length > 128) throw Errors.badRequest('Idempotency-Key required.');
  const input = workspaceCommand.parse(await readJson(req));
  return NextResponse.json({ result: await workspaceWrite(db, auth.userId, input, key) });
});
