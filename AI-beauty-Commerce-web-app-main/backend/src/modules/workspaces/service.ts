import { and, desc, eq, inArray, isNull, or, sql } from 'drizzle-orm';
import type { Db } from '../../db/client';
import { Errors } from '../../lib/errors';
import { ownedPartner } from '../partners/service';
import { creators } from '../creators/schema';
import { distributors } from '../distributors/schema';
import { inventoryLocations } from '../inventory/schema';
import { products } from '../catalog/schema';
import { communityPosts } from '../community/schema';
import { profiles as accountProfiles } from '../users/schema';
import { audit } from '../audit/service';
import { workspaceRecords } from './schema';
import { workspaceCommand, adminWorkspaceCommand } from './validation';
import type { z } from 'zod';

type PartnerInput = z.infer<typeof workspaceCommand>;
type AdminInput = z.infer<typeof adminWorkspaceCommand>;

export async function workspaceView(db: Db, userId: string, kind: 'CREATOR' | 'DISTRIBUTOR') {
  await ownedPartner(db, userId, kind);
  const records = await db.select().from(workspaceRecords).where(or(
    and(eq(workspaceRecords.ownerId, userId), eq(workspaceRecords.audience, kind)),
    and(isNull(workspaceRecords.ownerId), inArray(workspaceRecords.audience, [kind, 'ALL']), eq(workspaceRecords.status, 'PUBLISHED')),
  )).orderBy(desc(workspaceRecords.updatedAt)).limit(250);
  const kits = records.filter(record => record.kind === 'PR_BOX' && !record.ownerId);
  const allocations = kits.length ? await db.select({ parentId: workspaceRecords.parentId, used: sql<number>`count(*)::int` }).from(workspaceRecords).where(and(inArray(workspaceRecords.parentId, kits.map(kit => kit.id)), eq(workspaceRecords.kind, 'PR_REQUEST'), inArray(workspaceRecords.status, ['SUBMITTED', 'APPROVED', 'DISPATCHED', 'DELIVERED']))).groupBy(workspaceRecords.parentId) : [];
  const used = new Map(allocations.map(row => [row.parentId, row.used]));
  return { records: records.map(record => {
    const capacity = record.data.details?.spotsLeft;
    return record.kind === 'PR_BOX' && !record.ownerId && typeof capacity === 'number' && capacity >= 0
      ? { ...record, data: { ...record.data, details: { ...record.data.details, spotsLeft: Math.max(0, capacity - (used.get(record.id) || 0)) } } } : record;
  }) };
}

async function validateProducts(db: Db, ids: string[]) {
  if (!ids.length) return;
  const found = await db.select({ slug: products.slug }).from(products).where(and(inArray(products.slug, ids), eq(products.isActive, true)));
  if (new Set(ids).size !== ids.length || found.length !== ids.length) throw Errors.badRequest('Choose active catalogue products.');
}

export async function workspaceWrite(db: Db, userId: string, input: PartnerInput, key: string) {
  return db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`workspace:${key}`}, 0))`);
    const partner = await ownedPartner(tx, userId, input.kind);
    if (input.action === 'archive') {
      const [record] = await tx.select().from(workspaceRecords).where(and(eq(workspaceRecords.id, input.id), eq(workspaceRecords.ownerId, userId), eq(workspaceRecords.kind, 'CONTENT'))).for('update');
      if (!record) throw Errors.notFound();
      if (record.version !== input.version || !['DRAFT', 'REJECTED'].includes(record.status)) throw Errors.conflict('Only current drafts or rejected content can be archived.');
      const [updated] = await tx.update(workspaceRecords).set({ status: 'ARCHIVED', version: record.version + 1, updatedAt: new Date() }).where(eq(workspaceRecords.id, record.id)).returning();
      await audit(tx, { actorId: userId, action: 'partner.content.archive', entityType: 'workspace', entityId: record.id });
      return updated;
    }
    if (input.action === 'deliver') {
      const [entry] = await tx.select().from(workspaceRecords).where(and(eq(workspaceRecords.id, input.id), eq(workspaceRecords.ownerId, userId), eq(workspaceRecords.kind, 'CAMPAIGN_ENTRY'))).for('update');
      if (!entry) throw Errors.notFound();
      if (entry.version !== input.version || !['APPROVED', 'REJECTED'].includes(entry.status)) throw Errors.conflict('This entry is not ready for a deliverable.');
      const [updated] = await tx.update(workspaceRecords).set({ url: input.url, body: input.body, status: 'DELIVERABLE_SUBMITTED', updatedAt: new Date(), version: entry.version + 1 }).where(eq(workspaceRecords.id, entry.id)).returning();
      await audit(tx, { actorId: userId, action: 'partner.campaign.deliver', entityType: 'workspace', entityId: entry.id });
      return updated;
    }
    if (input.action === 'profile') {
      if (input.kind === 'CREATOR') {
        await tx.update(creators).set({ name: input.name, handle: input.handle, updatedAt: new Date() }).where(eq(creators.id, partner.profile.id));
        await tx.insert(accountProfiles).values({ userId, displayName: input.name, ...(input.phone ? { phone: input.phone } : {}) }).onConflictDoUpdate({ target: accountProfiles.userId, set: { displayName: input.name, ...(input.phone ? { phone: input.phone } : {}), updatedAt: new Date() } });
      } else {
        await tx.update(distributors).set({ name: input.name, address: input.address, phone: input.phone, operatingHours: input.operatingHours, ...(input.pickupEnabled === undefined ? {} : { pickupAvailable: input.pickupEnabled }), updatedAt: new Date() }).where(eq(distributors.id, partner.profile.id));
        await tx.update(inventoryLocations).set({ address: input.address, phone: input.phone, operatingHours: input.operatingHours, ...(input.pickupEnabled === undefined ? {} : { pickupEnabled: input.pickupEnabled }), ...(input.deliveryEnabled === undefined ? {} : { deliveryEnabled: input.deliveryEnabled }) }).where(eq(inventoryLocations.id, partner.location!.id));
      }
      await audit(tx, { actorId: userId, action: 'partner.profile.update', entityType: 'partner', entityId: partner.profile.id });
      return { saved: true };
    }
    await validateProducts(tx, input.productIds);
    const [existing] = await tx.select().from(workspaceRecords).where(eq(workspaceRecords.idempotencyKey, key));
    if (existing) {
      if (existing.ownerId !== userId || existing.audience !== input.kind || existing.title !== input.title || existing.body !== input.body || existing.url !== input.url || (input.action !== 'apply' && JSON.stringify(existing.data.productIds ?? []) !== JSON.stringify(input.productIds)) || (input.action === 'apply' ? existing.parentId !== input.publicationId : existing.kind !== input.type || existing.status !== input.status)) throw Errors.conflict('Idempotency key reused with different input.');
      return existing;
    }
    let parent: typeof workspaceRecords.$inferSelect | undefined;
    if (input.action === 'apply') {
      [parent] = await tx.select().from(workspaceRecords).where(eq(workspaceRecords.id, input.publicationId)).for('update');
      if (!parent || parent.ownerId || parent.status !== 'PUBLISHED' || !['CAMPAIGN', 'PR_BOX'].includes(parent.kind) || ![input.kind, 'ALL'].includes(parent.audience)) throw Errors.notFound('This opportunity is no longer open.');
      if (parent.kind === 'PR_BOX') {
        if (input.body.trim().length < 10) throw Errors.badRequest('Provide your PR delivery address and contact details.');
        const capacity = parent.data.details?.spotsLeft;
        if (typeof capacity === 'number' && capacity >= 0) {
          const [allocation] = await tx.select({ used: sql<number>`count(*)::int` }).from(workspaceRecords).where(and(eq(workspaceRecords.parentId, parent.id), eq(workspaceRecords.kind, 'PR_REQUEST'), inArray(workspaceRecords.status, ['SUBMITTED', 'APPROVED', 'DISPATCHED', 'DELIVERED'])));
          if ((allocation?.used || 0) >= capacity) throw Errors.conflict('All available kits have already been requested.');
        }
        await validateProducts(tx, parent.data.productIds || []);
      }
      const [duplicate] = await tx.select().from(workspaceRecords).where(and(eq(workspaceRecords.ownerId, userId), eq(workspaceRecords.parentId, parent.id)));
      if (duplicate) throw Errors.conflict('You have already applied.');
    }
    if (input.action === 'save' && input.kind !== 'CREATOR' && input.type !== 'SUPPORT') throw Errors.forbidden();
    if (input.action === 'save' && input.id) {
      const [record] = await tx.select().from(workspaceRecords).where(and(eq(workspaceRecords.id, input.id), eq(workspaceRecords.ownerId, userId), eq(workspaceRecords.audience, input.kind))).for('update');
      if (!record) throw Errors.notFound();
      if (record.version !== input.version || record.kind !== input.type || !['DRAFT', 'REJECTED'].includes(record.status)) throw Errors.conflict('This record changed. Refresh before editing.');
      const [updated] = await tx.update(workspaceRecords).set({ title: input.title, body: input.body, url: input.url, status: input.status, data: { productIds: input.productIds }, version: record.version + 1, updatedAt: new Date() }).where(eq(workspaceRecords.id, record.id)).returning();
      await audit(tx, { actorId: userId, action: 'partner.workspace.update', entityType: 'workspace', entityId: record.id });
      return updated;
    }
    const [record] = await tx.insert(workspaceRecords).values({ ownerId: userId, audience: input.kind, kind: input.action === 'apply' ? parent!.kind === 'PR_BOX' ? 'PR_REQUEST' : 'CAMPAIGN_ENTRY' : input.type, parentId: parent?.id, title: input.title, body: input.body, url: input.url, status: input.action === 'apply' ? 'SUBMITTED' : input.status, data: { productIds: parent ? parent.data.productIds || [] : input.productIds }, idempotencyKey: key }).returning();
    await audit(tx, { actorId: userId, action: 'partner.workspace.create', entityType: 'workspace', entityId: record.id });
    return record;
  });
}

export async function adminWorkspaceWrite(db: Db, actorId: string, input: AdminInput, key: string) {
  return db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`workspace:${key}`}, 0))`);
    if (input.action === 'publish') {
      await validateProducts(tx, input.productIds);
      if (input.id) {
        const [record] = await tx.select().from(workspaceRecords).where(and(eq(workspaceRecords.id, input.id), isNull(workspaceRecords.ownerId))).for('update');
        if (!record) throw Errors.notFound();
        if (record.version !== input.version) throw Errors.conflict('Publication changed. Refresh before editing.');
        const [updated] = await tx.update(workspaceRecords).set({ title: input.title, body: input.body, url: input.url, audience: input.audience, kind: input.type, status: input.active ? 'PUBLISHED' : 'ARCHIVED', data: { productIds: input.productIds, details: input.details }, updatedAt: new Date(), version: record.version + 1 }).where(eq(workspaceRecords.id, record.id)).returning();
        await audit(tx, { actorId, action: 'workspace.publication.update', entityType: 'workspace', entityId: updated.id });
        return updated;
      }
      const [created] = await tx.insert(workspaceRecords).values({ audience: input.audience, kind: input.type, title: input.title, body: input.body, url: input.url, status: input.active ? 'PUBLISHED' : 'ARCHIVED', data: { productIds: input.productIds, details: input.details }, idempotencyKey: key }).onConflictDoNothing().returning();
      if (!created) throw Errors.conflict('This publication was already saved. Refresh to see it.');
      await audit(tx, { actorId, action: 'workspace.publication.create', entityType: 'workspace', entityId: created.id });
      return created;
    }
    const [record] = await tx.select().from(workspaceRecords).where(eq(workspaceRecords.id, input.id)).for('update');
    if (!record || !record.ownerId) throw Errors.notFound();
    if (record.version !== input.version) throw Errors.conflict('This request changed. Refresh before reviewing.');
    const allowed: Record<string, string[]> = { SUBMITTED: ['APPROVED', 'REJECTED', 'RESOLVED'], DELIVERABLE_SUBMITTED: ['APPROVED', 'REJECTED'], APPROVED: ['DISPATCHED'], DISPATCHED: ['DELIVERED'] };
    if (!allowed[record.status]?.includes(input.status) || (['DISPATCHED', 'DELIVERED'].includes(input.status) && record.kind !== 'PR_REQUEST') || (input.status === 'RESOLVED' && record.kind !== 'SUPPORT')) throw Errors.conflict('Invalid review transition.');
    let data = record.data;
    if (record.kind === 'PR_REQUEST' && input.status === 'DISPATCHED') {
      data = { ...data, shipping: { trackingReference: input.note, dispatchedAt: new Date().toISOString() } };
    }
    if (record.kind === 'PR_REQUEST' && input.status === 'DELIVERED' && data.shipping) {
      data = { ...data, shipping: { ...data.shipping, deliveredAt: new Date().toISOString() } };
    }
    if (record.kind === 'CONTENT' && input.status === 'APPROVED') {
      const partner = await ownedPartner(tx, record.ownerId, 'CREATOR');
      const ids = Array.isArray(record.data.productIds) ? record.data.productIds as string[] : [];
      await validateProducts(tx, ids);
      const [tagged] = ids.length ? await tx.select({ id: products.id }).from(products).where(eq(products.slug, ids[0])).limit(1) : [];
      const mediaType = /\.(mp4|mov|webm|m4v)(?:$|[?#])/i.test(record.url) ? 'video' : /\.(png|jpe?g|webp|gif)(?:$|[?#])/i.test(record.url) ? 'image' : null;
      const [post] = await tx.insert(communityPosts).values({ userId: record.ownerId, creatorId: partner.profile.id, authorName: partner.profile.name, content: `${record.title}\n\n${record.body}${record.url ? `\n${record.url}` : ''}`, mediaType, mediaUrl: mediaType ? record.url : null, taggedProductId: tagged?.id, authorRole: 'Creator', rewardEligible: false }).returning({ id: communityPosts.id });
      data = { ...data, communityPostId: post.id };
    }
    const [updated] = await tx.update(workspaceRecords).set({ status: input.status, reviewNote: input.note, data, version: record.version + 1, updatedAt: new Date() }).where(eq(workspaceRecords.id, record.id)).returning();
    await audit(tx, { actorId, action: 'workspace.review', entityType: 'workspace', entityId: record.id, after: { status: input.status, note: input.note } });
    return updated;
  });
}
