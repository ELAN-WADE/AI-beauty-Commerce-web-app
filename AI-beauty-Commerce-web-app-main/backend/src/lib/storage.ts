import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Private object storage for face-scan images (S3-compatible: AWS/R2/MinIO).
 * Keys are server-generated (never user filenames — §15 path safety); the
 * bucket is private; reads go through 5-minute signed URLs for the owner only.
 */

let client: S3Client | null = null;

export function s3(): S3Client {
  if (client) return client;
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION ?? 'eu-west-1';
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error('S3_ACCESS_KEY / S3_SECRET_KEY are not set (see backend/.env.example).');
  }
  client = new S3Client({
    region,
    ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    credentials: { accessKeyId, secretAccessKey },
  });
  return client;
}

export function scansBucket(): string {
  return process.env.SCANS_BUCKET ?? 'glowly-scans';
}

/** Public bucket for community images/video (readable without signing). */
export function communityBucket(): string {
  return process.env.COMMUNITY_BUCKET ?? 'glowly-community';
}

/**
 * Public read URL for community media. The bucket must allow public GET;
 * writes always go through presigned PUTs (never public write).
 */
export function communityMediaUrl(key: string): string {
  const base = (process.env.COMMUNITY_MEDIA_BASE_URL ?? '').replace(/\/+$/, '');
  if (base) return `${base}/${key}`;
  if (process.env.S3_ENDPOINT) {
    return `${process.env.S3_ENDPOINT.replace(/\/+$/, '')}/${communityBucket()}/${key}`;
  }
  const region = process.env.S3_REGION ?? 'eu-west-1';
  return `https://${communityBucket()}.s3.${region}.amazonaws.com/${key}`;
}

/** community/<mediaId>.<ext> — server-generated ids only, never user filenames. */
export function communityObjectKey(mediaId: string, mime: string): string {
  const ext =
    mime === 'image/png' ? 'png'
    : mime === 'image/webp' ? 'webp'
    : mime === 'video/mp4' ? 'mp4'
    : mime === 'video/webm' ? 'webm'
    : 'jpg';
  const safeId = mediaId.replace(/[^a-z0-9-]/gi, '');
  return `community/${safeId}.${ext}`;
}

export async function deleteObject(bucket: string, key: string): Promise<void> {
  await s3().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

/** scans/<userId>/<analysisId>.<ext> — no user input in the path, ever. */
export function scanObjectKey(userId: string, analysisId: string, mime: string): string {
  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  const safeUser = userId.replace(/[^a-z0-9-]/gi, '');
  const safeId = analysisId.replace(/[^a-z0-9-]/gi, '');
  return `scans/${safeUser}/${safeId}.${ext}`;
}

export async function presignedPutUrl(bucket: string, key: string, mime: string, expiresSec = 900): Promise<string> {
  return getSignedUrl(
    s3(),
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: mime }),
    { expiresIn: expiresSec },
  );
}

export async function presignedGetUrl(bucket: string, key: string, expiresSec = 300): Promise<string> {
  return getSignedUrl(s3(), new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: expiresSec });
}

export async function headScan(bucket: string, key: string): Promise<{ bytes: number; mime: string } | null> {
  try {
    const out = await s3().send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return { bytes: out.ContentLength ?? 0, mime: out.ContentType ?? '' };
  } catch {
    return null;
  }
}

export async function headBytes(bucket: string, key: string, n = 12): Promise<Uint8Array> {
  const out = await s3().send(new GetObjectCommand({ Bucket: bucket, Key: key, Range: `bytes=0-${n - 1}` }));
  const body = out.Body;
  if (!body) return new Uint8Array(0);
  if (typeof (body as { transformToByteArray?: unknown }).transformToByteArray === 'function') {
    return await (body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray();
  }
  const chunks: Uint8Array[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array>) chunks.push(chunk);
  const merged = new Uint8Array(chunks.reduce((s, c) => s + c.length, 0));
  let off = 0;
  for (const c of chunks) {
    merged.set(c, off);
    off += c.length;
  }
  return merged;
}

/** Magic-byte validation (pure, unit-tested): rejects renamed GIFs/SVGs/scripts. */
export function checkMagicBytes(buf: Uint8Array, mime: string): boolean {
  if (buf.length < 12) return false;
  if (mime === 'image/jpeg') return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (mime === 'image/png') {
    return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 && buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a;
  }
  if (mime === 'image/webp') {
    return buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50;
  }
  // MP4: 'ftyp' box at offset 4. WebM: EBML header 0x1A45DFA3.
  if (mime === 'video/mp4') {
    return buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70;
  }
  if (mime === 'video/webm') {
    return buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3;
  }
  return false;
}
