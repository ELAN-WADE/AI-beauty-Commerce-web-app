import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema, resetPasswordSchema } from '@/modules/auth/validation';
import { createAddressSchema, updateAddressSchema, updateProfileSchema } from '@/modules/users/validation';

// THREAT (mass assignment / injection via over-posted fields) → CONTROL
// (zod .strict() + whitelisted shapes) → TEST: unknown keys rejected everywhere.
describe('auth validation', () => {
  it('accepts a valid registration', () => {
    expect(registerSchema.safeParse({ email: 'ada@example.com', password: 'long-enough-1' }).success).toBe(true);
  });

  it('rejects short passwords and bad emails', () => {
    expect(registerSchema.safeParse({ email: 'nope', password: 'long-enough-1' }).success).toBe(false);
    expect(registerSchema.safeParse({ email: 'a@b.co', password: 'short' }).success).toBe(false);
  });

  it('rejects over-posted privilege fields (role, isAdmin)', () => {
    const r = registerSchema.safeParse({ email: 'a@b.co', password: 'long-enough-1', role: 'ADMIN', isAdmin: true });
    expect(r.success).toBe(false);
  });

  it('rejects over-posted fields on login and password reset', () => {
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'x', userId: '1' }).success).toBe(false);
    expect(
      resetPasswordSchema.safeParse({ token: 't'.repeat(32), newPassword: 'long-enough-1', verified: true }).success,
    ).toBe(false);
  });
});

describe('users validation', () => {
  it('accepts a valid NG address with defaults', () => {
    const r = createAddressSchema.safeParse({
      fullName: 'Adaeze Okafor',
      phone: '+2348012345678',
      street: '14 Admiralty Way',
      city: 'Lekki',
      state: 'Lagos',
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.country).toBe('NG');
      expect(r.data.isDefault).toBe(false);
    }
  });

  it('rejects malformed phones and empty update payloads', () => {
    expect(updateProfileSchema.safeParse({ phone: 'not-a-phone' }).success).toBe(false);
    expect(updateAddressSchema.safeParse({}).success).toBe(false);
    expect(updateAddressSchema.safeParse({ city: 'Abuja' }).success).toBe(true);
  });
});
