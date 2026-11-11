import { NextResponse } from 'next/server';
import { z } from 'zod';
import { api, readJson } from '@/lib/errors';
import { getDb } from '@/db/client';
import { requirePerm } from '@/lib/admin';
import { listProgrammeRecords, reviewProgramme, listProgrammeSubmissions, reviewProgrammeSubmission } from '@/modules/partners/programme-service';
const review = z.object({ type: z.enum(['application','submission']).default('application'), id: z.string().uuid(), approve: z.boolean(), note: z.string().trim().min(3).max(500), verificationReference: z.string().trim().max(200).default(''), agreementReference: z.string().trim().max(200).default('') }).strict();
export const GET = api(async () => { const db = getDb(); await requirePerm(db, 'partners:review'); return NextResponse.json({ records: await listProgrammeRecords(db), submissions: await listProgrammeSubmissions(db) }, { headers: { 'Cache-Control': 'private, no-store' } }); });
export const POST = api(async ({ req }) => { const db = getDb(), auth = await requirePerm(db, 'partners:review'), input = review.parse(await readJson(req, 4096)); return NextResponse.json({ record: await (input.type === 'submission' ? reviewProgrammeSubmission(db, auth.userId, input.id, input.approve, input.note) : reviewProgramme(db, auth.userId, input.id, input.approve, input.note, input.verificationReference, input.agreementReference)) }); });
