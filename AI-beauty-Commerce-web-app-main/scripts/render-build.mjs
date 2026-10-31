import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../backend/', import.meta.url));
if (!existsSync(root + 'scripts/render-build.mjs')) throw new Error('Backend Render build script was not found in this checkout.');
console.log('[render-build] Delegating to the validated backend pipeline.');
if (!process.argv.includes('--check-path')) {
  const result = spawnSync(process.execPath, ['scripts/render-build.mjs'], { cwd: root, stdio: 'inherit', windowsHide: true });
  if (result.error || result.status !== 0) process.exit(result.status || 1);
}

