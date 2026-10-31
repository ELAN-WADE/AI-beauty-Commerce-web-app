import { spawn, spawnSync } from 'node:child_process';
const check = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/render-preflight.ts'], { stdio: 'inherit', windowsHide: true });
if (check.error || check.status !== 0) process.exit(check.status || 1);
// Never mark a web process healthy against an empty or outdated database.
const database = spawnSync(process.execPath, ['scripts/check-postgres.mjs'], { stdio: 'inherit', windowsHide: true });
if (database.error || database.status !== 0) process.exit(database.status || 1);
const port = process.env.PORT || '3005';
if (!/^\d+$/.test(port)) throw new Error('PORT must be numeric.');
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', port, '--hostname', '0.0.0.0'], { stdio: 'inherit', windowsHide: true });
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => child.kill(signal));
child.on('error', () => { process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
