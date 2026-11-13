import { and, eq, sql } from 'drizzle-orm';
import type { Db } from '../../db/client';
import { ownedPartner } from '../partners/service';
import { workspaceRecords } from '../workspaces/schema';
import { normalizeProfileLink, type LinkProvider } from './profile-link';
export async function profileLinks(db: Db, userId: string) {
  await ownedPartner(db, userId, 'CREATOR');
  const records = await db.select().from(workspaceRecords).where(and(eq(workspaceRecords.ownerId, userId), eq(workspaceRecords.kind, 'SOCIAL_PROFILE_LINK')));
  return records.map(row => ({ provider: row.title as LinkProvider, ...normalizeProfileLink(row.title as LinkProvider, row.url), verified: false as const }));
}
export async function saveProfileLink(db: Db, userId: string, provider: LinkProvider, value: string | null) {
  await ownedPartner(db, userId, 'CREATOR');
  const key = `social-profile-link:${userId}:${provider}`;
  if (value === null) { await db.delete(workspaceRecords).where(and(eq(workspaceRecords.ownerId,userId), eq(workspaceRecords.idempotencyKey,key))); return; }
  const profile = normalizeProfileLink(provider, value);
  await db.insert(workspaceRecords).values({ ownerId:userId, audience:'CREATOR',kind:'SOCIAL_PROFILE_LINK',title:provider,url:profile.profileUrl,status:'ACTIVE',idempotencyKey:key })
    .onConflictDoUpdate({target:workspaceRecords.idempotencyKey,set:{url:profile.profileUrl,updatedAt:new Date(),version:sql`${workspaceRecords.version} + 1`}});
}
