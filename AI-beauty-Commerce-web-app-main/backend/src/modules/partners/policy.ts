import { and, eq } from 'drizzle-orm';
import type { Db } from '@/db/client';
import { workspaceRecords } from '@/modules/workspaces/schema';
import { Errors } from '@/lib/errors';
import { PARTNER_TERMS_VERSION, partnerTerms, type PartnerTermsKind } from '@/storefront/lib/partner-terms';
export const policyKey = (user: string, kind: string) => `partner-policy:${user}:${kind}:${PARTNER_TERMS_VERSION}`;
export async function acceptPartnerPolicy(db: Db, user: string, kind: PartnerTermsKind) {
 await db.insert(workspaceRecords).values({ ownerId: user, audience: kind, kind: 'PARTNER_POLICY_ACCEPTANCE', title: 'Programme terms and conduct policy', status: 'ACCEPTED', body: partnerTerms(kind), idempotencyKey: policyKey(user, kind), data: { details: { policyVersion: PARTNER_TERMS_VERSION, acceptedAt: new Date().toISOString() } } }).onConflictDoNothing();
}
export async function requirePartnerPolicy(db: Db, user: string, kind: PartnerTermsKind) {
 const [row] = await db.select({ id: workspaceRecords.id }).from(workspaceRecords).where(and(eq(workspaceRecords.ownerId,user),eq(workspaceRecords.idempotencyKey,policyKey(user,kind)),eq(workspaceRecords.status,'ACCEPTED'))).limit(1);
 if (!row) throw Errors.forbidden('Read and accept the current programme terms and policies before applying.');
}
