import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { assertPublicMediaStorage, mediaStorageFailure, publicMediaConfigurationStatus } from '@/lib/media-storage';

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('S3_ACCESS_KEY', 'private-fixture-access'); vi.stubEnv('S3_SECRET_KEY', 'private-fixture-secret');
  vi.stubEnv('COMMUNITY_BUCKET', 'test-media'); vi.stubEnv('S3_ENDPOINT', ''); vi.stubEnv('COMMUNITY_MEDIA_BASE_URL', '');
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe('public media deployment configuration', () => {
  it('allows AWS S3 with its standard public URL', () => expect(publicMediaConfigurationStatus()).toEqual({ configured: true, settings: [] }));
  it('requires the R2 public URL separately from its authenticated API endpoint', () => {
    vi.stubEnv('S3_ENDPOINT', 'https://example.r2.cloudflarestorage.com');
    expect(publicMediaConfigurationStatus().settings).toEqual(['COMMUNITY_MEDIA_BASE_URL']);
    vi.stubEnv('COMMUNITY_MEDIA_BASE_URL', 'https://images.example.test');
    expect(publicMediaConfigurationStatus().configured).toBe(true);
  });
  it.each(['http://localhost:9000', 'https://access:secret@example.test', 'https://example.test/bucket', 'https://example.test?token=private'])('rejects unsafe production endpoints', endpoint => {
    vi.stubEnv('S3_ENDPOINT', endpoint);
    expect(publicMediaConfigurationStatus().settings).toContain('S3_ENDPOINT');
  });
  it('reports missing setting names without logging secrets', () => {
    vi.stubEnv('COMMUNITY_BUCKET', '');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => assertPublicMediaStorage()).toThrow('Image storage is not configured');
    const logs = JSON.stringify(warn.mock.calls);
    expect(logs).toContain('COMMUNITY_BUCKET'); expect(logs).not.toContain('private-fixture');
  });
  it.each(['AccessDenied', 'InvalidAccessKeyId', 'NoSuchBucket'])('distinguishes non-retryable %s configuration failures without provider response leakage', name => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = mediaStorageFailure(Object.assign(new Error('private-provider-details'), { name }));
    expect(error.code).toBe('media_storage_configuration'); expect(error.retryable).toBe(false);
    expect(JSON.stringify(warn.mock.calls) + error.message).not.toContain('private-provider-details');
  });
  it('keeps a transient network failure retryable', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(mediaStorageFailure({ code: 'ETIMEDOUT' })).toMatchObject({ code: 'media_storage_unavailable', retryable: true });
  });
});
