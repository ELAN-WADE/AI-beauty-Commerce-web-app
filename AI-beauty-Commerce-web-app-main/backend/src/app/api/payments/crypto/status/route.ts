import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { getCryptoPaymentStatus } from '@/modules/crypto/service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get('paymentId');
    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId query param is required' }, { status: 400 });
    }

    const db = getDb();
    const status = await getCryptoPaymentStatus(db, paymentId);
    return NextResponse.json(status);
  } catch (err: any) {
    const message = err?.message || 'Failed to fetch crypto payment status';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

