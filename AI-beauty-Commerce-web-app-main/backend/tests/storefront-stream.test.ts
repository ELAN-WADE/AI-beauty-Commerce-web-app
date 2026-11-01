import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const registry = vi.hoisted(() => ({ listeners: new Set<(event: unknown) => void>() }));
vi.mock('@/lib/storefront-revalidate', () => ({
  subscribeStorefrontSync: (listener: (event: unknown) => void) => {
    registry.listeners.add(listener);
    return () => registry.listeners.delete(listener);
  },
}));
import { GET } from '@/app/api/storefront/sync/route';

beforeEach(() => { vi.useFakeTimers(); registry.listeners.clear(); });
afterEach(() => { vi.useRealTimers(); });
const emit = () => { for (const listener of registry.listeners) listener({ type: 'CATALOG_UPDATE', timestamp: 1 }); };

describe('storefront stream resource lifetime', () => {
  it('delivers updates, then releases timers and listeners on cancellation', async () => {
    const response = await GET(new Request('http://localhost/api/storefront/sync'));
    const reader = response.body!.getReader();
    expect(new TextDecoder().decode((await reader.read()).value)).toContain('event: connected');
    emit();
    expect(new TextDecoder().decode((await reader.read()).value)).toContain('CATALOG_UPDATE');
    await reader.cancel();
    expect(registry.listeners.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    expect(() => emit()).not.toThrow();
  });
  it('also releases resources when the HTTP request aborts', async () => {
    const abort = new AbortController();
    await GET(new Request('http://localhost/api/storefront/sync', { signal: abort.signal }));
    expect(registry.listeners.size).toBe(1);
    abort.abort();
    expect(registry.listeners.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('does not allocate a listener for an already aborted request', async () => {
    const abort = new AbortController(); abort.abort();
    const response = await GET(new Request('http://localhost/api/storefront/sync', { signal: abort.signal }));
    expect((await response.body!.getReader().read()).done).toBe(true);
    expect(registry.listeners.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('disconnects an unread consumer instead of accumulating updates', async () => {
    const response = await GET(new Request('http://localhost/api/storefront/sync'));
    for (let index = 0; index < 1000; index++) emit();
    expect(registry.listeners.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    const reader = response.body!.getReader();
    expect((await reader.read()).done).toBe(false);
    expect((await reader.read()).done).toBe(true);
  });
  it('does not leak resources across many sequential visitor connections', async () => {
    for (let index = 0; index < 100; index++) {
      const response = await GET(new Request('http://localhost/api/storefront/sync'));
      await response.body!.cancel();
    }
    expect(registry.listeners.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });
});
