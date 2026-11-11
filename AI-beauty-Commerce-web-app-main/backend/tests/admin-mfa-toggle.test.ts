import { afterEach, expect, it, vi } from 'vitest';
import { isMfaVerificationFresh } from '@/modules/auth/mfa';
afterEach(() => vi.unstubAllEnvs());
it('skips only with an explicit temporary server setting', () => {
  vi.stubEnv('ADMIN_MFA_REQUIRED', 'false');
  expect(isMfaVerificationFresh(null, null)).toBe(true);
});
it('requires authenticator proof by default and when restored', () => {
  for (const value of ['', 'true']) {
    vi.stubEnv('ADMIN_MFA_REQUIRED', value);
    expect(isMfaVerificationFresh(null, null)).toBe(false);
  }
});
