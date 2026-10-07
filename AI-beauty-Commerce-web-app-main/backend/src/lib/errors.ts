import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { captureError } from './observe';

export interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    request_id: string;
    retryable: boolean;
    details?: unknown;
  };
}

/** Controlled failure: safe message, explicit status, stable code. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public retryable = false,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const Errors = {
  badRequest: (msg = 'Invalid request.', details?: unknown) =>
    new ApiError(400, 'bad_request', msg, false, details),
  unauthorized: (msg = 'Authentication required.') =>
    new ApiError(401, 'unauthorized', msg),
  forbidden: (msg = 'You do not have access to this resource.') =>
    new ApiError(403, 'forbidden', msg),
  notFound: (msg = 'Resource not found.') => new ApiError(404, 'not_found', msg),
  conflict: (msg = 'Resource already exists.') =>
    new ApiError(409, 'conflict', msg),
  rateLimited: (retryAfterSec: number) =>
    new ApiError(429, 'rate_limited', 'Too many requests. Slow down and retry.', true),
  gone: (msg = 'This link has expired or was already used.') =>
    new ApiError(410, 'gone', msg),
} as const;

/**
 * Route-handler wrapper: consistent envelope, request_id echo, and —
 * critically — unexpected errors collapse to a generic 500. The real error
 * goes to server logs only (never stack traces / SQL to clients, §25).
 */
export function api<TRoute = unknown>(
  handler: (ctx: { requestId: string; req: Request; route?: TRoute }) => Promise<NextResponse>,
) {
  // Second param optional: static routes ignore it; dynamic routes declare
  // their own explicitly-typed handlers (see me/addresses/[id]) because
  // Next's generated route-type checks reject generic-wrapped 2-arg handlers.
  return async (req: Request, route?: TRoute): Promise<NextResponse> => {
    const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
    try {
      enforceOrigin(req);
      const res = await handler({ requestId, req, route });
      res.headers.set('x-request-id', requestId);
      return res;
    } catch (err) {
      return toErrorResponse(err, requestId);
    }
  };
}

/** Shared catch-mapping so hand-rolled dynamic handlers match api() exactly. */
export function toErrorResponse(err: unknown, requestId: string): NextResponse {
  if (err instanceof ApiError) {
    return envelope(err.status, err.code, err.message, requestId, err.retryable, err.details, err.status === 429 ? 60 : undefined);
  }
  if (err instanceof ZodError) {
    // Field names only — never values, never schema internals.
    return envelope(422, 'invalid_input', 'Validation failed.', requestId, false, err.issues.map((i) => ({ path: i.path.join('.'), code: i.code })));
  }
      console.error(JSON.stringify({ level: 'error', requestId, err: String(err) }));
      captureError(err, { requestId });
      return envelope(500, 'internal_error', 'Unable to complete the request.', requestId, true);
}

function envelope(
  status: number,
  code: string,
  message: string,
  requestId: string,
  retryable: boolean,
  details?: unknown,
  retryAfterSec?: number,
) {
  const body: ErrorEnvelope = { error: { code, message, request_id: requestId, retryable } };
  if (details !== undefined) body.error.details = details;
  const res = NextResponse.json(body, { status });
  res.headers.set('x-request-id', requestId);
  if (retryAfterSec !== undefined) res.headers.set('Retry-After', String(retryAfterSec));
  return res;
}

async function boundedText(req: Request, maxBytes: number): Promise<string> {
  const reader = req.body?.getReader();
  if (!reader) return '';
  const parts: Uint8Array[] = [];
  let bytes = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        void reader.cancel();
        throw new ApiError(413, 'payload_too_large', 'Request body too large.');
      }
      parts.push(value);
    }
    return new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(parts));
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw Errors.badRequest('Invalid request body.');
  } finally {
    reader.releaseLock();
  }
}

/** Parse JSON before allocating more than the configured byte limit. */
export async function readJson(req: Request, maxBytes = 1_048_576): Promise<unknown> {
  if (!/^application\/json(?:\s*;|\s*$)/i.test(req.headers.get('content-type') ?? '')) {
    throw new ApiError(415, 'unsupported_media_type', 'Content-Type must be application/json.');
  }
  const text = await boundedText(req, maxBytes);
  if (!text) throw Errors.badRequest('Empty request body.');
  try {
    return JSON.parse(text);
  } catch {
    throw Errors.badRequest('Malformed JSON.');
  }
}

/** Best-effort client IP (trusts x-forwarded-for set by our own proxy). */
export function clientIp(req: Request): string {
  // Forwarded headers are only trustworthy when overwritten by a controlled edge.
  // Configure CLIENT_IP_HEADER with a private header that the edge strips and sets.
  const header = process.env.CLIENT_IP_HEADER;
  const ip = header ? req.headers.get(header)?.trim() || 'unknown' : process.env.NODE_ENV === 'production' ? 'unknown' : req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  return ip.slice(0, 64);
}

const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

/**
 * CSRF origin check (§18): browsers always send Origin on mutating fetches.
 * Present-but-foreign → 403. Absent (curl, server-to-server, native apps) →
 * allowed; SameSite=Lax cookies + session auth still apply. Hand-rolled
 * webhook routes skip this (signature auth instead) — they must call it NEVER.
 */
export function enforceOrigin(req: Request): void {
  if (!MUTATING_METHODS.has(req.method)) return;
  const origin = req.headers.get('origin');
  if (!origin) return;
  const allowlist = [
    process.env.APP_URL,
    process.env.FRONTEND_URL,
    ...(process.env.ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean),
  ].filter(Boolean) as string[];
  if (allowlist.length === 0) {
    // Disconnect rule: dev may run unconfigured (SameSite is the backstop),
    // but production must fail closed — never accept a foreign Origin.
    if (process.env.NODE_ENV === 'production') {
      throw new ApiError(403, 'forbidden_origin', 'Cross-origin requests are not allowed.', false);
    }
    return;
  }
  const norm = (u: string) => {
    try {
      return new URL(u).origin;
    } catch {
      return '';
    }
  };
  const ok = allowlist.some((a) => norm(a) !== '' && norm(a) === norm(origin));
  if (!ok) throw new ApiError(403, 'forbidden_origin', 'Cross-origin requests are not allowed.', false);
}

/** Raw body with a size cap (webhooks bypass readJson — §10 API4). */
export async function readRawBody(req: Request, maxBytes = 262_144): Promise<string> {
  return boundedText(req, maxBytes);
}
