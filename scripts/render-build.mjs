import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const candidates = [new URL('../AI-beauty-Commerce-web-app-main/backend/', import.meta.url), new URL('../backend/', import.meta.url)];
const root = candidates.map(url => fileURLToPath(url)).find(dir => existsSync(dir + 'scripts/render-build.mjs'));
if (!root) throw new Error('Backend Render build script was not found in this checkout.');
console.log('[render-build] Delegating to the validated backend pipeline.');
if (!process.argv.includes('--check-path')) {
  const result = spawnSync(process.execPath, ['scripts/render-build.mjs'], { cwd: root, stdio: 'inherit', windowsHide: true });
  if (result.error || result.status !== 0) process.exit(result.status || 1);
}
