import { NextResponse } from 'next/server';
import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { api } from '@/lib/errors';
import { workspaceRecords } from '@/modules/workspaces/schema';

export const GET = api(async () => {
  const db = getDb();
  const updates = await db.select({ id: workspaceRecords.id, title: workspaceRecords.title, body: workspaceRecords.body, url: workspaceRecords.url }).from(workspaceRecords).where(and(isNull(workspaceRecords.ownerId), eq(workspaceRecords.status, 'PUBLISHED'), eq(workspaceRecords.audience, 'ALL'), inArray(workspaceRecords.kind, ['CMS', 'ANNOUNCEMENT']))).orderBy(desc(workspaceRecords.updatedAt)).limit(10);
  return NextResponse.json({ updates }, { headers: { 'Cache-Control': 'no-store' } });
});
