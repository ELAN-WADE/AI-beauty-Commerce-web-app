import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

let targetDir = process.cwd();
if (existsSync(path.join(targetDir, 'backend'))) {
  targetDir = path.join(targetDir, 'backend');
} else if (existsSync(path.join(targetDir, 'AI-beauty-Commerce-web-app-main', 'backend'))) {
  targetDir = path.join(targetDir, 'AI-beauty-Commerce-web-app-main', 'backend');
}

console.log(`[render-start] Launching server from: ${targetDir}`);

const port = process.env.PORT || '3005';
const child = spawn('node', ['scripts/start.mjs'], {
  cwd: targetDir,
  stdio: 'inherit',
  env: { ...process.env, PORT: port },
});

process.on('SIGTERM', () => {
  if (child && !child.killed) child.kill('SIGTERM');
});
process.on('SIGINT', () => {
  if (child && !child.killed) child.kill('SIGINT');
});

child.on('exit', (code, signal) => {
  if (code !== null) process.exit(code);
  if (signal) process.kill(process.pid, signal);
});
