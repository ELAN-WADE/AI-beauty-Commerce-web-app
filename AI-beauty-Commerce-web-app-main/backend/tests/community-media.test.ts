import { describe, expect, it } from 'vitest';
import { checkMagicBytes, communityMediaUrl, communityObjectKey } from '@/lib/storage';
import { createPostSchema, initMediaSchema } from '@/modules/community/validation';

// THREAT (renamed executables served as community video) → CONTROL
// (magic-byte allowlist) → TEST: only genuine containers pass.
describe('community media magic bytes', () => {
  const mp4 = new Uint8Array([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32]);
  const webm = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
  const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);

  it('accepts genuine mp4/webm containers, rejects scripts and cross-type lies', () => {
    expect(checkMagicBytes(mp4, 'video/mp4')).toBe(true);
    expect(checkMagicBytes(webm, 'video/webm')).toBe(true);
    expect(checkMagicBytes(Buffer.from('<script>alert(1)</script>'), 'video/mp4')).toBe(false);
    expect(checkMagicBytes(mp4, 'video/webm')).toBe(false);
    expect(checkMagicBytes(jpg, 'video/mp4')).toBe(false);
    expect(checkMagicBytes(new Uint8Array(4), 'video/mp4')).toBe(false);
  });

  it('still accepts genuine images and rejects renamed payloads', () => {
    expect(checkMagicBytes(jpg, 'image/jpeg')).toBe(true);
    expect(checkMagicBytes(mp4, 'image/jpeg')).toBe(false);
  });
});

describe('community upload validation', () => {
  it('allows declared images and video within per-type caps', () => {
    expect(initMediaSchema.safeParse({ mime: 'image/jpeg', bytes: 8 * 1024 * 1024 }).success).toBe(true);
    expect(initMediaSchema.safeParse({ mime: 'video/mp4', bytes: 64 * 1024 * 1024 }).success).toBe(true);
  });

  it('rejects gifs, svg, oversized images, and empty payloads', () => {
    expect(initMediaSchema.safeParse({ mime: 'image/gif', bytes: 100 }).success).toBe(false);
    expect(initMediaSchema.safeParse({ mime: 'image/svg+xml', bytes: 100 }).success).toBe(false);
    expect(initMediaSchema.safeParse({ mime: 'image/png', bytes: 8 * 1024 * 1024 + 1 }).success).toBe(false);
    expect(initMediaSchema.safeParse({ mime: 'video/mp4', bytes: 0 }).success).toBe(false);
  });

  it('forces one media path per post: staged mediaId xor pasted mediaUrl', () => {
    const id = '11111111-1111-4111-8111-111111111111';
    expect(createPostSchema.safeParse({ content: 'hi', mediaId: id }).success).toBe(true);
    expect(createPostSchema.safeParse({ content: 'hi', mediaType: 'image', mediaUrl: 'https://x/y.jpg' }).success).toBe(true);
    expect(createPostSchema.safeParse({ content: 'hi', mediaId: id, mediaUrl: 'https://x/y.jpg' }).success).toBe(false);
    expect(createPostSchema.safeParse({ content: 'hi', mediaId: id, mediaType: 'video' }).success).toBe(false);
  });
});

describe('community storage keys and urls', () => {
  it('derives safe server keys with no user input in the path', () => {
    expect(communityObjectKey('abc-123', 'video/mp4')).toBe('community/abc-123.mp4');
    expect(communityObjectKey('../../etc/passwd', 'image/png')).toBe('community/etcpasswd.png');
    expect(communityObjectKey('abc-123', 'image/jpeg')).toBe('community/abc-123.jpg');
  });

  it('builds public urls from explicit base, endpoint, or aws default', () => {
    const OLD = { ...process.env };
    process.env.COMMUNITY_MEDIA_BASE_URL = 'https://media.example.com';
    expect(communityMediaUrl('community/a.mp4')).toBe('https://media.example.com/community/a.mp4');
    delete process.env.COMMUNITY_MEDIA_BASE_URL;
    process.env.S3_ENDPOINT = 'http://localhost:9000';
    process.env.COMMUNITY_BUCKET = 'test-community';
    expect(communityMediaUrl('community/a.mp4')).toBe('http://localhost:9000/test-community/community/a.mp4');
    process.env = { ...OLD };
  });
});
