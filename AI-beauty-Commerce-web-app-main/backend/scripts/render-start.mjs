import { spawn, spawnSync } from 'node:child_process';
const check = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/render-preflight.ts'], { stdio: 'inherit', windowsHide: true });
if (check.error || check.status !== 0) process.exit(check.status || 1);
// Never mark a web process healthy against an empty or outdated database.
const database = spawnSync(process.execPath, ['scripts/check-postgres.mjs'], { stdio: 'inherit', windowsHide: true });
if (database.error || database.status !== 0) process.exit(database.status || 1);
// Render Free has no pre-deploy phase. Provision/recover only the configured admin.
const admin = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/bootstrap-dev-admin.ts'], { stdio: 'inherit', windowsHide: true });
if (admin.error || admin.status !== 0) process.exit(admin.status || 1);
const port = process.env.PORT || '3005';
if (!/^\d+$/.test(port)) throw new Error('PORT must be numeric.');
const emailMode = process.env.AUTH_EMAIL_WORKER_MODE || 'external';
if (!['embedded', 'external'].includes(emailMode)) throw new Error('AUTH_EMAIL_WORKER_MODE must be embedded or external.');
console.log(JSON.stringify({ scope: 'auth-email-supervisor', mode: emailMode }));
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', port, '--hostname', '0.0.0.0'], {
  stdio: 'inherit', windowsHide: true,
  env: {
    ...process.env,
    // Bound simultaneous native image jobs; a first visit otherwise starts
    // several encoders alongside the web server on the same 512 MB instance.
    UV_THREADPOOL_SIZE: process.env.UV_THREADPOOL_SIZE || '1',
    MALLOC_ARENA_MAX: process.env.MALLOC_ARENA_MAX || '2',
    DESLA_EMBEDDED_AUTH_EMAIL: emailMode === 'embedded' ? '1' : '0',
  },
});
const startedAt = Date.now();
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => {
  console.log(JSON.stringify({ scope: 'web-supervisor', event: 'shutdown_requested', signal }));
  child.kill(signal);
});
child.on('error', error => {
  console.error(JSON.stringify({ scope: 'web-supervisor', event: 'launch_failed', code: error.code || 'UNKNOWN' }));
  process.exitCode = 1;
});
child.on('exit', (code, signal) => {
  console.log(JSON.stringify({ scope: 'web-supervisor', event: 'web_exit', code, signal, uptimeSeconds: Math.round((Date.now() - startedAt) / 1000) }));
  process.exitCode = code ?? 1;
});
