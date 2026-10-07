import { afterEach, describe, expect, it, vi } from 'vitest';
const { sendMail, createTransport } = vi.hoisted(() => {
  const sendMail = vi.fn();
  return { sendMail, createTransport: vi.fn(() => ({ sendMail })) };
});
vi.mock('nodemailer', () => ({ default: { createTransport } }));
import { getEmailSender, SmtpSender } from '@/lib/email';
import { authEmailLink } from '@/modules/auth/email';

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

describe('account email transport configuration', () => {
  it('never substitutes the API host for the storefront in local email links', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('FRONTEND_URL', '');
    vi.stubEnv('APP_URL', 'http://localhost:3001');
    expect(authEmailLink('auth.verify-email', 'abc')).toBe('http://localhost:5173/verify-email?token=abc');
  });

  it('requires an HTTPS storefront origin in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    for (const url of ['', 'http://shop.example.com', 'https://shop.example.com/subpath', 'https://user:pass@shop.example.com', 'https://shop.example.com?redirect=other']) {
      vi.stubEnv('FRONTEND_URL', url);
      expect(() => authEmailLink('auth.reset-password', 'abc')).toThrow();
    }
    vi.stubEnv('FRONTEND_URL', 'https://shop.example.com/');
    expect(authEmailLink('auth.reset-password', 'abc')).toBe('https://shop.example.com/reset-password?token=abc');
  });

  it('refuses a logging-only sender in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SMTP_HOST', '');
    expect(() => getEmailSender()).toThrow('SMTP_HOST');
  });

  it('uses authenticated TLS SMTP and checks recipient acceptance', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SMTP_HOST', 'smtp.example.com');
    vi.stubEnv('SMTP_PORT', '587');
    vi.stubEnv('SMTP_SECURE', 'false');
    vi.stubEnv('SMTP_USER', 'smtp-user');
    vi.stubEnv('SMTP_PASS', 'smtp-password');
    vi.stubEnv('SMTP_FROM', 'Desla <hello@example.com>');
    const sender = getEmailSender();
    expect(sender).toBeInstanceOf(SmtpSender);
    expect(createTransport).toHaveBeenCalledWith(expect.objectContaining({ port: 587, secure: false, requireTLS: true, auth: { user: 'smtp-user', pass: 'smtp-password' } }));
    const message = { to: 'buyer@example.com', subject: 'Verify email', text: 'One-time link' };
    sendMail.mockResolvedValueOnce({ accepted: ['buyer@example.com'], rejected: [] });
    await expect(sender.send(message)).resolves.toBeUndefined();
    expect(sendMail).toHaveBeenCalledWith({ from: 'Desla <hello@example.com>', ...message });
    sendMail.mockResolvedValueOnce({ accepted: [], rejected: ['buyer@example.com'] });
    await expect(sender.send(message)).rejects.toThrow('did not accept');
  });
});
