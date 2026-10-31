import { afterEach, describe, expect, it, vi } from 'vitest';
import { googleRequest } from '@/modules/auth/google-http';
afterEach(() => vi.restoreAllMocks());
const failure = (code: string) => Object.assign(new TypeError('transport failure'), { cause: { code } });
describe('Google network recovery', () => {
  it('retries the token POST after a confirmed connection timeout', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetcher = vi.fn().mockRejectedValueOnce(failure('UND_ERR_CONNECT_TIMEOUT')).mockResolvedValueOnce(Response.json({ access_token: 'test-token' }));
    expect((await googleRequest(fetcher, 'https://oauth2.googleapis.com/token', { method: 'POST' }, 'token')).status).toBe(200);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[1][1].cache).toBe('no-store');
  });
  it('does not replay a code after a connection reset or provider rejection', async () => {
    const reset = vi.fn().mockRejectedValue(failure('ECONNRESET'));
    await expect(googleRequest(reset, 'https://oauth2.googleapis.com/token', { method: 'POST' }, 'token')).rejects.toThrow();
    expect(reset).toHaveBeenCalledTimes(1);
    const denied = vi.fn().mockResolvedValue(Response.json({ error: 'invalid_grant' }, { status: 400 }));
    expect((await googleRequest(denied, 'https://oauth2.googleapis.com/token', { method: 'POST' }, 'token')).status).toBe(400);
    expect(denied).toHaveBeenCalledTimes(1);
  });
  it('can retry the read-only identity request once, then fails boundedly', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetcher = vi.fn().mockRejectedValue(failure('ECONNRESET'));
    await expect(googleRequest(fetcher, 'https://openidconnect.googleapis.com/v1/userinfo', {}, 'identity')).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
