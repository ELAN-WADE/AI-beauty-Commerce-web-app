'use server';

/**
 * Phase 5 — community Server Actions (posts, likes, chat).
 * Same validation/auth as the REST routes, same silent single-attempt
 * semantics as the storefront mirrors (no idempotent retry → no REST
 * fallback; a dropped mirror is invisible, exactly like a failed REST
 * mirror today). Reads stay REST (cacheable GETs).
 */
import { z } from 'zod';
import { getDb } from '@/db/client';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requireAuth } from '@/modules/auth/require-auth';
import { getProfile } from '@/modules/users/service';
import { createPost, postMessage, togglePostLike } from '@/modules/community/service';
import { chatMessageSchema } from '@/modules/community/validation';
import { actionClientIp, toActionFailure, type ActionResult } from './_shared';

const CHAT_LIMIT = { limit: 30, windowMs: 60_000 };

export async function createPostAction(input: {
  content: string;
  taggedProductId?: string;
  taggedProductHashtag?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const db = getDb();
    const ctx = await requireAuth(db);
    if (!checkRateLimit(`action:posts:${ctx.userId}`, Limits.posts).allowed) {
      return { ok: false, status: 429, code: 'rate_limited', message: 'Posting too fast. Slow down.' };
    }
    // Client sends slug-or-uuid product tags; service takes uuid — resolve
    // taggedProductId only when it parses as uuid, else treat as hashtag-less.
    // createPostSchema is refine-wrapped (no .extend): re-declare the same
    // field constraints with slug-tolerant product tags.
    const raw = z
      .object({
        content: z.string().trim().min(1).max(2000),
        taggedProductId: z.string().trim().max(120).optional(),
        taggedHashtag: z.string().trim().max(80).optional(),
      })
      .strict()
      .parse(input);
    // Storefront tags products by slug; the service keys by uuid — resolve
    // here (REST 422'd slug tags, silently dropping them; actions honor them).
    let taggedProductId: string | undefined;
    const tag = (raw.taggedProductId ?? '').trim();
    if (tag) {
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tag)) {
        taggedProductId = tag;
      } else {
        const { products } = await import('@/modules/catalog/schema');
        const { eq } = await import('drizzle-orm');
        const rows = await db.select({ id: products.id }).from(products).where(eq(products.slug, tag.toLowerCase())).limit(1);
        if (!rows[0]) {
          const { Errors: Err } = await import('@/lib/errors');
          throw Err.notFound('Tagged product not found.');
        }
        taggedProductId = rows[0].id;
      }
    }
    const profile = await getProfile(db, ctx.userId).catch(() => null);
    const post = await createPost(
      db,
      ctx.userId,
      { name: profile?.displayName || ctx.email.split('@')[0] || 'Member', avatar: profile?.avatarUrl ?? undefined },
      {
        content: raw.content,
        ...(taggedProductId ? { taggedProductId } : {}),
        ...(raw.taggedHashtag ? { taggedHashtag: raw.taggedHashtag } : {}),
      },
    );
    return { ok: true, data: { id: post.id } };
  } catch (err) {
    const f = toActionFailure(err);
    return { ok: false, ...f };
  }
}

export async function likePostAction(postId: string): Promise<ActionResult<{ liked: boolean }>> {
  try {
    const db = getDb();
    const ctx = await requireAuth(db);
    if (!checkRateLimit(`action:likes:${ctx.userId}`, Limits.wishlist).allowed) {
      return { ok: false, status: 429, code: 'rate_limited', message: 'Too many requests. Slow down and try again.' };
    }
    const id = z.string().uuid().parse(postId);
    const res = await togglePostLike(db, ctx.userId, id);
    return { ok: true, data: { liked: res.liked } };
  } catch (err) {
    const f = toActionFailure(err);
    return { ok: false, ...f };
  }
}

export async function sendChatAction(channel: string, message: string): Promise<ActionResult<{ id: string }>> {
  try {
    const db = getDb();
    const rl = checkRateLimit(`action:chat:${await actionClientIp()}`, CHAT_LIMIT);
    if (!rl.allowed) return { ok: false, status: 429, code: 'rate_limited', message: 'Chatting too fast. Slow down.' };
    const ctx = await requireAuth(db);
    const parsed = chatMessageSchema.parse({ channel, message });
    const profile = await getProfile(db, ctx.userId).catch(() => null);
    const msg = await postMessage(
      db,
      ctx.userId,
      { name: profile?.displayName || ctx.email.split('@')[0] || 'Member', avatar: profile?.avatarUrl ?? undefined },
      parsed,
    );
    return { ok: true, data: { id: msg.id } };
  } catch (err) {
    const f = toActionFailure(err);
    return { ok: false, ...f };
  }
}
