import { describe, expect, it } from 'vitest';
import { ApiError, enforceOrigin, readJson, readRawBody } from '@/lib/errors';
import { openAuthUrl, sealAuthUrl } from '@/lib/outbox-crypto';
import { sessionCookieName } from '@/lib/cookies';

// THREAT (browser-driven CSRF from an evil origin) → CONTROL (Origin check on
// mutations; absent Origin still allowed for curl/apps behind SameSite+auth)
// → TEST below.
describe('origin enforcement', () => {
  const OLD = { ...process.env };

  it('blocks foreign origins on mutations when allowlisted', () => {
    process.env.APP_URL = 'https://staging.example.com';
    process.env.FRONTEND_URL = '';
    process.env.ALLOWED_ORIGINS = '';
    const evil = new Request('https://staging.example.com/api/cart/items', {
      method: 'POST',
      headers: { Origin: 'https://evil.example' },
    });
    expect(() => enforceOrigin(evil)).toThrow(ApiError);
    const good = new Request('https://staging.example.com/api/cart/items', {
      method: 'POST',
      headers: { Origin: 'https://staging.example.com' },
    });
    expect(() => enforceOrigin(good)).not.toThrow();
    process.env = { ...OLD };
  });

  it('allows origin-less clients (curl, server-to-server, native apps)', () => {
    process.env.APP_URL = 'https://staging.example.com';
    const curl = new Request('https://staging.example.com/api/cart/items', { method: 'POST' });
    expect(() => enforceOrigin(curl)).not.toThrow();
    const get = new Request('https://staging.example.com/api/products', { headers: { Origin: 'https://evil.example' } });
    expect(() => enforceOrigin(get)).not.toThrow(); // reads are safe + cacheable
    process.env = { ...OLD };
  });

  it('caps raw bodies (webhook DoS bound)', async () => {
    const big = new Request('http://x/hook', { method: 'POST', body: 'x'.repeat(100) });
    await expect(readRawBody(big, 10)).rejects.toBeInstanceOf(ApiError);
    const small = new Request('http://x/hook', { method: 'POST', body: '{"a":1}' });
    await expect(readRawBody(small, 262144)).resolves.toBe('{"a":1}');
  });

  it('rejects simple-content JSON and caps multibyte bodies by bytes', async () => {
    await expect(readJson(new Request('http://x/api', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '{}' }))).rejects.toMatchObject({ status: 415 });
    await expect(readJson(new Request('http://x/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'é'.repeat(40) }) }), 64)).rejects.toMatchObject({ status: 413 });
  });

  it('encrypts one-time email links at rest and detects tampering', () => {
    const url = 'https://example.com/reset-password?token=secret';
    const sealed = sealAuthUrl(url);
    expect(sealed).not.toContain('secret');
    expect(openAuthUrl(sealed)).toBe(url);
    expect(() => openAuthUrl(sealed.slice(0, -2) + 'aa')).toThrow();
  });
});

describe('session cookie names', () => {
  const OLD_ENV = process.env.NODE_ENV;

  it('uses __Host- prefix in production, plain name in dev', () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    expect(sessionCookieName()).toBe('__Host-desla_sid');
    (process.env as Record<string, string | undefined>).NODE_ENV = 'development';
    expect(sessionCookieName()).toBe('desla_sid');
    (process.env as Record<string, string | undefined>).NODE_ENV = OLD_ENV;
  });
});
