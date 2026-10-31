import { spawnSync } from 'node:child_process';
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
// ISR reads saved catalogue data during build; the schema must exist first.
for (const args of [['ci', '--include=dev'], ['exec', '--', 'tsx', 'scripts/render-preflight.ts'], ['run', 'db:migrate'], ['run', 'db:seed'], ['exec', '--', 'next', 'typegen'], ['run', 'typecheck'], ['run', 'build']]) {
  const result = spawnSync(npm, args, { stdio: 'inherit', shell: process.platform === 'win32', windowsHide: true });
  if (result.error || result.status !== 0) process.exit(result.status || 1);
}
