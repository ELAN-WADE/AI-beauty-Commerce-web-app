import { createHash } from 'node:crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import type { Db } from '../../db/client';
import { renderPasswordReset, renderVerifyEmail, type EmailMessage } from '../../lib/email';
import { openAuthUrl, sealAuthUrl } from '../../lib/outbox-crypto';
import { enqueueNotification } from '../notifications/service';
import { emailVerificationTokens, passwordResetTokens, users } from './schema';

type AuthEmailTemplate = 'auth.verify-email' | 'auth.reset-password';

/** Storefront origin for browser redirects and email links (never the API host). */
export function frontendOrigin(): URL {
  const configured = process.env.FRONTEND_URL;
  if (!configured && process.env.NODE_ENV === 'production') throw new Error('FRONTEND_URL is required for account emails.');
  const base = new URL(configured || 'http://localhost:5173');
  const localHttp = process.env.NODE_ENV !== 'production' && base.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname);
  if ((base.protocol !== 'https:' && !localHttp) || base.username || base.password || base.pathname !== '/' || base.search || base.hash) {
    throw new Error('FRONTEND_URL must be an HTTPS storefront origin (localhost HTTP is allowed in development).');
  }
  return base;
}

/** Auth screens are served by the storefront, not the API host. */
export function authEmailLink(template: AuthEmailTemplate, token: string): string {
  const base = frontendOrigin();
  const url = new URL(template === 'auth.verify-email' ? '/verify-email' : '/reset-password', base);
  url.searchParams.set('token', token);
  return url.toString();
}

/** Call inside the transaction that inserts the hashed one-time token. */
export async function enqueueAuthEmail(tx: Db, input: { userId: string; email: string; template: AuthEmailTemplate; token: string }) {
  return enqueueNotification(tx, {
    userId: input.userId, channel: 'email', template: input.template,
    payload: { email: input.email, sealedUrl: sealAuthUrl(authEmailLink(input.template, input.token)) },
  });
}

/** Recheck the token at delivery time: delayed/obsolete messages are discarded. */
export async function pendingAuthEmail(
  db: Db,
  row: { userId: string | null; template: string; payload: unknown },
  now = new Date(),
): Promise<EmailMessage | null> {
  if (!row.userId || !['auth.verify-email', 'auth.reset-password'].includes(row.template)) return null;
  const payload = row.payload as { email?: unknown; sealedUrl?: unknown } | null;
  if (typeof payload?.sealedUrl !== 'string' || typeof payload.email !== 'string') return null;
  const url = new URL(openAuthUrl(payload.sealedUrl));
  const raw = url.searchParams.get('token');
  if (!raw || !/^[a-f0-9]{64}$/.test(raw)) return null;
  const [user] = await db.select().from(users).where(eq(users.id, row.userId)).limit(1);
  if (!user || user.email !== payload.email) return null;
  const verification = row.template === 'auth.verify-email';
  if (verification && user.emailVerifiedAt) return null;
  const table = verification ? emailVerificationTokens : passwordResetTokens;
  const [token] = await db.select({ expiresAt: table.expiresAt }).from(table).where(and(
    eq(table.userId, user.id), eq(table.tokenHash, createHash('sha256').update(raw).digest('hex')),
    isNull(table.consumedAt), gt(table.expiresAt, now),
  )).limit(1);
  if (!token) return null;
  // Rebuild from trusted configuration so queued emails follow an origin correction.
  const link = authEmailLink(row.template as AuthEmailTemplate, raw);
  const message = verification
    ? renderVerifyEmail({ verifyUrl: link, email: user.email, expiresAt: token.expiresAt })
    : renderPasswordReset({ resetUrl: link, email: user.email, expiresAt: token.expiresAt });
  return { ...message, to: user.email };
}
