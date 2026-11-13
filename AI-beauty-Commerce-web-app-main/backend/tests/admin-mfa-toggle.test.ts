import { afterEach, expect, it, vi } from 'vitest';
import { isMfaVerificationFresh, meetsAdminMfaRequirement } from '@/modules/auth/mfa';

afterEach(() => vi.unstubAllEnvs());
it('allows temporary password-only admin access when unset or explicitly disabled', () => {
  for (const value of [undefined, '', 'false', ' FALSE ']) {
    vi.stubEnv('ADMIN_MFA_REQUIRED', value);
    expect(meetsAdminMfaRequirement(null, null)).toBe(true);
  }
});
it('does not treat the bypass as authenticator proof', () => {
  vi.stubEnv('ADMIN_MFA_REQUIRED', 'false');
  expect(isMfaVerificationFresh(null, null)).toBe(false);
});
it('requires fresh proof when enabled, and fails closed for an invalid setting', () => {
  const now = Date.now();
  const enabledAt = new Date(now - 60_000);
  for (const value of ['true', ' TRUE ', 'invalid']) {
    vi.stubEnv('ADMIN_MFA_REQUIRED', value);
    expect(meetsAdminMfaRequirement(null, null, now)).toBe(false);
    expect(meetsAdminMfaRequirement(enabledAt, new Date(now - 1000), now)).toBe(true);
    expect(meetsAdminMfaRequirement(enabledAt, new Date(now + 1000), now)).toBe(false);
    expect(meetsAdminMfaRequirement(new Date(now - 14 * 60 * 60_000), new Date(now - 13 * 60 * 60_000), now)).toBe(false);
  }
});
