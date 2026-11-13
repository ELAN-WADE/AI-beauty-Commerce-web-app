import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import type { Db } from '@/db/client';
import { Errors } from '@/lib/errors';
import { users, roles, userRoles } from '@/modules/auth/schema';
import { workspaceRecords } from '@/modules/workspaces/schema';
import { audit } from '@/modules/audit/service';
import { enqueueNotification } from '@/modules/notifications/service';
import { programmeDefinitions, type AdditionalProgramme } from '@/storefront/lib/partner-programmes';
import { programmeCommand, adminProgrammeCommand } from './programme-validation';
import type { z } from 'zod';
export const PROGRAMME_REVIEW_TEMPLATE = 'partner.programme-reviewed';
const membershipKey = (userId: string, programme: AdditionalProgramme) => `programme:${userId}:${programme}`;
export async function programmeMembership(db: Db, userId: string, programme: AdditionalProgramme) {
  const [member] = await db.select().from(workspaceRecords).where(and(eq(workspaceRecords.idempotencyKey, membershipKey(userId, programme)), eq(workspaceRecords.ownerId, userId), eq(workspaceRecords.kind, 'PARTNER_PROGRAMME'), eq(workspaceRecords.audience, programme))).limit(1);
  return member ?? null;
}
export async function requireProgrammeAccess(db: Db, userId: string, programme: AdditionalProgramme) {
  const member = await programmeMembership(db, userId, programme);
  const detail = member?.data.details;
  const [role] = await db.select().from(userRoles).where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, programme))).limit(1);
  if (!member || member.status !== 'APPROVED' || !role || !detail?.verified || !detail.agreementVersion || detail.acceptedAgreementVersion !== detail.agreementVersion) throw Errors.forbidden('Programme approval, verification and agreement acceptance are required.');
  return member;
}
export async function programmeWorkspace(db: Db, userId: string, programme: AdditionalProgramme) {
  const membership = await programmeMembership(db, userId, programme);
  let canOperate = false;
  try { await requireProgrammeAccess(db, userId, programme); canOperate = true; } catch (error) { if (!(error instanceof Error && 'status' in error && error.status === 403)) throw error; }
  const tasks = canOperate && membership ? await db.select().from(workspaceRecords).where(and(eq(workspaceRecords.ownerId, userId), eq(workspaceRecords.audience, programme), eq(workspaceRecords.parentId, membership.id), eq(workspaceRecords.kind, 'PROGRAMME_TASK'))).orderBy(desc(workspaceRecords.createdAt)).limit(100) : [];
  const submissions = tasks.length ? await db.select().from(workspaceRecords).where(and(eq(workspaceRecords.ownerId, userId), eq(workspaceRecords.audience, programme), eq(workspaceRecords.kind, 'PROGRAMME_SUBMISSION'), inArray(workspaceRecords.parentId, tasks.map(task => task.id)))).limit(100) : [];
  return { membership: membership ? { id: membership.id, status: membership.status, name: membership.title, motivation: membership.body, profileUrl: membership.url, reviewNote: membership.reviewNote, version: membership.version, agreement: String(membership.data.details?.agreement ?? ''), agreementVersion: Number(membership.data.details?.agreementVersion ?? 0), acceptedAgreementVersion: Number(membership.data.details?.acceptedAgreementVersion ?? 0) } : null, canOperate, tasks, submissions };
}
export async function writeProgramme(db: Db, userId: string, input: z.infer<typeof programmeCommand>) {
  return db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${membershipKey(userId, input.programme)}, 0))`);
    const member = await programmeMembership(tx, userId, input.programme);
    if (member) await tx.select({ id: workspaceRecords.id }).from(workspaceRecords).where(eq(workspaceRecords.id, member.id)).for('update');
    if (input.action === 'apply') {
      const [user] = await tx.select().from(users).where(eq(users.id, userId));
      if (!user?.emailVerifiedAt) throw Errors.forbidden('Verify your account email before applying.');
      if (member && ['SUBMITTED','APPROVED'].includes(member.status)) throw Errors.conflict('An active application or membership already exists for this programme.');
      const values = { title: input.name, body: input.motivation, url: input.profileUrl, status: 'SUBMITTED', reviewNote: '', data: { details: {} }, updatedAt: new Date() };
      const [saved] = member ? await tx.update(workspaceRecords).set({ ...values, version: member.version + 1 }).where(eq(workspaceRecords.id, member.id)).returning() : await tx.insert(workspaceRecords).values({ ...values, kind: 'PARTNER_PROGRAMME', ownerId: userId, audience: input.programme, idempotencyKey: membershipKey(userId, input.programme) }).returning();
      await audit(tx, { actorId: userId, action: 'partner.programme.apply', entityType: 'workspace', entityId: saved.id });
      return saved;
    }
    if (!member) throw Errors.notFound();
    if (input.action === 'accept') {
      const detail = member.data.details ?? {};
      if (member.status !== 'APPROVED' || member.version !== input.version || !detail.verified || !detail.agreement || !detail.agreementVersion) throw Errors.conflict('Refresh the current approved agreement before accepting.');
      if (detail.acceptedAgreementVersion === detail.agreementVersion) return { accepted: true };
      await tx.update(workspaceRecords).set({ data: { ...member.data, details: { ...detail, acceptedAgreementVersion: detail.agreementVersion, acceptedAt: new Date().toISOString() } }, version: member.version + 1, updatedAt: new Date() }).where(eq(workspaceRecords.id, member.id));
      await tx.insert(userRoles).values({ userId, roleId: input.programme }).onConflictDoNothing();
      await audit(tx, { actorId: userId, action: 'partner.programme.agreement.accept', entityType: 'workspace', entityId: member.id, after: { agreementVersion: detail.agreementVersion } });
      return { accepted: true };
    }
    await requireProgrammeAccess(tx, userId, input.programme);
    const [task] = await tx.select().from(workspaceRecords).where(and(eq(workspaceRecords.id, input.taskId), eq(workspaceRecords.parentId, member.id), eq(workspaceRecords.ownerId, userId), eq(workspaceRecords.audience, input.programme), eq(workspaceRecords.kind, 'PROGRAMME_TASK'))).for('update');
    if (!task) throw Errors.notFound();
    if (task.version !== input.version || !['ASSIGNED','CHANGES_REQUESTED'].includes(task.status)) throw Errors.conflict('This task is not open for submission. Refresh the workspace.');
    const key = `programme-delivery:${task.id}`;
    const [previous] = await tx.select().from(workspaceRecords).where(eq(workspaceRecords.idempotencyKey, key));
    const fields = { title: task.title, body: input.note, url: input.url, status: 'SUBMITTED', reviewNote: '', updatedAt: new Date() };
    const [saved] = previous ? await tx.update(workspaceRecords).set({ ...fields, version: previous.version + 1 }).where(eq(workspaceRecords.id, previous.id)).returning() : await tx.insert(workspaceRecords).values({ ...fields, ownerId: userId, audience: input.programme, kind: 'PROGRAMME_SUBMISSION', parentId: task.id, idempotencyKey: key }).returning();
    await tx.update(workspaceRecords).set({ status: 'SUBMITTED', version: task.version + 1, updatedAt: new Date() }).where(eq(workspaceRecords.id, task.id));
    await audit(tx, { actorId: userId, action: 'partner.programme.deliver', entityType: 'workspace', entityId: saved.id });
    return saved;
  });
}
export async function programmePendingCount(db: Db) {
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(workspaceRecords).where(and(eq(workspaceRecords.kind, 'PARTNER_PROGRAMME'), eq(workspaceRecords.audience, 'INFLUENCER'), eq(workspaceRecords.status, 'SUBMITTED')));
  return row.count;
}
export async function adminProgrammeList(db: Db) {
  const applications = await db.select({ record: workspaceRecords, email: users.email, emailVerifiedAt: users.emailVerifiedAt }).from(workspaceRecords).innerJoin(users, eq(users.id, workspaceRecords.ownerId)).where(eq(workspaceRecords.kind, 'PARTNER_PROGRAMME')).orderBy(desc(workspaceRecords.updatedAt)).limit(200);
  const records = await db.select().from(workspaceRecords).where(inArray(workspaceRecords.kind, ['PROGRAMME_TASK','PROGRAMME_SUBMISSION'])).orderBy(desc(workspaceRecords.updatedAt)).limit(500);
  return { applications: applications.map(row => ({ ...row.record, email: row.email, emailVerified: Boolean(row.emailVerifiedAt) })), tasks: records.filter(record => record.kind === 'PROGRAMME_TASK'), submissions: records.filter(record => record.kind === 'PROGRAMME_SUBMISSION') };
}
export async function reviewProgramme(db: Db, actorId: string, input: z.infer<typeof adminProgrammeCommand>) {
  return db.transaction(async tx => {
    const [found] = await tx.select().from(workspaceRecords).where(eq(workspaceRecords.id, input.id));
    if (!found || !found.ownerId || !['INFLUENCER'].includes(found.audience)) throw Errors.notFound();
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${membershipKey(found.ownerId, found.audience as AdditionalProgramme)}, 0))`);
    const [record] = await tx.select().from(workspaceRecords).where(eq(workspaceRecords.id, input.id)).for('update');
    if (!record) throw Errors.notFound();
    if (input.action === 'review-submission') {
      if (record.kind !== 'PROGRAMME_SUBMISSION' || record.status !== 'SUBMITTED' || record.version !== input.version) throw Errors.conflict('This submission has already changed.');
      const [task] = await tx.select().from(workspaceRecords).where(and(eq(workspaceRecords.id, record.parentId!), eq(workspaceRecords.kind, 'PROGRAMME_TASK'))).for('update');
      if (!task || task.ownerId !== record.ownerId || task.audience !== record.audience) throw Errors.notFound();
      await requireProgrammeAccess(tx, record.ownerId!, record.audience as AdditionalProgramme);
      await tx.update(workspaceRecords).set({ status: input.approved ? 'APPROVED' : 'REJECTED', reviewNote: input.note, version: record.version + 1, updatedAt: new Date() }).where(eq(workspaceRecords.id, record.id));
      await tx.update(workspaceRecords).set({ status: input.approved ? 'COMPLETED' : 'CHANGES_REQUESTED', reviewNote: input.note, version: task.version + 1, updatedAt: new Date() }).where(eq(workspaceRecords.id, task.id));
      await audit(tx, { actorId, action: 'partner.programme.submission.review', entityType: 'workspace', entityId: record.id, after: { approved: input.approved, note: input.note } });
      return { reviewed: true };
    }
    if (record.kind !== 'PARTNER_PROGRAMME' || !['INFLUENCER'].includes(record.audience) || !record.ownerId) throw Errors.notFound();
    const programme = record.audience as AdditionalProgramme;
    if (input.action === 'assign') {
      await requireProgrammeAccess(tx, record.ownerId, programme);
      const taskKey = `programme-task:${input.requestId}`;
      const [existing] = await tx.select().from(workspaceRecords).where(eq(workspaceRecords.idempotencyKey, taskKey));
      if (existing) {
        if (existing.parentId !== record.id || existing.ownerId !== record.ownerId || existing.title !== input.title || existing.body !== input.brief) throw Errors.conflict('Assignment request reused with different details.');
        return existing;
      }
      const [task] = await tx.insert(workspaceRecords).values({ ownerId: record.ownerId, audience: programme, kind: 'PROGRAMME_TASK', parentId: record.id, title: input.title, body: input.brief, status: 'ASSIGNED', idempotencyKey: taskKey }).returning();
      await audit(tx, { actorId, action: 'partner.programme.task.assign', entityType: 'workspace', entityId: task.id });
      return task;
    }
    if (record.version !== input.version) throw Errors.conflict('This application has changed. Refresh before reviewing.');
    if (input.decision === 'APPROVED' && (input.agreement.length < 20 || input.verificationReference.length < 3)) throw Errors.badRequest('Record the programme agreement and verification reference before approval.');
    if (input.decision === 'APPROVED' && record.status !== 'SUBMITTED') throw Errors.conflict('Only a submitted application can be approved.');
    if (input.decision === 'REJECTED' && record.status !== 'SUBMITTED') throw Errors.conflict('Only a submitted application can be declined.');
    if (input.decision === 'REVOKED' && record.status !== 'APPROVED') throw Errors.conflict('Only approved access can be revoked.');
    const [user] = await tx.select().from(users).where(eq(users.id, record.ownerId));
    if (input.decision === 'APPROVED' && !user?.emailVerifiedAt) throw Errors.forbidden('The applicant must verify their email first.');
    const detail = record.data.details ?? {};
    const data = input.decision === 'APPROVED' ? { ...record.data, details: { ...detail, verified: true, verificationReference: input.verificationReference, agreement: input.agreement, agreementVersion: record.version + 1, acceptedAgreementVersion: 0, reviewedBy: actorId } } : record.data;
    await tx.insert(roles).values({ id: programme, description: programmeDefinitions[programme].description }).onConflictDoNothing();
    await tx.delete(userRoles).where(and(eq(userRoles.userId, record.ownerId), eq(userRoles.roleId, programme)));
    const [saved] = await tx.update(workspaceRecords).set({ status: input.decision, reviewNote: input.note, data, version: record.version + 1, updatedAt: new Date() }).where(eq(workspaceRecords.id, record.id)).returning();
    await audit(tx, { actorId, action: 'partner.programme.review', entityType: 'workspace', entityId: record.id, after: { decision: input.decision, note: input.note, verificationReference: input.verificationReference } });
    await enqueueNotification(tx, { userId: record.ownerId, channel: 'email', template: PROGRAMME_REVIEW_TEMPLATE, payload: { membershipId: record.id, version: saved.version, status: saved.status } });
    return saved;
  });
}
