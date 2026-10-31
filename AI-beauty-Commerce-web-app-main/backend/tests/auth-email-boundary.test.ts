import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/db/client', () => ({ getDb: () => ({}) }));
vi.mock('@/lib/rate-limit', () => ({ checkSharedRateLimit: async () => ({ allowed: true }), Limits: {} }));
vi.mock('@/modules/auth/service', () => ({
  register: async () => ({ email: 'person@example.com', verificationToken: 'private-verification-token', created: true }),
  resendVerification: async () => ({ verificationToken: 'private-verification-token' }),
  requestPasswordReset: async () => ({ resetToken: 'private-reset-token' }),
}));
import { POST as register } from '@/app/api/auth/register/route';
import { POST as resend } from '@/app/api/auth/resend-verification/route';
import { POST as reset } from '@/app/api/auth/request-password-reset/route';

afterEach(() => vi.unstubAllEnvs());
describe('email proof stays in the email channel', () => {
  it.each(['development', 'production'])('never echoes verification or reset tokens in %s', async environment => {
    vi.stubEnv('NODE_ENV', environment);
    for (const [path, handler, body, status] of [
      ['register', register, { email: 'person@example.com', password: 'Valid-password-123' }, 201],
      ['resend-verification', resend, { email: 'person@example.com' }, 200],
      ['request-password-reset', reset, { email: 'person@example.com' }, 200],
    ] as const) {
      const response = await handler(new NextRequest(`http://localhost:3005/api/auth/${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }));
      expect(response.status).toBe(status);
      expect(await response.json()).toEqual(path === 'register' ? { ok: true, email: 'person@example.com' } : { ok: true });
    }
  });
});
