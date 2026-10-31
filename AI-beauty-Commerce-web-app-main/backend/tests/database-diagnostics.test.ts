import { describe, expect, it } from 'vitest';
import { databaseDiagnostics, isTransientDatabaseFailure } from '@/lib/database-diagnostics';
describe('safe nested database diagnostics', () => {
  it('distinguishes transient connection failures from schema/authentication errors', () => {
    expect(isTransientDatabaseFailure({ cause: { code: 'CONNECT_TIMEOUT' } })).toBe(true);
    expect(isTransientDatabaseFailure({ cause: { code: '28P01' } })).toBe(false);
    expect(isTransientDatabaseFailure({ cause: { code: '42P01' } })).toBe(false);
  });
  it.each(['42P01', '42703', '28P01', '3D000', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET', 'CONNECT_TIMEOUT', 'CONNECTION_CLOSED', 'CONNECTION_ENDED', '53300', '57P03', 'ERR_TLS_CERT_ALTNAME_INVALID'])('identifies %s beneath a query wrapper', code => {
    const result = databaseDiagnostics({ message: 'SQL contains confidential parameters', cause: { code, message: 'do not print credentials' } });
    expect(result.databaseCode).toBe(code); expect(result.databaseHint).toBeTruthy();
    expect(JSON.stringify(result)).not.toMatch(/confidential|do not print credentials/);
  });
  it('does not disclose unknown error messages or loop on cyclic causes', () => {
    const error: { code: string; message: string; cause?: unknown } = { code: 'SECRET_VALUE', message: 'postgres://private-password' }; error.cause = error;
    expect(databaseDiagnostics(error)).toEqual({}); expect(databaseDiagnostics(null)).toEqual({});
  });
});
