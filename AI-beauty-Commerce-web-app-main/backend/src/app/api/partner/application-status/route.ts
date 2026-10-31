import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { api } from '@/lib/errors';
import { requireAuth } from '@/modules/auth/require-auth';
import { creatorApplications } from '@/modules/creators/schema';
import { distributorApplications } from '@/modules/distributors/schema';
import { workspaceKind } from '@/modules/workspaces/validation';

export const GET = api(async ({ req }) => {
  const db = getDb();
  const auth = await requireAuth(db);
  const kind = workspaceKind.parse(new URL(req.url).searchParams.get('kind'));
  const table = kind === 'CREATOR' ? creatorApplications : distributorApplications;
  const [application] = await db.select({ id: table.id, status: table.status, reviewNote: table.reviewNote }).from(table).where(eq(table.userId, auth.userId)).orderBy(desc(table.createdAt)).limit(1);
  return NextResponse.json({ application: application ?? null }, { headers: { 'Cache-Control': 'no-store' } });
});
