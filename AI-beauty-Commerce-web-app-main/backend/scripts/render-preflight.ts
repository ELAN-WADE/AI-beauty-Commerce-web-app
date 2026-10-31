import '../src/lib/load-env';
import { assertProductionEnv } from '../src/lib/env';
import { googleConfigurationStatus } from '../src/modules/auth/redirects';
try {
  assertProductionEnv();
  console.log('Backend environment validation passed.');
  const google = googleConfigurationStatus();
  console.log(JSON.stringify({ scope: 'google-oauth', status: google.configured ? 'configured' : 'not_configured', settings: google.settings }));
}
catch (error) { console.error(error instanceof Error ? error.message : 'Backend configuration is incomplete.'); process.exitCode = 1; }
