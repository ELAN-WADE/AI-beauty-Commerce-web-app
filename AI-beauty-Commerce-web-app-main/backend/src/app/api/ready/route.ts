import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { api, ApiError } from '@/lib/errors';

/** Readiness: pings owned Postgres with a 2s budget (LB/K8s gate, §23). */
export const GET = api(async () => {
  const db = getDb();
  const ping = db.execute(sql`select 1`);
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('db ping timeout')), 2000),
  );
  try {
    await Promise.race([ping, timeout]);
  } catch {
    throw new ApiError(503, 'not_ready', 'Database unreachable.', true);
  }
  return NextResponse.json({ ok: true, db: 'up' });
});
