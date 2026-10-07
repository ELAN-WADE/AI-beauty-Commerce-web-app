import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { api, ApiError } from '@/lib/errors';

/** Readiness: server-side SQL timeout avoids accumulating uncancelled probes. */
export const GET = api(async () => {
  const db = getDb();
  try {
    await db.transaction(async tx => {
      await tx.execute(sql`set local statement_timeout = '2000ms'`);
      await tx.execute(sql`select 1`);
    });
  } catch {
    throw new ApiError(503, 'not_ready', 'Database unreachable.', true);
  }
  return NextResponse.json({ ok: true, db: 'up' });
});
