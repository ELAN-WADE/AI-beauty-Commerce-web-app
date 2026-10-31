import '../src/lib/load-env';
import { assertProductionEnv } from '../src/lib/env';
import { googleConfigurationStatus } from '../src/modules/auth/redirects';
import { databasePoolOptions } from '../src/lib/database-options';
try {
  assertProductionEnv();
  console.log('Backend environment validation passed.');
  const google = googleConfigurationStatus();
  console.log(JSON.stringify({ scope: 'google-oauth', status: google.configured ? 'configured' : 'not_configured', settings: google.settings, callback: google.callback }));
  const web = databasePoolOptions();
  const worker = databasePoolOptions({ ...process.env, DATABASE_POOL_MAX: process.env.AUTH_EMAIL_DATABASE_POOL_MAX || '2' });
  console.log(JSON.stringify({ scope: 'database-pool', webMax: web.max, authWorkerMax: worker.max, connectTimeoutSeconds: web.connect_timeout }));
}
catch (error) { console.error(error instanceof Error ? error.message : 'Backend configuration is incomplete.'); process.exitCode = 1; }
