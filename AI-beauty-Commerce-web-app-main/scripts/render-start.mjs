import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../backend/', import.meta.url));
if (!existsSync(root + 'scripts/render-start.mjs')) throw new Error('Backend Render startup script was not found in this checkout.');
console.log('[render-start] Delegating to the validated backend startup checks.');
if (!process.argv.includes('--check-path')) {
  const child = spawn(process.execPath, ['scripts/render-start.mjs'], { cwd: root, stdio: 'inherit', windowsHide: true });
  for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => child.kill(signal));
  child.on('error', () => { process.exitCode = 1; });
  child.on('exit', code => { process.exitCode = code ?? 1; });
}
