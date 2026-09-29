import { randomBytes } from 'node:crypto';

/**
 * Minimal Sentry-compatible error reporter (zero dependencies).
 * Sends event envelopes to a real Sentry project when SENTRY_DSN is set;
 * otherwise a no-op (console logging stays as the local backstop).
 * Never throws, never blocks the request path (fire-and-forget + timeout).
 */

interface ParsedDsn {
  scheme: string;
  host: string;
  publicKey: string;
  projectId: string;
}

export function parseDsn(dsn: string): ParsedDsn | null {
  const m = dsn.match(/^(https?):\/\/([^@/]+)@([^/]+)\/(\d+)\/?$/);
  if (!m) return null;
  return { scheme: m[1], host: m[3], publicKey: m[2], projectId: m[4] };
}

function hexId(bytes = 16): string {
  return randomBytes(bytes).toString('hex');
}

export function buildEnvelope(publicKey: string, message: string, extra: Record<string, unknown>): string {
  const eventId = hexId();
  const header = JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString() });
  const itemHeader = JSON.stringify({ type: 'event' });
  const payload = JSON.stringify({
    event_id: eventId,
    level: 'error',
    logger: 'glowly',
    environment: process.env.APP_ENV ?? process.env.NODE_ENV ?? 'development',
    message,
    extra,
  });
  return `${header}\n${itemHeader}\n${payload}`;
}

/** Fire-and-forget. Safe to call from catch paths and request handlers. */
export function captureError(err: unknown, context: Record<string, unknown> = {}): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  const parsed = parseDsn(dsn);
  if (!parsed) return;
  const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  const body = buildEnvelope(parsed.publicKey, message.slice(0, 1000), {
    ...context,
    stack: err instanceof Error ? String(err.stack ?? '').slice(0, 4000) : undefined,
  });
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3000);
  fetch(`${parsed.scheme}://${parsed.host}/api/${parsed.projectId}/envelope/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-sentry-envelope',
      'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${parsed.publicKey}, sentry_client=glowly-backend/0.1`,
    },
    body,
    signal: ctrl.signal,
  })
    .catch(() => {
      // Observability must never break the app it observes.
    })
    .finally(() => clearTimeout(timer));
}
