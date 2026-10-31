import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { api, ApiError } from '@/lib/errors';
import { databaseDiagnostics } from '@/lib/database-diagnostics';

/** Readiness: server-side SQL timeout avoids accumulating uncancelled probes. */
export const GET = api(async ({ requestId }) => {
  const db = getDb();
  try {
    await db.transaction(async tx => {
      await tx.execute(sql`set local statement_timeout = '2000ms'`);
      await tx.execute(sql`select 1`);
    });
  } catch (error) {
    console.error(JSON.stringify({ level: 'error', requestId, event: 'database_readiness_failed', ...databaseDiagnostics(error) }));
    throw new ApiError(503, 'not_ready', 'Database unreachable.', true);
  }
  return NextResponse.json({ ok: true, db: 'up' });
});
