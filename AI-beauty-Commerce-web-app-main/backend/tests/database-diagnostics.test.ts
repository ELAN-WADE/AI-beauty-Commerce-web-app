import { describe, expect, it } from 'vitest';
import { databaseDiagnostics } from '@/lib/database-diagnostics';
describe('safe nested database diagnostics', () => {
  it.each(['42P01', '42703', '28P01', '3D000', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET'])('identifies %s beneath a query wrapper', code => {
    const result = databaseDiagnostics({ message: 'SQL contains confidential parameters', cause: { code, message: 'do not print credentials' } });
    expect(result.databaseCode).toBe(code); expect(result.databaseHint).toBeTruthy();
    expect(JSON.stringify(result)).not.toMatch(/confidential|do not print credentials/);
  });
  it('does not disclose unknown error messages or loop on cyclic causes', () => {
    const error: { code: string; message: string; cause?: unknown } = { code: 'SECRET_VALUE', message: 'postgres://private-password' }; error.cause = error;
    expect(databaseDiagnostics(error)).toEqual({}); expect(databaseDiagnostics(null)).toEqual({});
  });
});
