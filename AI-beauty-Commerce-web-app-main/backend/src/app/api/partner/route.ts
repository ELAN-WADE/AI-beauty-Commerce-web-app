import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requireAuth } from '@/modules/auth/require-auth';
import { ownedPartner, partnerDashboard, partnerOrderAction } from '@/modules/partners/service';
import { partnerCommand } from '@/modules/partners/validation';
import { partnerBankAccounts } from '@/modules/ledger/schema';
import { requestWithdrawal, walletFor } from '@/modules/ledger/service';
import { restockRequests } from '@/modules/inventory/schema';
import { receiveTransfer } from '@/modules/inventory/transfers';
import { audit } from '@/modules/audit/service';

function limit(req: Request) {
  if (!checkRateLimit(`partner:${clientIp(req)}`, Limits.admin).allowed) throw Errors.rateLimited(60);
}
export const GET = api(async ({ req }) => {
  limit(req);
  const db = getDb();
  const auth = await requireAuth(db);
  const kind = z.enum(['DISTRIBUTOR', 'CREATOR']).parse(new URL(req.url).searchParams.get('kind'));
  return NextResponse.json(await partnerDashboard(db, auth.userId, kind));
});
export const POST = api(async ({ req, requestId }) => {
  limit(req);
  const db = getDb();
  const auth = await requireAuth(db);
  const input = partnerCommand.parse(await readJson(req));
  const partner = await ownedPartner(db, auth.userId, input.kind);
  if (input.action === 'order') {
    const result = await partnerOrderAction(db, auth.userId, input.orderId, input.transition, input.code, input.note);
    await audit(db, { actorId: auth.userId, action: `partner.order.${input.transition}`, entityType: 'order', entityId: input.orderId, requestId });
    return NextResponse.json({ result });
  }
  const key = req.headers.get('Idempotency-Key');
  if (['withdraw', 'restock'].includes(input.action) && (!key || key.length < 8 || key.length > 128)) throw Errors.badRequest('Idempotency-Key is required.');
  const result = await db.transaction(async tx => {
    let result: unknown;
    if (input.action === 'receive') {
      result = await receiveTransfer(tx, input.transferId, auth.userId, partner.location!.id);
    } else if (input.action === 'restock') {
      const value = { locationId: partner.location!.id, variantId: input.variantId, qty: input.qty, requestedBy: auth.userId, idempotencyKey: key! };
      const [created] = await tx.insert(restockRequests).values(value).onConflictDoNothing().returning();
      const row = created ?? (await tx.select().from(restockRequests).where(eq(restockRequests.idempotencyKey, key!)))[0];
      if (!row || row.locationId !== value.locationId || row.variantId !== value.variantId || row.qty !== value.qty || row.requestedBy !== auth.userId) throw Errors.conflict('Idempotency key reused with different input.');
      result = row;
    } else {
      const wallet = await walletFor(tx, input.kind, partner.profile.id, auth.userId);
      if (input.action === 'withdraw') result = await requestWithdrawal(tx, auth.userId, key!, { walletId: wallet.id, bankAccountId: input.bankAccountId, amountKobo: input.amountKobo });
      else {
        const { action, kind, ...bank } = input;
        const [row] = await tx.insert(partnerBankAccounts).values({ ...bank, walletId: wallet.id }).onConflictDoNothing().returning({ id: partnerBankAccounts.id });
        result = row ?? { alreadyRegistered: true };
      }
    }
    await audit(tx, { actorId: auth.userId, action: `partner.${input.action}`, entityType: 'partner', entityId: partner.profile.id, after: { action: input.action }, requestId });
    return result;
  });
  return NextResponse.json({ result });
});
