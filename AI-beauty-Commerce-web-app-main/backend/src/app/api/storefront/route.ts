import { NextResponse } from 'next/server';
import { api } from '@/lib/errors';
import { getDb } from '@/db/client';
import { readStorefront } from '@/modules/workspaces/storefront';
export const GET = api(async () => NextResponse.json(await readStorefront(getDb()), { headers: { 'Cache-Control': 'no-store' } }));
