import { ApiError } from './errors';

/** Setting names only: safe for deployment diagnostics, never credential values. */
export function publicMediaConfigurationStatus() {
  const settings = ['S3_ACCESS_KEY', 'S3_SECRET_KEY', 'COMMUNITY_BUCKET'].filter(key => !process.env[key]?.trim());
  for (const key of ['S3_ENDPOINT', 'COMMUNITY_MEDIA_BASE_URL']) {
    const raw = process.env[key]?.trim();
    if (!raw) continue;
    try {
      const url = new URL(raw);
      if (url.username || url.password || url.search || url.hash || !['http:', 'https:'].includes(url.protocol)) throw new Error();
      if (key === 'S3_ENDPOINT' && url.pathname !== '/') throw new Error();
      if (process.env.NODE_ENV === 'production' && (url.protocol !== 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) throw new Error();
    } catch { settings.push(key); }
  }
  // R2's authenticated API endpoint is not its public image-serving URL.
  if (/\.r2\.cloudflarestorage\.com\/?$/i.test(process.env.S3_ENDPOINT || '') && !process.env.COMMUNITY_MEDIA_BASE_URL?.trim()) settings.push('COMMUNITY_MEDIA_BASE_URL');
  return { configured: settings.length === 0, settings };
}

export function assertPublicMediaStorage() {
  const status = publicMediaConfigurationStatus();
  if (status.configured) return;
  console.warn(JSON.stringify({ scope: 'media-storage', code: 'media_storage_configuration', settings: status.settings }));
  throw new ApiError(503, 'media_storage_configuration', 'Image storage is not configured. Connect media storage in the server settings before uploading.');
}

export function mediaStorageFailure(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  const candidate = error as { name?: string; code?: string; cause?: { code?: string } } | null;
  const known = ['AccessDenied', 'InvalidAccessKeyId', 'SignatureDoesNotMatch', 'ExpiredToken', 'NoSuchBucket', 'NotFound', 'ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET'];
  const code = [candidate?.name, candidate?.code, candidate?.cause?.code].find(value => value && known.includes(value)) || 'storage_unavailable';
  console.warn(JSON.stringify({ scope: 'media-storage', code }));
  const configuration = ['AccessDenied', 'InvalidAccessKeyId', 'SignatureDoesNotMatch', 'ExpiredToken', 'NoSuchBucket', 'NotFound'].includes(code);
  return new ApiError(503, configuration ? 'media_storage_configuration' : 'media_storage_unavailable', configuration
    ? 'Image storage rejected the upload. Check the storage credentials, bucket and upload permissions.'
    : 'Image storage is temporarily unavailable. Please retry the upload.', !configuration);
}
