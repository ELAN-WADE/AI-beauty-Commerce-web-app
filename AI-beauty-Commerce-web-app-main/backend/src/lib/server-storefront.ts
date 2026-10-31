import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { getDb } from '@/db/client';
import { readStorefront } from '@/modules/workspaces/storefront';
import type { StorefrontSeed } from '@/storefront/lib/storefront-seed';
export type { StorefrontSeed } from '@/storefront/lib/storefront-seed';
/** Public saved CMS data is present in server HTML and hydration together. */
const cachedStorefront = unstable_cache(async (): Promise<StorefrontSeed> => {
  try { return await readStorefront(getDb()); }
  catch { return { version: 0, config: null }; }
}, ['public-editorial-v1'], { revalidate: 60, tags: ['public-editorial'] });
export const getStorefrontSeed = cache(cachedStorefront);
