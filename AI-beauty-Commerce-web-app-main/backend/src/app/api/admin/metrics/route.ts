import { NextResponse } from 'next/server';
import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { api, clientIp } from '@/lib/errors';
import { Errors } from '@/lib/errors';
import { checkRateLimit, Limits, rateLimitStats } from '@/lib/rate-limit';
import { bulkheadDepth } from '@/lib/bulkhead';
import { requirePerm } from '@/lib/admin';
import { notificationOutbox } from '@/modules/notifications/schema';
import { orders } from '@/modules/orders/schema';
import { paymentAttempts } from '@/modules/payments/schema';
import { userSessions } from '@/modules/auth/schema';

/**
 * Batch-3 (Part X): ops metrics before any OTel spend. Admin-gated
 * (`audit:read`), cheap indexed counts only, 60s edge-cacheable.
 * Worker depth, checkout health and payment failures in one place.
 */
export const GET = api(async ({ req }) => {
  const rl = checkRateLimit(`admin:${clientIp(req)}`, Limits.admin);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const db = getDb();
  await requirePerm(db, 'audit:read');

  const dayAgo = new Date(Date.now() - 24 * 3600_000);
  const now = new Date();
  const t0 = Date.now();
  const [outbox, recentOrders, failedAttempts, sessions] = await Promise.all([
    db
      .select({ status: notificationOutbox.status, n: sql<number>`count(*)`.mapWith(Number) })
      .from(notificationOutbox)
      .where(gt(notificationOutbox.createdAt, dayAgo))
      .groupBy(notificationOutbox.status),
    db
      .select({ status: orders.status, n: sql<number>`count(*)`.mapWith(Number) })
      .from(orders)
      .where(gt(orders.createdAt, dayAgo))
      .groupBy(orders.status),
    db
      .select({ n: sql<number>`count(*)`.mapWith(Number) })
      .from(paymentAttempts)
      .where(and(eq(paymentAttempts.status, 'failed'), gt(paymentAttempts.createdAt, dayAgo))),
    db
      .select({ n: sql<number>`count(*)`.mapWith(Number) })
      .from(userSessions)
      .where(and(isNull(userSessions.revokedAt), gt(userSessions.expiresAt, now))),
  ]);
  const roundtripMs = Date.now() - t0;
  const mem = process.memoryUsage();

  const res = NextResponse.json({
    db: { roundtripMs },
    outbox24h: Object.fromEntries(outbox.map((r) => [r.status, r.n])),
    orders24h: Object.fromEntries(recentOrders.map((r) => [r.status, r.n])),
    paymentAttemptsFailed24h: failedAttempts[0]?.n ?? 0,
    sessionsActive: sessions[0]?.n ?? 0,
    rateLimit: rateLimitStats(),
    bulkheads: bulkheadDepth(),
    process: { uptimeSec: Math.round(process.uptime()), rssMb: Math.round(mem.rss / 1048576) },
  });
  res.headers.set('Cache-Control', 'private, max-age=60');
  return res;
});
