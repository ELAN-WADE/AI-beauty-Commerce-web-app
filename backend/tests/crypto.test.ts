import { describe, expect, it } from 'vitest';
import { hashPassword, newRawToken, normalizeEmail, sha256Hex, verifyPassword } from '@/modules/auth/service';

// THREAT (credential theft / offline cracking) → CONTROL (scrypt + unique salts)
// → TEST below: roundtrip, wrong-password rejection, salt uniqueness, format versioning.
describe('password hashing (scrypt)', () => {
  it('hashes and verifies the correct password', async () => {
    const hash = await hashPassword('correct horse 38!');
    expect(await verifyPassword('correct horse 38!', hash)).toBe(true);
  });

  it('rejects the wrong password', async () => {
    const hash = await hashPassword('correct horse 38!');
    expect(await verifyPassword('wrong password 00!', hash)).toBe(false);
  });

  it('uses a unique salt per hash (identical passwords differ)', async () => {
    const a = await hashPassword('same-password-1');
    const b = await hashPassword('same-password-1');
    expect(a).not.toBe(b);
  });

  it('rejects malformed / foreign hash formats', async () => {
    expect(await verifyPassword('x', 'not-a-hash')).toBe(false);
    expect(await verifyPassword('x', '$2b$10$abcdefghijklmnopqrstuu')).toBe(false);
  });
});

describe('tokens and normalization', () => {
  it('lowercases + trims emails (login identity stability)', () => {
    expect(normalizeEmail('  Ada@Example.COM ')).toBe('ada@example.com');
  });

  it('issues 64-hex-char session tokens (256-bit entropy)', () => {
    const t = newRawToken();
    expect(t).toMatch(/^[0-9a-f]{64}$/);
    expect(newRawToken()).not.toBe(t);
  });

  it('sha256Hex is deterministic (lookup equality for stored hashes)', () => {
    expect(sha256Hex('abc')).toBe(sha256Hex('abc'));
  });
});
