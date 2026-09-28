import { NextResponse } from 'next/server';
import { api } from '@/lib/errors';

export const GET = api(async () => {
  return NextResponse.json({
    ok: true,
    service: 'glowly-backend',
    version: '0.1.0',
    time: new Date().toISOString(),
  });
});
