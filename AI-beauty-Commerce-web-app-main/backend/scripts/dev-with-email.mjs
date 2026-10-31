import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
const root = fileURLToPath(new URL('../', import.meta.url));
for (const file of ['.env.development.local', '.env.local', '.env.development', '.env']) config({ path: path.join(root, file), quiet: true });
if (process.env.NODE_ENV === 'production') throw new Error('Use the dedicated production auth-email worker service.');
mkdirSync(path.join(root, '.local'), { recursive: true });
const cutoffFile = path.join(root, '.local/auth-email-created-after');
if (!existsSync(cutoffFile)) writeFileSync(cutoffFile, new Date().toISOString(), { flag: 'wx' });
const cutoff = readFileSync(cutoffFile, 'utf8').trim();
if (!Number.isFinite(Date.parse(cutoff))) throw new Error('Invalid local auth-email cutoff; preserve the file and inspect its configuration.');
let stopping = false, worker, timer, attempts = 0;
function startWorker() {
  worker = spawn(process.execPath, ['--import', 'tsx', 'scripts/auth-email-worker.ts', '--new-only'], { cwd: root, windowsHide: true, stdio: 'inherit', env: { ...process.env, AUTH_EMAIL_CREATED_AFTER: cutoff } });
  const started = Date.now(); let handled = false;
  const retry = () => {
    if (handled || stopping) return; handled = true;
    attempts = Date.now() - started > 60000 ? 1 : attempts + 1;
    const delay = Math.min(30000, 1000 * 2 ** Math.min(attempts - 1, 5));
    console.error(JSON.stringify({ scope: 'auth-email-supervisor', status: 'restarting', delayMs: delay }));
    timer = setTimeout(startWorker, delay);
  };
  worker.on('error', retry); worker.on('exit', retry);
}
let web;
function shutdown(code = 0) {
  if (stopping) return; stopping = true; clearTimeout(timer); process.exitCode = code;
  worker?.kill('SIGTERM'); web?.kill('SIGTERM');
  const deadline = setTimeout(() => process.exit(code), 5000); deadline.unref();
}
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => shutdown());
if (!process.argv.includes('--email-only')) {
  web = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '-p', '3005', '--hostname', '127.0.0.1'], { cwd: root, stdio: 'inherit', windowsHide: true });
  web.on('error', () => shutdown(1)); web.on('exit', code => shutdown(code ?? 1));
}
startWorker();
