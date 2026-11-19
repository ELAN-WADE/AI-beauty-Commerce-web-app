import { NextResponse } from 'next/server';
import { api } from '@/lib/errors';
import { getStorefrontSeed } from '@/lib/server-storefront';

export const GET = api(async () =>
  NextResponse.json(await getStorefrontSeed(), {
    headers: { 'Cache-Control': 'no-store' },
  }),
);
