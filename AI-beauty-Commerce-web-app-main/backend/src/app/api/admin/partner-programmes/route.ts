import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api } from '@/lib/errors';
import { requirePerm } from '@/lib/admin';
import { adminProgrammeCommand } from '@/modules/partners/programme-validation';
import { adminProgrammeList, programmePendingCount, reviewProgramme } from '@/modules/partners/programme-memberships';
const headers = { 'Cache-Control': 'private, no-store' };
export const GET = api(async ({ req }) => { const db = getDb(); await requirePerm(db, 'partners:review'); return NextResponse.json(new URL(req.url).searchParams.get('summary') === '1' ? { pending: await programmePendingCount(db) } : await adminProgrammeList(db), { headers }); });
export const POST = api(async ({ req }) => { const db = getDb(); const actor = await requirePerm(db, 'partners:review'); return NextResponse.json({ result: await reviewProgramme(db, actor.userId, adminProgrammeCommand.parse(await req.json())) }, { headers }); });
