import { NextResponse } from 'next/server';
import { z } from 'zod';
import { api, readJson, Errors } from '@/lib/errors';
import { getDb } from '@/db/client';
import { requireAuth } from '@/modules/auth/require-auth';
import { acceptPartnerPolicy } from '@/modules/partners/policy';
import { PARTNER_TERMS_VERSION } from '@/storefront/lib/partner-terms';
export const POST = api(async ({ req }) => {
 const db = getDb(), auth = await requireAuth(db, 'CUSTOMER');
 if (!auth.emailVerified) throw Errors.forbidden('Verify your email before accepting programme policies.');
 const input = z.object({ kind: z.enum(['CREATOR','DISTRIBUTOR','INFLUENCER']), version: z.literal(PARTNER_TERMS_VERSION), accepted: z.literal(true) }).strict().parse(await readJson(req));
 await acceptPartnerPolicy(db, auth.userId, input.kind);
 return NextResponse.json({ accepted: true, version: PARTNER_TERMS_VERSION }, { headers: { 'Cache-Control': 'private, no-store' } });
});
