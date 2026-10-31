import { describe, expect, it } from 'vitest';
import postgres from 'postgres';
import { databaseSslOptions } from '@/lib/database-options';

describe('database TLS configuration used by runtime and startup', () => {
  const remote = 'postgres://test:password@dpg-example.oregon-postgres.render.com/app';
  it.each(['require', 'allow', 'prefer', 'verify-full'] as const)('applies an explicit %s mode to the driver', mode => {
    const client = postgres(remote, databaseSslOptions(remote, mode));
    expect(client.options.ssl).toBe(mode);
  });
  it('uses the same required TLS for a Render internal hostname', () => {
    const url = 'postgres://test:password@dpg-example-a/app';
    expect(postgres(url, databaseSslOptions(url, 'require')).options.ssl).toBe('require');
  });
  it('preserves certificate verification requested in a provider URL', () => {
    const url = `${remote}?sslmode=verify-full`;
    expect(postgres(url, databaseSslOptions(url, undefined)).options.ssl).toBe('verify-full');
  });
  it('uses TLS for the managed host without explicit settings', () => {
    expect(postgres(remote, databaseSslOptions(remote, undefined)).options.ssl).toBe('require');
    const aws = 'postgres://test:password@db.example.us-east-1.rds.amazonaws.com/app';
    expect(postgres(aws, databaseSslOptions(aws, undefined)).options.ssl).toBe('require');
  });
  it('does not interpret credential or path text as the database hostname', () => {
    const url = 'postgres://test:render.com@127.0.0.1/app';
    expect(postgres(url, databaseSslOptions(url, undefined)).options.ssl).toBe(false);
  });
  it('allows an explicit non-TLS local connection', () => {
    expect(postgres(remote, databaseSslOptions(remote, 'disable')).options.ssl).toBe(false);
  });
  it('rejects invalid settings without including the connection secret', () => {
    expect(() => databaseSslOptions(remote, 'incorrect')).toThrow('DATABASE_SSL_MODE');
    expect(() => databaseSslOptions('secret-invalid-url', undefined)).toThrow('DATABASE_URL must be a valid PostgreSQL connection URL.');
  });
});
