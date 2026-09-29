import { describe, expect, it } from 'vitest';
import { buildEnvelope, captureError, parseDsn } from '@/lib/observe';

// THREAT (blind production: errors nobody sees) → CONTROL (Sentry envelopes,
// no-op without DSN, never throws) → TEST: shape, parsing, safe no-ops.
describe('error reporter', () => {
  it('parses DSNs and rejects garbage', () => {
    expect(parseDsn('https://abc123@sentry.example.com/42')).toEqual({
      scheme: 'https',
      host: 'sentry.example.com',
      publicKey: 'abc123',
      projectId: '42',
    });
    expect(parseDsn('not-a-dsn')).toBeNull();
    expect(parseDsn('')).toBeNull();
  });

  it('builds a three-line Sentry envelope with matching event ids', () => {
    const raw = buildEnvelope('key1', 'boom', { requestId: 'r1' });
    const lines = raw.split('\n');
    expect(lines).toHaveLength(3);
    const header = JSON.parse(lines[0]) as { event_id: string };
    const item = JSON.parse(lines[1]) as { type: string };
    const event = JSON.parse(lines[2]) as { event_id: string; level: string; message: string; extra: { requestId: string } };
    expect(item.type).toBe('event');
    expect(event.event_id).toBe(header.event_id);
    expect(event.level).toBe('error');
    expect(event.message).toBe('boom');
    expect(event.extra.requestId).toBe('r1');
  });

  it('is a silent no-op without a DSN and never throws', () => {
    const OLD = process.env.SENTRY_DSN;
    delete process.env.SENTRY_DSN;
    expect(() => captureError(new Error('x'), { a: 1 })).not.toThrow();
    expect(() => captureError('string failure')).not.toThrow();
    expect(() => captureError(null)).not.toThrow();
    if (OLD !== undefined) process.env.SENTRY_DSN = OLD;
  });
});
