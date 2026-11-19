import { afterEach, describe, expect, it, vi } from 'vitest';
import { GeminiProvider } from '@/lib/ai-provider';

afterEach(() => {
  vi.unstubAllGlobals();
});

const chat = () => new GeminiProvider('private-test-key').chat({ history: [{ role: 'user', content: 'Help me choose skincare' }], catalog: [] });

const headerValue = (headers: HeadersInit | undefined, name: string): string | null => {
  if (!headers) return null;
  if (headers instanceof Headers) return headers.get(name);
  if (Array.isArray(headers)) {
    const match = headers.find(([k]) => k.toLowerCase() === name.toLowerCase());
    return match ? match[1] : null;
  }
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? String((headers as Record<string, string>)[key]) : null;
};

describe('Gemini chat transport (@google/genai SDK)', () => {
  it('requests structured replies and keeps credentials out of the URL', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ candidates: [{ content: { parts: [{ text: '{"reply":"Tell me your skin concern."}' }] } }] }));
    vi.stubGlobal('fetch', fetcher);
    expect(await chat()).toBe('Tell me your skin concern.');
    const [url, options] = fetcher.mock.calls[0];
    expect(String(url)).not.toContain('private-test-key');
    expect(headerValue(options.headers, 'x-goog-api-key')).toBe('private-test-key');
    expect(JSON.parse(options.body).generationConfig.responseSchema.required).toEqual(['reply']);
  });

  it('maps quota or credential failures to a safe recoverable error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: 'private upstream details' }, { status: 429 })));
    await expect(chat()).rejects.toMatchObject({ status: 503, code: 'assistant_provider_failed', retryable: true });
  });

  it('handles network failures without exposing internal details', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('private upstream details')));
    await expect(chat()).rejects.toMatchObject({ status: 503, code: 'assistant_unavailable' });
  });

  it('rejects blocked or empty provider replies', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ candidates: [] })));
    await expect(chat()).rejects.toMatchObject({ status: 502, code: 'assistant_invalid_response' });
  });

  it.each(['not JSON', 'null', '{"reply":"   "}'])('rejects malformed or unusable structured output: %s', async (text) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ candidates: [{ content: { parts: [{ text }] } }] })));
    await expect(chat()).rejects.toMatchObject({ status: 502, code: 'assistant_invalid_response' });
  });
});
