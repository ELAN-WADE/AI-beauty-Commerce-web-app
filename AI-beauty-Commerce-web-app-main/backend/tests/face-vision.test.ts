import { afterEach, describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';
import { FACE_CONSENT, faceInputSchema, observeFace } from '@/modules/skin/vision';
import { GeminiProvider } from '@/lib/ai-provider';

const result = {
  facePresent: true,
  suitableForAnalysis: true,
  skinType: 'unknown',
  observations: ['Visible shine'],
  summary: 'A cosmetic observation.',
  limitations: 'Lighting and one photo limit this assessment.',
};

const pngBytes = () =>
  sharp({ create: { width: 8, height: 8, channels: 3, background: '#aabbcc' } }).png().toBuffer();

const input = async (): Promise<{ consentAccepted: true; consentVersion: typeof FACE_CONSENT; image: string }> => ({
  consentAccepted: true,
  consentVersion: FACE_CONSENT,
  image: 'data:image/png;base64,' + (await pngBytes()).toString('base64'),
});

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

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('real vision boundary (@google/genai SDK)', () => {
  it('requires explicit versioned consent and rejects arbitrary or oversized input', async () => {
    const value = await input();
    expect(faceInputSchema.safeParse({ ...value, consentAccepted: false }).success).toBe(false);
    expect(faceInputSchema.safeParse({ ...value, consentVersion: 'old' }).success).toBe(false);
    expect(faceInputSchema.safeParse({ ...value, image: 'https://example.com/face.jpg' }).success).toBe(false);
  });

  it('does not contact a provider without configuration', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    await expect(observeFace(await input())).rejects.toMatchObject({ status: 503 });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('normalizes the actual image and sends the key in a header via @google/genai, returning qualitative observations only', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'private-key');
    const fetcher = vi.fn().mockResolvedValue(
      Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(result) }] } }] }),
    );
    vi.stubGlobal('fetch', fetcher);
    expect(await observeFace(await input())).toEqual(result);
    const [url, options] = fetcher.mock.calls[0];
    expect(String(url)).not.toContain('private-key');
    expect(headerValue(options.headers, 'x-goog-api-key')).toBe('private-key');
    const body = JSON.parse(options.body);
    const inlinePart = body.contents[0].parts[1].inlineData ?? body.contents[0].parts[1].inline_data;
    expect(inlinePart.mimeType ?? inlinePart.mime_type).toBe('image/jpeg');
    const photo = Buffer.from(inlinePart.data, 'base64');
    expect((await sharp(photo).metadata()).format).toBe('jpeg');
    expect(body.contents[0].parts[0].text).toContain('Do not invent');
  });

  it('requires real image bytes in GeminiProvider.analyze() and transmits actual normalized JPEG data', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'private-key');
    const fetcher = vi.fn().mockResolvedValue(
      Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ ...result, skinType: 'combination' }) }] } }] }),
    );
    vi.stubGlobal('fetch', fetcher);
    const provider = new GeminiProvider('private-key');
    await expect(provider.analyze({ skinTypeHint: 'dry', concernHints: ['dryness'] })).rejects.toMatchObject({ status: 400, code: 'image_required' });
    const analyzed = await provider.analyze({
      skinTypeHint: 'dry',
      concernHints: ['dryness'],
      imageBytes: await pngBytes(),
      imageMime: 'image/png',
    });
    expect(analyzed.skinType).toBe('combination');
    expect(analyzed.concerns).toEqual(['Visible shine']);
    expect(analyzed.hydration).toBe(0);
    expect(analyzed.oiliness).toBe(0);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('rejects a MIME mismatch before calling Gemini', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'private-key');
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    const value = await input();
    await expect(observeFace({ ...value, image: value.image.replace('image/png', 'image/jpeg') })).rejects.toMatchObject({ status: 400 });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('does not accept invented numeric fields or expose provider response bodies', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'private-key');
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ ...result, hydration: 88 }) }] } }] }))
        .mockResolvedValueOnce(Response.json({ secret: 'provider-internals' }, { status: 403 })),
    );
    await expect(observeFace(await input())).rejects.toMatchObject({ status: 502, code: 'scan_invalid_response' });
    await expect(observeFace(await input())).rejects.toMatchObject({ status: 502, code: 'scan_provider_failed' });
  });
});
