import { z } from 'zod';

const uuid = z.string().uuid();

export const postQuerySchema = z
  .object({
    productId: uuid.optional(),
    hashtag: z.string().trim().max(80).optional(),
    limit: z.coerce.number().int().min(1).default(20).transform((v) => Math.min(v, 50)),
    cursor: z.string().max(500).optional(),
  })
  .strict();

export const createPostSchema = z
  .object({
    content: z.string().trim().min(1).max(2000),
    mediaType: z.enum(['image', 'video']).optional(),
    mediaUrl: z.string().trim().url().max(500).optional(),
    // Verified-upload path: server-staged media, consumed at post time.
    mediaId: uuid.optional(),
    taggedProductId: uuid.optional(),
    taggedHashtag: z.string().trim().max(80).optional(),
  })
  .strict()
  .refine((v) => (v.mediaType ? !!v.mediaUrl : true), 'mediaUrl is required with mediaType.')
  .refine((v) => !(v.mediaId && (v.mediaType || v.mediaUrl)), 'Provide either mediaId or mediaUrl, not both.');

export const chatQuerySchema = z
  .object({
    channel: z.string().trim().min(1).max(40).default('routine'),
    limit: z.coerce.number().int().min(1).default(30).transform((v) => Math.min(v, 50)),
  })
  .strict();

export const chatMessageSchema = z
  .object({
    channel: z.string().trim().min(1).max(40).default('routine'),
    message: z.string().trim().min(1).max(1000),
  })
  .strict();

export const COMMUNITY_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const COMMUNITY_VIDEO_MIMES = ['video/mp4', 'video/webm'] as const;
/** Images ≤ 8 MB, video ≤ 64 MB (matches community_media CHECK + S3 UX). */
export const COMMUNITY_MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const COMMUNITY_MAX_VIDEO_BYTES = 64 * 1024 * 1024;

export const initMediaSchema = z
  .object({
    mime: z.enum([...COMMUNITY_IMAGE_MIMES, ...COMMUNITY_VIDEO_MIMES]),
    bytes: z.number().int().min(1).max(COMMUNITY_MAX_VIDEO_BYTES),
  })
  .strict()
  .refine(
    (v) => (v.mime.startsWith('video/') ? v.bytes <= COMMUNITY_MAX_VIDEO_BYTES : v.bytes <= COMMUNITY_MAX_IMAGE_BYTES),
    'File exceeds the size limit for its type.',
  );
