import { and, desc, eq } from 'drizzle-orm';
import type { Db } from '../../db/client';
import { auditLogs } from './schema';

const SECRET_KEYS = ['password', 'passwordhash', 'token', 'secret', 'cvv', 'cardnumber', 'card_number', 'apikey', 'api_key', 'session'];

/** Deep-strip secret-bearing keys before anything touches the audit trail (§16). */
export function sanitizeForAudit(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeForAudit);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SECRET_KEYS.includes(k.toLowerCase().replace(/[_-]/g, '')) ? '[redacted]' : sanitizeForAudit(v);
    }
    return out;
  }
  return value;
}

export interface AuditEntry {
  actorType?: 'user' | 'system';
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
  requestId?: string;
}

export async function audit(db: Db, entry: AuditEntry): Promise<void> {  await db.insert(auditLogs).values({
    actorType: entry.actorType ?? 'user',
    actorId: entry.actorId,
    action: entry.action.slice(0, 120),
    entityType: entry.entityType.slice(0, 80),
    entityId: entry.entityId?.slice(0, 120),
    before: entry.before === undefined ? null : (sanitizeForAudit(entry.before) as Record<string, unknown>),
    after: entry.after === undefined ? null : (sanitizeForAudit(entry.after) as Record<string, unknown>),
    ip: entry.ip?.slice(0, 64),
    requestId: entry.requestId?.slice(0, 64),
  });
}

export async function listAudit(db: Db, filter: { entityType?: string; entityId?: string; action?: string; limit?: number }) {
  const conds = [];
  if (filter.entityType) conds.push(eq(auditLogs.entityType, filter.entityType));
  if (filter.entityId) conds.push(eq(auditLogs.entityId, filter.entityId));
  if (filter.action) conds.push(eq(auditLogs.action, filter.action));
  const lim = Math.min(100, Math.max(1, filter.limit ?? 20));
  return db
    .select()
    .from(auditLogs)
    .where(conds.length > 0 ? and(...conds) : undefined)
    .orderBy(desc(auditLogs.createdAt))
    .limit(lim);
}
