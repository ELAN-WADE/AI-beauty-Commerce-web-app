import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, readJson } from '@/lib/errors';
import { requireAuth } from '@/modules/auth/require-auth';
import { initMediaSchema } from '@/modules/community/validation';
import { initMediaUpload } from '@/modules/community/service';

/**
 * Stage a community upload: validates type/size, returns a presigned PUT URL.
 * Bytes are verified later at post time (HEAD + magic bytes) — staging alone
 * publishes nothing.
 */
export const POST = api(async ({ req }) => {
  const db = getDb();
  const ctx = await requireAuth(db);
  const input = initMediaSchema.parse(await readJson(req));
  return NextResponse.json(await initMediaUpload(db, ctx.userId, input), { status: 201 });
});
