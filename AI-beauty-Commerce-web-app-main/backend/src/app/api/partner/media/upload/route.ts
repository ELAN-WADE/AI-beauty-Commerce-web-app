import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { getDb } from '@/db/client';
import { api, Errors } from '@/lib/errors';
import { assertPublicMediaStorage, mediaStorageFailure } from '@/lib/media-storage';
import { requireAuth } from '@/modules/auth/require-auth';
import { requirePerm } from '@/lib/admin';
import { creators } from '@/modules/creators/schema';
import { distributors } from '@/modules/distributors/schema';
import { userRoles } from '@/modules/auth/schema';
import { checkMagicBytes, s3, communityBucket, communityMediaUrl } from '@/lib/storage';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { and, inArray, eq } from 'drizzle-orm';

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB limit

export const POST = api(async ({ req }) => {
  const db = getDb();
  const auth = await requireAuth(db);

  // Require approved partner or admin role
  const [partnerRole] = await db
    .select()
    .from(userRoles)
    .where(and(eq(userRoles.userId, auth.userId), inArray(userRoles.roleId, ['CREATOR', 'DISTRIBUTOR', 'ADMIN', 'SUPER_ADMIN'])));

  if (!partnerRole) {
    throw Errors.forbidden('Approved partner status is required to upload media.');
  }

  if (auth.roles.some(role => ['ADMIN', 'SUPER_ADMIN'].includes(role))) await requirePerm(db, 'products:write');
  else {
    const [creator] = auth.roles.includes('CREATOR') ? await db.select({ id: creators.id }).from(creators).where(and(eq(creators.userId, auth.userId), eq(creators.verified, true))).limit(1) : [];
    const [distributor] = auth.roles.includes('DISTRIBUTOR') ? await db.select({ id: distributors.id }).from(distributors).where(and(eq(distributors.userId, auth.userId), eq(distributors.verified, true))).limit(1) : [];
    if (!creator && !distributor) throw Errors.forbidden('An approved linked partner profile is required to upload media.');
  }

  const formData = await req.formData();
  const file = (formData.get('file') || formData.get('media') || formData.get('image')) as File | null;

  if (!file || typeof file === 'string') {
    throw Errors.badRequest('No media file provided in upload request.');
  }

  if (file.size === 0) throw Errors.badRequest('Choose a non-empty media file.');
  if (file.size > MAX_FILE_SIZE) {
    throw Errors.badRequest('File size exceeds the 15MB limit.');
  }

  const mime = file.type?.toLowerCase() || '';
  const ext = ALLOWED_MIME_TYPES[mime];
  if (!ext) {
    throw Errors.badRequest(`Unsupported media type (${mime || 'unknown'}). Allowed: JPEG, PNG, WEBP, GIF, MP4, WEBM.`);
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Check magic bytes for genuine content
  if (mime.startsWith('image/')) {
    const isMagicValid = checkMagicBytes(buffer, mime === 'image/jpg' ? 'image/jpeg' : mime);
    if (!isMagicValid) {
      const isGif = buffer.length >= 6 && buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38;
      if (mime !== 'image/gif' || !isGif) {
        throw Errors.badRequest('File contents do not match genuine image magic bytes.');
      }
    }
  } else if (mime.startsWith('video/')) {
    // Basic MP4 / WebM container header check
    const isMp4 = buffer.length >= 8 && (buffer.toString('utf8', 4, 8) === 'ftyp' || buffer.toString('utf8', 4, 8) === 'moov');
    const isWebm = buffer.length >= 4 && buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3;
    if (!isMp4 && !isWebm) {
      throw Errors.badRequest('File contents do not match genuine video format.');
    }
  }

  const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 16);
  const fileName = `partner-${Date.now()}-${hash}.${ext}`;
  const relativeUrl = `/uploads/partner/${fileName}`;

  // Persist to local disk directories (both root and backend)
  const rootUploadsDir = path.resolve(process.cwd(), '../public/uploads/partner');
  const backendUploadsDir = path.resolve(process.cwd(), 'public/uploads/partner');

  let localSaved = false;
  for (const dir of process.env.NODE_ENV === 'production' ? [] : [rootUploadsDir, backendUploadsDir]) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(path.join(dir, fileName), buffer);
      if (dir === backendUploadsDir) localSaved = true;
    } catch {
      // Best-effort local persistence
    }
  }

  // Sync to S3 if configured
  let s3Url: string | undefined;
  try {
    if (process.env.NODE_ENV === 'production') assertPublicMediaStorage();
    const s3Key = `partner/${fileName}`;
    await s3().send(new PutObjectCommand({ Bucket: communityBucket(), Key: s3Key, Body: buffer, ContentType: mime, CacheControl: 'public, max-age=31536000, immutable' }));
    s3Url = communityMediaUrl(s3Key);
  } catch (error) {
    if (process.env.NODE_ENV === 'production' || !localSaved) throw mediaStorageFailure(error);
  }

  return NextResponse.json({
    url: s3Url || new URL(relativeUrl, process.env.APP_URL || req.url).toString(),
    fileName,
    size: buffer.length,
    mimeType: mime,
  });
});

