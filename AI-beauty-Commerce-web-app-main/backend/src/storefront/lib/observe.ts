// Minimal frontend error reporter (no dependencies): posts to Sentry's
// envelope endpoint when VITE_SENTRY_DSN is set, otherwise a no-op.
// PII rule: messages only, never form contents, cart contents, or tokens.

function parseDsn(dsn: string): { scheme: string; host: string; key: string; project: string } | null {
  const m = dsn.match(/^(https?):\/\/([^@/]+)@([^/]+)\/(\d+)\/?$/);
  if (!m) return null;
  return { scheme: m[1], key: m[2], host: m[3], project: m[4] };
}

function uid(): string {
  try {
    return [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`.padEnd(32, '0').slice(0, 32);
  }
}

import { publicEnv, appMode } from './env';

export function reportError(err: unknown, context: Record<string, unknown> = {}): void {
  const dsn = publicEnv('NEXT_PUBLIC_SENTRY_DSN', 'VITE_SENTRY_DSN');
  if (!dsn) return;
  const parsed = parseDsn(dsn);
  if (!parsed) return;
  try {
    const eventId = uid();
    const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    const body =
      `${JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString() })}\n` +
      `${JSON.stringify({ type: 'event' })}\n` +
      JSON.stringify({ event_id: eventId, level: 'error', logger: 'glowly-storefront', environment: appMode(), message: message.slice(0, 1000), extra: context });
    fetch(`${parsed.scheme}://${parsed.host}/api/${parsed.project}/envelope/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${parsed.key}, sentry_client=glowly-storefront/0.1`,
      },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Observability must never break the app it observes.
  }
}

export function initErrorReporting(): void {
  if (!publicEnv('NEXT_PUBLIC_SENTRY_DSN', 'VITE_SENTRY_DSN')) return;
  window.addEventListener('error', (event) => {
    reportError(event.error ?? event.message, { source: 'window.onerror', screen: window.location.pathname });
  });
  window.addEventListener('unhandledrejection', (event) => {
    reportError(event.reason, { source: 'unhandledrejection', screen: window.location.pathname });
  });
}
