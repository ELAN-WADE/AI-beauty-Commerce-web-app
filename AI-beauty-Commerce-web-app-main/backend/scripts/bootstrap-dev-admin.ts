import '../src/lib/load-env';
import { closeDb, getDb } from '../src/db/client';
import { databaseDiagnostics } from '../src/lib/database-diagnostics';
import { bootstrapAdmin, configuredAdminBootstrap } from '../src/modules/auth/bootstrap';

async function main() {
  const config = configuredAdminBootstrap();
  if (!config) {
    console.log('[admin:bootstrap] skipped: no ADMIN_BOOTSTRAP_EMAIL/PASSWORD configured.');
    return;
  }
  const result = await bootstrapAdmin(getDb(), config);
  console.log(JSON.stringify({ scope: 'admin-bootstrap', status: 'ready', ...result }));
  if (result.passwordPreserved) console.log('[admin:bootstrap] Existing password preserved. Explicit recovery requires ADMIN_BOOTSTRAP_SYNC_PASSWORD=true.');
}

main().catch(error => {
  const diagnostic = databaseDiagnostics(error);
  console.error(JSON.stringify({ scope: 'admin-bootstrap', status: 'failed', ...(diagnostic.databaseCode ? diagnostic : { message: error instanceof Error && !error.cause ? error.message : 'Administrator bootstrap failed.' }) }));
  process.exitCode = 1;
}).finally(closeDb);
