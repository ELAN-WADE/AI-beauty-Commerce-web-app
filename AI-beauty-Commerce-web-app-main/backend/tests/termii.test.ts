import { describe, expect, it } from 'vitest';
import { ProviderError } from '@/lib/providers';
import {
  smsCartAbandoned,
  smsOrderPaid,
  termiiSend,
  toE164Nigeria,
  type TermiiConfig,
} from '@/lib/termii';
import type { FetchFn } from '@/lib/providers';

// THREAT (SMS pumping / malformed recipients / silent misconfig) → CONTROL
// (E.164 normalization, length bounds, explicit unconfigured error, timeouts)
// → TEST below with mocked HTTP.
describe('termii sender', () => {
  const cfg: TermiiConfig = { baseUrl: 'https://api.ng.termii.com', apiKey: 'k', senderId: 'Glowly', sendPath: '/api/sms/send' };
  const mockFetch =
    (json: unknown, ok = true): FetchFn =>
    (async (url: unknown, init: unknown) => {
      const body = JSON.parse((init as { body: string }).body) as Record<string, unknown>;
      (globalThis as Record<string, unknown>).__lastTermiiBody = body;
      (globalThis as Record<string, unknown>).__lastTermiiUrl = String(url);
      return new Response(JSON.stringify(json), { status: ok ? 200 : 500 });
    }) as FetchFn;

  it('normalizes Nigerian numbers to E.164 and rejects the rest', () => {
    expect(toE164Nigeria('08031234567')).toBe('+2348031234567');
    expect(toE164Nigeria('2348031234567')).toBe('+2348031234567');
    expect(toE164Nigeria('+2348031234567')).toBe('+2348031234567');
    expect(toE164Nigeria('8031234567')).toBeNull();
    expect(toE164Nigeria('not-a-number')).toBeNull();
    expect(toE164Nigeria('+15551234567')).toBeNull();
  });

  it('posts the documented payload shape and returns the message id', async () => {
    const r = await termiiSend(
      mockFetch({ message_id: '8394925629000072200' }),
      cfg,
      { to: '08031234567', text: 'hello', channel: 'whatsapp' },
    );
    expect(r).toEqual({ messageId: '8394925629000072200' });
    const body = (globalThis as Record<string, unknown>).__lastTermiiBody as Record<string, unknown>;
    expect(body).toMatchObject({ to: '+2348031234567', from: 'Glowly', sms: 'hello', type: 'plain', channel: 'whatsapp', api_key: 'k' });
  });

  it('refuses provider errors, bad numbers, and missing keys', async () => {
    await expect(termiiSend(mockFetch({ message: 'Insufficient balance' }), cfg, { to: '08031234567', text: 'hi', channel: 'generic' })).rejects.toBeInstanceOf(ProviderError);
    await expect(termiiSend(mockFetch({ message_id: '1' }), cfg, { to: 'nope', text: 'hi', channel: 'generic' })).rejects.toBeInstanceOf(ProviderError);
    await expect(termiiSend(mockFetch({ message_id: '1' }), cfg, { to: '08031234567', text: '', channel: 'generic' })).rejects.toBeInstanceOf(ProviderError);
    await expect(termiiSend(mockFetch({ message_id: '1' }), { ...cfg, apiKey: '' }, { to: '08031234567', text: 'hi', channel: 'generic' })).rejects.toBeInstanceOf(ProviderError);
  });

  it('keeps templates short and naira-formatted', () => {
    expect(smsOrderPaid('DES-ABC123', 2550000)).toContain('N25,500');
    expect(smsOrderPaid('DES-ABC123', 2550000).length).toBeLessThan(160);
    expect(smsCartAbandoned(48000)).toContain('N48,000');
  });
});
