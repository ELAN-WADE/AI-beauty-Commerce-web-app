/** Report only recognized database/network codes, never SQL, parameters or credentials. */
export function databaseDiagnostics(error) {
  const hints = {
    '42P01': 'Database table missing. Apply the committed migrations to this DATABASE_URL.',
    '42703': 'Database column missing. Apply the committed migrations to this DATABASE_URL.',
    '28P01': 'Database authentication failed. Check DATABASE_URL credentials.',
    '28000': 'Database access rejected. Check database credentials and access policy.',
    '3D000': 'Configured database does not exist. Check DATABASE_URL.',
    ECONNREFUSED: 'Database host/port refused the connection.',
    ENOTFOUND: 'Database hostname could not be resolved.',
    EAI_AGAIN: 'Database hostname lookup temporarily failed.',
    ETIMEDOUT: 'Database connection timed out. Check region, network and access rules.',
    CONNECT_TIMEOUT: 'Database connection timed out. Check region, network and access rules.',
    CONNECTION_CLOSED: 'Database connection closed before the query completed. Check database availability.',
    CONNECTION_ENDED: 'Database client has already shut down.',
    '53300': 'Database connection limit reached. Check pool sizes and database capacity.',
    '57P03': 'Database is not accepting connections. Check its availability.',
    ECONNRESET: 'Database connection was reset. Check database availability and TLS settings.',
    DEPTH_ZERO_SELF_SIGNED_CERT: 'Database TLS certificate validation failed. Check DATABASE_SSL_MODE for this provider.',
    CERT_HAS_EXPIRED: 'Database TLS certificate expired.',
    SELF_SIGNED_CERT_IN_CHAIN: 'Database TLS certificate chain was rejected.',
    ERR_TLS_CERT_ALTNAME_INVALID: 'Database TLS hostname verification failed. Check the configured database hostname.',
  };
  let current = error;
  const seen = new Set();
  for (let depth = 0; depth < 8 && current && typeof current === 'object' && !seen.has(current); depth++) {
    seen.add(current);
    const code = typeof current.code === 'string' ? current.code : '';
    if (Object.hasOwn(hints, code)) return { databaseCode: code, databaseHint: hints[code] };
    current = current.cause;
  }
  return {};
}
