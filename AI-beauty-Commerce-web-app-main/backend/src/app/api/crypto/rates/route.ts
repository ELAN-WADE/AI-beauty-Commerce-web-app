import { NextResponse } from 'next/server';
import { getLiveCryptoRates } from '@/modules/crypto/rates';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rates = await getLiveCryptoRates();
    return NextResponse.json(rates, {
      headers: {
        'Cache-Control': 'public, max-age=15, stale-while-revalidate=30',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'rates_unavailable', message: 'Could not fetch current cryptocurrency market rates.' } },
      { status: 503 }
    );
  }
}

