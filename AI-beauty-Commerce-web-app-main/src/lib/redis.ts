// Desla!™ Backend — Redis cache layer (Upstash REST + in-memory fallback).
// Redis is CACHE ONLY: every read-through falls back to Supabase, every miss
// falls back further to local mocks. Safe to run with no env keys set.

const baseUrl = import.meta.env.VITE_UPSTASH_REDIS_REST_URL as string | undefined;
const token = import.meta.env.VITE_UPSTASH_REDIS_REST_TOKEN as string | undefined;

export const isRedisConfigured = Boolean(baseUrl && token);

// TTLs (seconds) — tuned for Desla catalog vs city-stock freshness.
export const TTL = {
  productsList: 3600,
  product: 3600,
  categories: 3600,
  cityDistributors: 300,
  creatorCode: 600,
  productReviews: 600,
  communityFeed: 120,
} as const;

const memory = new Map<string, { value: string; expiresAt: number }>();

function memGet(key: string): string | null {
  const entry = memory.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memory.delete(key);
    return null;
  }
  return entry.value;
}

function memSet(key: string, value: string, ttlSec: number): void {
  memory.set(key, { value, expiresAt: Date.now() + ttlSec * 1000 });
}

async function restGet(key: string): Promise<string | null> {
  const res = await fetch(`${baseUrl}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { result?: string | null };
  return data.result ?? null;
}

async function restSet(key: string, value: string, ttlSec: number): Promise<void> {
  await fetch(`${baseUrl}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}?EX=${ttlSec}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export const cacheKeys = {
  productsList: 'products:list',
  product: (id: string) => `product:${id}`,
  categories: 'categories:list',
  cityDistributors: (city: string) => `distributors:city:${city.toLowerCase()}`,
  creatorCode: (code: string) => `creator_code:${code.toUpperCase()}`,
  productReviews: (id: string) => `reviews:product:${id}`,
  communityFeed: 'feed:community:latest',
};

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = isRedisConfigured ? await restGet(key) : memGet(key);
    // When Redis is configured but unreachable, fall back to memory.
    const value = raw ?? (!isRedisConfigured ? null : memGet(key));
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, data: unknown, ttlSec: number): Promise<void> {
  try {
    const raw = JSON.stringify(data);
    if (isRedisConfigured) {
      try {
        await restSet(key, raw, ttlSec);
      } catch {
        memSet(key, raw, ttlSec);
      }
    } else {
      memSet(key, raw, ttlSec);
    }
  } catch {
    // Cache must never break the storefront.
  }
}

export async function cacheGetOrLoad<T>(
  key: string,
  ttlSec: number,
  loader: () => Promise<T>,
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;
  const fresh = await loader();
  await cacheSet(key, fresh, ttlSec);
  return fresh;
}
