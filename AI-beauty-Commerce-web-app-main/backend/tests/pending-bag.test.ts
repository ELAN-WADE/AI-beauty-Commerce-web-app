import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { claimPendingBag, readPendingBag, rememberPendingBag, validChoices } from '@/storefront/lib/customer-journey';
const values = new Map<string, string>();
beforeEach(() => {
  values.clear();
  vi.stubGlobal('sessionStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) });
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
describe('selection survives the customer sign-in round trip', () => {
  it('retains product, exact size and quantity without a supplied price, and resumes only once', () => {
    const items = [{ productId: 'actual-formulation', size: '100ml', quantity: 3 }];
    const saved = rememberPendingBag(items);
    expect(readPendingBag()?.items).toEqual(items);
    expect(claimPendingBag('wrong')).toBeNull();
    expect(claimPendingBag(saved.id)?.items).toEqual(items);
    expect(claimPendingBag(saved.id)).toBeNull();
  });
  it('expires the intent after thirty minutes and refuses external return addresses', () => {
    vi.useFakeTimers();
    rememberPendingBag([{ productId: 'actual-formulation', size: '50ml', quantity: 1 }], 'https://attacker.example');
    expect(readPendingBag()?.returnTo).toBe('/cart');
    vi.advanceTimersByTime(30 * 60000 + 1);
    expect(readPendingBag()).toBeNull();
  });
  it('rejects malformed stored selections and invalid quantities', () => {
    expect(validChoices([{ productId: 'oil', size: '50ml', quantity: 0 }])).toBe(false);
    expect(validChoices([{ productId: 'oil', size: '50ml', quantity: 100 }])).toBe(false);
    values.set('desla-pending-bag', '{corrupt');
    expect(readPendingBag()).toBeNull();
  });
});
