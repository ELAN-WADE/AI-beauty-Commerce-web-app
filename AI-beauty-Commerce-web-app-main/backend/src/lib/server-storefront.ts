import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { getDb } from '@/db/client';
import { getStorefrontCacheVersion } from '@/lib/storefront-revalidate';
import { readStorefront } from '@/modules/workspaces/storefront';
import type { StorefrontSeed } from '@/storefront/lib/storefront-seed';
export type { StorefrontSeed } from '@/storefront/lib/storefront-seed';

const editorialMemState = globalThis as typeof globalThis & {
  __deslaEditorialMemCache?: {
    version: number;
    expiresAt: number;
    data: StorefrontSeed;
    inflight?: Promise<StorefrontSeed>;
  };
};

/** Public saved CMS data is present in server HTML and hydration together. */
async function readStorefrontSeed(): Promise<StorefrontSeed> {
  try { return await readStorefront(getDb()); }
  catch { return { version: 0, config: null }; }
}
const cachedStorefront = unstable_cache(readStorefrontSeed, ['public-editorial-v1'], { revalidate: 60, tags: ['public-editorial'] });
export const getStorefrontSeed = cache(async () => {
  if (process.env.NODE_ENV === 'test') {
    try { return await cachedStorefront(); } catch { return readStorefrontSeed(); }
  }
  const now = Date.now();
  const ver = getStorefrontCacheVersion();
  const mem = editorialMemState.__deslaEditorialMemCache;
  if (mem && mem.version === ver && mem.expiresAt > now) {
    return mem.data;
  }
  if (mem && mem.version === ver && mem.inflight) {
    return mem.inflight;
  }
  const promise = (async () => {
    try { return await cachedStorefront(); } catch { return readStorefrontSeed(); }
  })().then((data) => {
    editorialMemState.__deslaEditorialMemCache = {
      version: getStorefrontCacheVersion(),
      expiresAt: Date.now() + 30_000,
      data,
    };
    return data;
  });
  editorialMemState.__deslaEditorialMemCache = {
    version: ver,
    expiresAt: mem?.expiresAt ?? 0,
    data: mem?.data ?? { version: 0, config: null },
    inflight: promise,
  };
  return promise;
});
