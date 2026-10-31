import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const candidates = [new URL('../AI-beauty-Commerce-web-app-main/backend/', import.meta.url), new URL('../backend/', import.meta.url)];
const root = candidates.map(url => fileURLToPath(url)).find(dir => existsSync(dir + 'scripts/render-start.mjs'));
if (!root) throw new Error('Backend Render startup script was not found in this checkout.');
console.log('[render-start] Delegating to the validated backend startup checks.');
if (!process.argv.includes('--check-path')) {
  const child = spawn(process.execPath, ['scripts/render-start.mjs'], { cwd: root, stdio: 'inherit', windowsHide: true });
  for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => child.kill(signal));
  child.on('error', () => { process.exitCode = 1; });
  child.on('exit', code => { process.exitCode = code ?? 1; });
}
