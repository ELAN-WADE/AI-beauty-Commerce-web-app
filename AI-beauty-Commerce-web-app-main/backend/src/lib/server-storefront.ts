import { cache } from 'react';
import { getDb } from '@/db/client';
import { readStorefront } from '@/modules/workspaces/storefront';
export type StorefrontSeed = Awaited<ReturnType<typeof readStorefront>>;
/** Public saved CMS data is present in server HTML and hydration together. */
export const getStorefrontSeed = cache(async (): Promise<StorefrontSeed> => {
  try { return await readStorefront(getDb()); }
  catch { return { version: 0, config: null }; }
});
