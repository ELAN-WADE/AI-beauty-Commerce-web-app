import '../src/lib/load-env';
import { assertProductionEnv } from '../src/lib/env';
try { assertProductionEnv(); console.log('Backend environment validation passed.'); }
catch (error) { console.error(error instanceof Error ? error.message : 'Backend configuration is incomplete.'); process.exitCode = 1; }
