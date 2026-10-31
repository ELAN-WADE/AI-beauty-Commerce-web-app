import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrevoSender, getEmailSender } from '@/lib/email';
import { assertEmailConfiguration } from '@/lib/email-config';

beforeEach(() => {
  vi.stubEnv('EMAIL_TRANSPORT', 'brevo');
  vi.stubEnv('BREVO_API_KEY', 'test-api-secret');
  vi.stubEnv('EMAIL_FROM', 'Desla! <hello@example.com>');
  vi.stubEnv('EMAIL_FROM_NAME', '');
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe('Brevo HTTPS transactional email', () => {
  const message = { to: 'buyer@example.com', subject: 'Verify account', text: 'Private one-time link' };
  it('uses only HTTPS with the server key and sends the actual recipient and link', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ messageId: 'accepted-id' }, { status: 201 }));
    const sender = new BrevoSender(fetcher);
    await expect(sender.send(message)).resolves.toBeUndefined();
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(init).toMatchObject({ method: 'POST', cache: 'no-store', redirect: 'error', headers: { 'api-key': 'test-api-secret' } });
    expect(JSON.parse(init.body)).toEqual({ sender: { email: 'hello@example.com', name: 'Desla!' }, to: [{ email: message.to }], subject: message.subject, textContent: message.text });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
  it('verifies credentials without sending a message', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ plan: [] }));
    await new BrevoSender(fetcher).verify();
    expect(fetcher.mock.calls[0][0]).toBe('https://api.brevo.com/v3/account');
    expect(fetcher.mock.calls[0][1].body).toBeUndefined();
  });
  it.each([[401, 'BREVO_AUTH_REJECTED'], [403, 'BREVO_AUTH_REJECTED'], [429, 'BREVO_RATE_LIMITED'], [400, 'BREVO_REQUEST_REJECTED'], [503, 'BREVO_REQUEST_REJECTED']])('does not mark provider status %s as sent or disclose its body', async (status, code) => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ message: 'private-provider-response' }, { status: status as number }));
    try { await new BrevoSender(fetcher).send(message); throw new Error('Expected rejection'); }
    catch (error) { expect(error).toMatchObject({ code }); expect(String(error)).not.toMatch(/private-|test-api-secret/); }
  });
  it('does not trust a successful response without a message ID', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({}, { status: 201 }));
    await expect(new BrevoSender(fetcher).send(message)).rejects.toMatchObject({ code: 'BREVO_INVALID_RESPONSE' });
  });
  it('does not replay a send after an ambiguous network failure', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('private-network-data'));
    await expect(new BrevoSender(fetcher).send(message)).rejects.toMatchObject({ code: 'BREVO_NETWORK_ERROR' });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('accepts API delivery without SMTP credentials in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    for (const key of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS']) vi.stubEnv(key, '');
    expect(() => assertEmailConfiguration()).not.toThrow();
    expect(getEmailSender()).toBeInstanceOf(BrevoSender);
  });
  it('refuses SMTP keys in the API-key setting and missing sender addresses', () => {
    vi.stubEnv('BREVO_API_KEY', ['xsmtp', 'sib-not-an-api-key'].join(''));
    expect(() => assertEmailConfiguration()).toThrow('not an SMTP key');
    vi.stubEnv('BREVO_API_KEY', 'test-api-secret');
    vi.stubEnv('EMAIL_FROM', ''); vi.stubEnv('SMTP_FROM', '');
    expect(() => assertEmailConfiguration()).toThrow('sender address');
  });
});
