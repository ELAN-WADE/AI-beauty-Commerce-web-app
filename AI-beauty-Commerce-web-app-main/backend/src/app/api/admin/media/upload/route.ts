import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { getDb } from '@/db/client';
import { api, ApiError, Errors } from '@/lib/errors';
import { requirePerm } from '@/lib/admin';
import { checkMagicBytes, s3, communityBucket, communityMediaUrl } from '@/lib/storage';
import { PutObjectCommand } from '@aws-sdk/client-s3';

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const POST = api(async ({ req }) => {
  const db = getDb();
  await requirePerm(db, 'products:write');

  const formData = await req.formData();
  const file = (formData.get('file') || formData.get('image')) as File | null;

  if (!file || typeof file === 'string') {
    throw Errors.badRequest('No image file provided in upload request.');
  }

  if (file.size === 0) throw Errors.badRequest('Choose a non-empty image.');
  if (file.size > (file.type.startsWith('video/') ? 50 * 1024 * 1024 : MAX_FILE_SIZE)) {
    throw Errors.badRequest('File size exceeds the image (10MB) or video (50MB) limit.');
  }

  const mime = file.type?.toLowerCase() || '';
  const ext = ALLOWED_MIME_TYPES[mime];
  if (!ext) {
    throw Errors.badRequest(`Unsupported media type (${mime || 'unknown'}). Allowed types: JPEG, PNG, WEBP, GIF, MP4, WEBM.`);
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const isMagicValid = checkMagicBytes(buffer, mime === 'image/jpg' ? 'image/jpeg' : mime);
  if (!isMagicValid) {
    const isGif = buffer.length >= 6 && buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38;
    if (mime !== 'image/gif' || !isGif) {
      throw Errors.badRequest('File contents do not match genuine media magic bytes.');
    }
  }

  // Safe unique filename
  const safeBase = file.name
    ? path.basename(file.name, path.extname(file.name)).replace(/[^a-z0-9_-]/gi, '').slice(0, 32)
    : 'packshot';
  const uniqueSuffix = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const filename = `${safeBase || 'packshot'}_${uniqueSuffix}.${ext}`;
  const publicRelativeUrl = `/uploads/products/${filename}`;

  // Ensure directories exist in both current working directory public and ../public if available
  const targetDirs = [
    path.resolve(process.cwd(), 'public/uploads/products'),
    path.resolve(process.cwd(), '../public/uploads/products'),
  ];

  let localSaved = false;
  for (const dir of targetDirs) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(path.resolve(dir, filename), buffer);
      if (dir === targetDirs[0]) localSaved = true;
    } catch (fsErr) {
      console.warn(`[admin/media/upload] Could not write to ${dir}:`, fsErr);
    }
  }

  let remoteUrl: string | undefined;
  try {
    const s3Key = `products/${filename}`;
    await s3().send(new PutObjectCommand({ Bucket: communityBucket(), Key: s3Key, Body: buffer, ContentType: mime }));
    remoteUrl = communityMediaUrl(s3Key);
  } catch {
    if (process.env.NODE_ENV === 'production' || !localSaved) throw new ApiError(503, 'media_storage_unavailable', 'The media could not be saved. Please retry.', true);
  }

  return NextResponse.json({
    url: remoteUrl || new URL(publicRelativeUrl, process.env.APP_URL || req.url).toString(),
    filename,
    size: buffer.length,
    mimeType: mime,
  }, {
    status: 201,
    headers: { 'Cache-Control': 'no-store' }
  });
});

