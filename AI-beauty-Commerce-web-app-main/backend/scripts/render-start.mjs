import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { superviseAccountEmail } from './auth-email-supervisor.mjs';
const check = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/render-preflight.ts'], { stdio: 'inherit', windowsHide: true });
if (check.error || check.status !== 0) process.exit(check.status || 1);
// Never mark a web process healthy against an empty or outdated database.
const database = spawnSync(process.execPath, ['scripts/check-postgres.mjs'], { stdio: 'inherit', windowsHide: true });
if (database.error || database.status !== 0) process.exit(database.status || 1);
const port = process.env.PORT || '3005';
if (!/^\d+$/.test(port)) throw new Error('PORT must be numeric.');
const emailMode = process.env.AUTH_EMAIL_WORKER_MODE || 'external';
if (!['embedded', 'external'].includes(emailMode)) throw new Error('AUTH_EMAIL_WORKER_MODE must be embedded or external.');
const stopEmail = emailMode === 'embedded' ? superviseAccountEmail(fileURLToPath(new URL('../', import.meta.url))) : () => {};
console.log(JSON.stringify({ scope: 'auth-email-supervisor', mode: emailMode }));
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', port, '--hostname', '0.0.0.0'], { stdio: 'inherit', windowsHide: true });
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => { stopEmail(); child.kill(signal); });
child.on('error', () => { stopEmail(); process.exitCode = 1; });
child.on('exit', code => { stopEmail(); process.exitCode = code ?? 1; });
