import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api } from '@/lib/errors';
import { requirePerm } from '@/lib/admin';
import { listAdminCryptoTransactions } from '@/modules/crypto/service';

export const dynamic = 'force-dynamic';

export const GET = api(async () => {
  const db = getDb();
  await requirePerm(db, 'orders:read');
  const transactions = await listAdminCryptoTransactions(db);
  return NextResponse.json({ transactions }, { headers: { 'Cache-Control': 'no-store' } });
});

