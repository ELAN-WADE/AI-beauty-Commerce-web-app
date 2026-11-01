import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { subscribeStorefrontSync } from '@/storefront/lib/storefront-sync';

class Source extends EventTarget {
  static instances: Source[] = [];
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  close = vi.fn();
  constructor(public url: string) { super(); Source.instances.push(this); }
}
let page: EventTarget & { hidden: boolean };
let browser: EventTarget;
let network: { onLine: boolean };
let stop: () => void;
beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
  Source.instances = [];
  page = Object.assign(new EventTarget(), { hidden: false });
  browser = new EventTarget(); network = { onLine: true };
  vi.stubGlobal('window', browser); vi.stubGlobal('document', page);
  vi.stubGlobal('navigator', network); vi.stubGlobal('EventSource', Source);
});
afterEach(() => { stop?.(); vi.restoreAllMocks(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('live storefront reconnects', () => {
  it('backs off across repeated outages and cancels pending work on unmount', async () => {
    stop = subscribeStorefrontSync('/api/storefront/sync', vi.fn());
    Source.instances[0].onerror!();
    await vi.advanceTimersByTimeAsync(1999); expect(Source.instances).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1); expect(Source.instances).toHaveLength(2);
    Source.instances[1].onerror!();
    await vi.advanceTimersByTimeAsync(3999); expect(Source.instances).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(1); expect(Source.instances).toHaveLength(3);
    Source.instances[2].onerror!(); stop();
    await vi.advanceTimersByTimeAsync(60000); expect(Source.instances).toHaveLength(3);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('releases a hidden/offline tab and refreshes missed updates on return', () => {
    const refresh = vi.fn(); stop = subscribeStorefrontSync('/sync', refresh);
    Source.instances[0].onopen!(); expect(refresh).not.toHaveBeenCalled();
    page.hidden = true; page.dispatchEvent(new Event('visibilitychange'));
    expect(Source.instances[0].close).toHaveBeenCalledOnce();
    network.onLine = false; page.hidden = false; page.dispatchEvent(new Event('visibilitychange'));
    expect(Source.instances).toHaveLength(1);
    network.onLine = true; browser.dispatchEvent(new Event('online'));
    Source.instances[1].onopen!(); expect(refresh).toHaveBeenCalledOnce();
    Source.instances[1].dispatchEvent(new MessageEvent('sync', { data: '{"slug":"saved-product"}' }));
    expect(refresh).toHaveBeenLastCalledWith('saved-product');
  });
  it('cannot reopen after the subscription was disposed', () => {
    stop = subscribeStorefrontSync('/sync', vi.fn()); stop();
    browser.dispatchEvent(new Event('online')); page.dispatchEvent(new Event('visibilitychange'));
    expect(Source.instances).toHaveLength(1);
  });
});
