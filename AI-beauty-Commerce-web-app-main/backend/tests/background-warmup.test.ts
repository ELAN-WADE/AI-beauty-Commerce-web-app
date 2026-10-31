import { afterEach, describe, expect, it, vi } from 'vitest';
import { scheduleBackgroundWarmup } from '@/storefront/lib/background-warmup';
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
function environment(saveData = false) {
  vi.useFakeTimers();
  vi.stubGlobal('navigator', { connection: { saveData, effectiveType: '4g' } });
  vi.stubGlobal('document', { hidden: false });
  vi.stubGlobal('window', { setTimeout, clearTimeout });
}
describe('background warming respects first paint and cancellation', () => {
  it('runs sequentially after the initial render budget', async () => {
    environment(); const calls: number[] = [];
    scheduleBackgroundWarmup([async () => { calls.push(1); }, async () => { calls.push(2); }]);
    await vi.advanceTimersByTimeAsync(999); expect(calls).toEqual([]);
    await vi.advanceTimersByTimeAsync(1001); expect(calls).toEqual([1, 2]);
  });
  it('does not download optional chunks when data saving is enabled', async () => {
    environment(true); const load = vi.fn(); scheduleBackgroundWarmup([load]);
    await vi.advanceTimersByTimeAsync(10000); expect(load).not.toHaveBeenCalled();
  });
  it('cancels work when its screen unmounts', async () => {
    environment(); const load = vi.fn(); const cancel = scheduleBackgroundWarmup([load]); cancel();
    await vi.advanceTimersByTimeAsync(10000); expect(load).not.toHaveBeenCalled();
  });
});
