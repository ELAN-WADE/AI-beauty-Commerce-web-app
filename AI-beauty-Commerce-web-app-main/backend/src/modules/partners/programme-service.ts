import { and, desc, eq, getTableColumns } from 'drizzle-orm';
import type { Db } from '../../db/client';
import { Errors } from '../../lib/errors';
import { workspaceRecords } from '../workspaces/schema';
import { roles, userRoles, users } from '../auth/schema';
import { audit } from '../audit/service';
import { programmeFor } from './programmes';
import { enqueueNotification } from '../notifications/service';
const APPLICATION = 'PROGRAMME_APPLICATION', SUBMISSION = 'PROGRAMME_SUBMISSION';
export async function listProgrammeRecords(db: Db, ownerId?: string) {
  if (!ownerId) return db.select({ ...getTableColumns(workspaceRecords), ownerEmail: users.email }).from(workspaceRecords).leftJoin(users, eq(users.id, workspaceRecords.ownerId)).where(eq(workspaceRecords.kind, APPLICATION)).orderBy(desc(workspaceRecords.createdAt)).limit(200);
  const rows = await db.select().from(workspaceRecords).where(ownerId
    ? and(eq(workspaceRecords.ownerId, ownerId), eq(workspaceRecords.kind, APPLICATION))
    : eq(workspaceRecords.kind, APPLICATION)).orderBy(desc(workspaceRecords.createdAt)).limit(200);
  return rows;
}
export async function applyProgramme(db: Db, ownerId: string, programmeId: string, summary: string) {
  const programme = programmeFor(programmeId); if (!programme) throw Errors.badRequest('Unknown programme.');
  const key = `partner-programme:${ownerId}:${programme.id}`;
  return db.transaction(async tx => {
    const [created] = await tx.insert(workspaceRecords).values({ ownerId, audience: 'ADMIN', kind: APPLICATION, title: programme.name, body: summary,
      status: 'PENDING', idempotencyKey: key, data: { details: { programme: programme.id } } }).onConflictDoNothing().returning();
    if (created) return created;
    const [existing] = await tx.select().from(workspaceRecords).where(eq(workspaceRecords.idempotencyKey, key));
    return existing;
  });
}
export async function reviewProgramme(db: Db, adminId: string, id: string, approve: boolean, note: string, verificationReference = '', agreementReference = '') {
  return db.transaction(async tx => {
    const [row] = await tx.select().from(workspaceRecords).where(and(eq(workspaceRecords.id, id), eq(workspaceRecords.kind, APPLICATION))).for('update');
    if (!row || !row.ownerId) throw Errors.notFound();
    if (row.status !== 'PENDING') throw Errors.conflict('This application has already been reviewed.');
    const programme = programmeFor(String(row.data.details?.programme)); if (!programme) throw Errors.badRequest();
    if (approve && (!verificationReference.trim() || !agreementReference.trim())) throw Errors.badRequest('Record completed verification and agreement references before approval.');
    const [updated] = await tx.update(workspaceRecords).set({ status: approve ? 'APPROVED' : 'REJECTED', reviewNote: note, updatedAt: new Date(), version: row.version + 1,
      data: { details: { ...row.data.details, verificationReference, agreementReference, reviewedBy: adminId } } }).where(eq(workspaceRecords.id, id)).returning();
    if (approve) {
      await tx.insert(roles).values({ id: programme.role }).onConflictDoNothing();
      await tx.insert(userRoles).values({ userId: row.ownerId, roleId: programme.role, grantedBy: adminId }).onConflictDoNothing();
    }
    await audit(tx, { actorId: adminId, action: approve ? 'programme.approve' : 'programme.reject', entityType: APPLICATION, entityId: id, after: { programme: programme.id, approve, note } });
    await enqueueNotification(tx, { userId: row.ownerId, channel: 'email', template: 'partner.programme-reviewed', payload: { applicationId: id, version: updated.version } });
    return updated;
  });
}
export async function programmeActivity(db: Db, ownerId: string, programmeId: string, input?: { title: string; body: string; url: string; idempotencyKey: string }) {
  const programme = programmeFor(programmeId); if (!programme) throw Errors.badRequest();
  return db.transaction(async tx => {
    const [membership] = await tx.select().from(workspaceRecords).where(and(eq(workspaceRecords.ownerId, ownerId), eq(workspaceRecords.kind, APPLICATION), eq(workspaceRecords.idempotencyKey, `partner-programme:${ownerId}:${programme.id}`))).for('update');
    const [role] = await tx.select().from(userRoles).where(and(eq(userRoles.userId, ownerId), eq(userRoles.roleId, programme.role)));
    if (!membership || membership.status !== 'APPROVED' || !role) throw Errors.forbidden('Programme approval is required.');
    if (input) {
      const key = `programme-activity:${ownerId}:${programme.id}:${input.idempotencyKey}`;
      const [created] = await tx.insert(workspaceRecords).values({ title: input.title, body: input.body, url: input.url, idempotencyKey: key, ownerId, parentId: membership.id, audience: 'ADMIN', kind: SUBMISSION, status: 'SUBMITTED', data: { details: { programme: programme.id } } }).onConflictDoNothing().returning();
      if (created) return [created];
      const [record] = await tx.select().from(workspaceRecords).where(eq(workspaceRecords.idempotencyKey, key));
      if (record.title !== input.title || record.body !== input.body || record.url !== input.url) throw Errors.conflict('This submission key was already used for different content.');
      return [record];
    }
    return tx.select().from(workspaceRecords).where(and(eq(workspaceRecords.ownerId, ownerId), eq(workspaceRecords.parentId, membership.id), eq(workspaceRecords.kind, SUBMISSION))).orderBy(desc(workspaceRecords.createdAt)).limit(100);
  });
}

export async function listProgrammeSubmissions(db: Db) {
  return db.select().from(workspaceRecords).where(eq(workspaceRecords.kind, SUBMISSION)).orderBy(desc(workspaceRecords.createdAt)).limit(200);
}
export async function reviewProgrammeSubmission(db: Db, adminId: string, id: string, approve: boolean, note: string) {
  return db.transaction(async tx => {
    const [row] = await tx.select().from(workspaceRecords).where(and(eq(workspaceRecords.id, id), eq(workspaceRecords.kind, SUBMISSION))).for('update');
    if (!row) throw Errors.notFound();
    if (row.status !== 'SUBMITTED') throw Errors.conflict('This activity has already been reviewed.');
    const [updated] = await tx.update(workspaceRecords).set({ status: approve ? 'APPROVED' : 'REJECTED', reviewNote: note, updatedAt: new Date(), version: row.version + 1 }).where(eq(workspaceRecords.id, id)).returning();
    await audit(tx, { actorId: adminId, action: 'programme.activity-reviewed', entityType: SUBMISSION, entityId: id, after: { approve, note } });
    return updated;
  });
}
