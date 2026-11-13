import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api } from '@/lib/errors';
import { requireAuth } from '@/modules/auth/require-auth';
import { partnerProgrammes } from '@/modules/partners/programmes';

export const GET = api(async () => {
  const db = getDb();
  const auth = await requireAuth(db, 'CUSTOMER');
  return NextResponse.json({ programmes: await partnerProgrammes(db, auth.userId) },
    { headers: { 'Cache-Control': 'private, no-store' } });
});
