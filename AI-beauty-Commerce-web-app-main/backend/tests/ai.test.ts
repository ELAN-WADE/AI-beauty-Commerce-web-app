import { describe, expect, it } from 'vitest';
import { checkMagicBytes, scanObjectKey } from '@/lib/storage';
import { MockAiProvider } from '@/lib/ai-provider';
import { matchingRules } from '@/modules/skin/service';
import { ANALYSIS_MAX_BYTES, initAnalysisSchema } from '@/modules/skin/validation';
import { chatMessageSchema } from '@/modules/ai/validation';

// THREAT (malicious uploads: renamed scripts/GIFs) → CONTROL (magic bytes +
// private bucket + generated keys) → TEST: real headers pass, masquerades fail.
describe('image intake guards', () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
  const gif = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0, 0, 0, 0, 0]);

  it('accepts genuine headers, rejects masquerades and truncations', () => {
    expect(checkMagicBytes(png, 'image/png')).toBe(true);
    expect(checkMagicBytes(jpg, 'image/jpeg')).toBe(true);
    expect(checkMagicBytes(webp, 'image/webp')).toBe(true);
    expect(checkMagicBytes(gif, 'image/jpeg')).toBe(false); // GIF renamed to .jpg
    expect(checkMagicBytes(png, 'image/jpeg')).toBe(false); // mime/header mismatch
    expect(checkMagicBytes(new Uint8Array([0xff, 0xd8]), 'image/jpeg')).toBe(false);
    expect(checkMagicBytes(png, 'image/gif')).toBe(false); // unsupported mime
  });

  it('generates traversal-proof keys (no user filenames in storage paths)', () => {
    const key = scanObjectKey('../../etc', 'a1b2', 'image/png');
    expect(key).toBe('scans/etc/a1b2.png');
    expect(key).not.toContain('..');
    expect(scanObjectKey('u1', 'x', 'image/jpeg')).toBe('scans/u1/x.jpg');
  });

  it('consent is explicit and versioned; uploads are bounded', () => {
    const good = { consentAccepted: true as const, consentVersion: '2026-09-v1', mime: 'image/jpeg' as const, bytes: 1024 };
    expect(initAnalysisSchema.safeParse(good).success).toBe(true);
    expect(initAnalysisSchema.safeParse({ ...good, consentAccepted: false }).success).toBe(false);
    expect(initAnalysisSchema.safeParse({ ...good, consentVersion: '2020-v1' }).success).toBe(false);
    expect(initAnalysisSchema.safeParse({ ...good, mime: 'image/gif' }).success).toBe(false);
    expect(initAnalysisSchema.safeParse({ ...good, bytes: ANALYSIS_MAX_BYTES + 1 }).success).toBe(false);
  });
});

describe('recommendation rules (DB-grounding contract)', () => {
  it('routes concerns to catalogue categories, never invents products', () => {
    const dry = matchingRules(['dryness', 'ashy skin']);
    expect(dry.some((r) => r.categories.includes('body-care'))).toBe(true);
    const sun = matchingRules(['hyperpigmentation', 'sun damage']);
    expect(sun.some((r) => r.subLikes.includes('sunscreen'))).toBe(true);
    const scent = matchingRules(['oud fragrance']);
    expect(scent.some((r) => r.categories.includes('fragrance'))).toBe(true);
    const unknown = matchingRules(['quantum zylophone']);
    expect(unknown).toHaveLength(1);
    expect(unknown[0].reason).toBe('Community bestsellers');
  });
});

describe('assistant input + mock honesty', () => {
  it('bounds chat input and strips control fields', () => {
    expect(chatMessageSchema.safeParse({ content: 'hi' }).success).toBe(true);
    expect(chatMessageSchema.safeParse({ content: '' }).success).toBe(false);
    expect(chatMessageSchema.safeParse({ content: 'x'.repeat(2001) }).success).toBe(false);
    expect(chatMessageSchema.safeParse({ content: 'hi', role: 'admin' }).success).toBe(false);
  });

  it('mock provider is deterministic and labels itself', async () => {
    const mock = new MockAiProvider();
    const a = (await mock.analyze({ skinTypeHint: 'dry', concernHints: ['dryness'] })) as { concerns: string[]; summary: string };
    const b = (await mock.analyze({ skinTypeHint: 'dry', concernHints: ['dryness'] })) as { concerns: string[] };
    expect(a).toEqual(b);
    expect(a.concerns).toContain('dryness');
    expect(a.summary).toMatch(/Mock/);
    const chat = await mock.chat({ history: [{ role: 'user', content: 'oily skin?' }], catalog: [] });
    expect(chat).toMatch(/Mock/);
  });
});
