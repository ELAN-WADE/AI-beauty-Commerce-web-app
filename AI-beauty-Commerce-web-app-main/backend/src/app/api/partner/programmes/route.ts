import { NextResponse } from 'next/server';
import { z } from 'zod';
import { api, readJson } from '@/lib/errors';
import { getDb } from '@/db/client';
import { requireAuth } from '@/modules/auth/require-auth';
import { applyProgramme, listProgrammeRecords, programmeActivity } from '@/modules/partners/programme-service';
const command = z.discriminatedUnion('action', [
  z.object({ action: z.literal('apply'), programme: z.string().max(30), summary: z.string().trim().min(20).max(3000) }).strict(),
  z.object({ action: z.literal('submit'), idempotencyKey: z.string().uuid(), programme: z.string().max(30), title: z.string().trim().min(3).max(160), body: z.string().trim().min(10).max(5000), url: z.union([z.literal(''), z.string().url().refine(value => new URL(value).protocol === 'https:')]).default('') }).strict(),
]);
export const GET = api(async ({ req }) => {
  const db = getDb(), auth = await requireAuth(db, 'CUSTOMER');
  const programme = new URL(req.url).searchParams.get('programme');
  const records = programme ? await programmeActivity(db, auth.userId, programme) : (await listProgrammeRecords(db, auth.userId)).map(row => ({ id: row.id, status: row.status, title: row.title, body: row.body, reviewNote: row.reviewNote, programme: row.data.details?.programme }));
  return NextResponse.json({ records }, { headers: { 'Cache-Control': 'private, no-store' } });
});
export const POST = api(async ({ req }) => {
  const db = getDb(), auth = await requireAuth(db, 'CUSTOMER'), input = command.parse(await readJson(req, 8192));
  const result = input.action === 'apply' ? await applyProgramme(db, auth.userId, input.programme, input.summary) : await programmeActivity(db, auth.userId, input.programme, input);
  return NextResponse.json({ result }, { headers: { 'Cache-Control': 'private, no-store' } });
});
