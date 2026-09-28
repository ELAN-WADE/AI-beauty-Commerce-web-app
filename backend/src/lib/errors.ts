import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

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

/** Parse JSON body with a size cap (default 1 MB, §10 API4). */export async function readJson(req: Request, maxBytes = 1_048_576): Promise<unknown> {
  const text = await req.text();
  if (text.length > maxBytes) {
    throw new ApiError(413, 'payload_too_large', 'Request body too large.', false);
  }
  if (!text) throw Errors.badRequest('Empty request body.');
  try {
    return JSON.parse(text);
  } catch {
    throw Errors.badRequest('Malformed JSON.');
  }
}

/** Best-effort client IP (trusts x-forwarded-for set by our own proxy). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  const ip = fwd?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  return ip.slice(0, 64);
}
