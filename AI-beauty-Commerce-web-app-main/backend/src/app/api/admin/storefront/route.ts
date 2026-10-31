import { NextResponse } from 'next/server';
import { z } from 'zod';
import { api, readJson } from '@/lib/errors';
import { getDb } from '@/db/client';
import { requirePerm } from '@/lib/admin';
import { storefrontSchema, saveStorefront } from '@/modules/workspaces/storefront';
export const PUT = api(async ({req}) => { const db = getDb(); const actor = await requirePerm(db, 'products:write'); const input = z.object({version: z.number().int().min(0), config: storefrontSchema}).strict().parse(await readJson(req, 65536)); return NextResponse.json(await saveStorefront(db, actor.userId, input.version, input.config), { headers: {'Cache-Control': 'no-store'} }); });
