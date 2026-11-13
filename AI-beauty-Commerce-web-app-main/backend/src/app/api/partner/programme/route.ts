import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api } from '@/lib/errors';
import { requireAuth } from '@/modules/auth/require-auth';
import { additionalProgramme, programmeCommand } from '@/modules/partners/programme-validation';
import { programmeWorkspace, writeProgramme } from '@/modules/partners/programme-memberships';
const headers = { 'Cache-Control': 'private, no-store' };
export const GET = api(async ({ req }) => { const db = getDb(); const auth = await requireAuth(db, 'CUSTOMER'); const programme = additionalProgramme.parse(new URL(req.url).searchParams.get('programme')); return NextResponse.json(await programmeWorkspace(db, auth.userId, programme), { headers }); });
export const POST = api(async ({ req }) => { const db = getDb(); const auth = await requireAuth(db, 'CUSTOMER'); return NextResponse.json({ result: await writeProgramme(db, auth.userId, programmeCommand.parse(await req.json())) }, { headers }); });
