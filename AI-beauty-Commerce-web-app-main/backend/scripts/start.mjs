import { spawn } from 'node:child_process';

const port = process.env.PORT || '3005';
const isWin = process.platform === 'win32';
const nextCmd = isWin ? 'npx.cmd' : 'npx';

console.log(`[start] Starting Next.js server on port ${port}...`);

const child = spawn(nextCmd, ['next', 'start', '-p', port], {
  stdio: 'inherit',
  shell: isWin,
  env: {
    ...process.env,
    DESLA_EMBEDDED_COMMISSIONS: '1',
    PORT: port,
  },
});

function forwardSignal(signal) {
  if (child && !child.killed) {
    child.kill(signal);
  }
}

process.on('SIGTERM', () => forwardSignal('SIGTERM'));
process.on('SIGINT', () => forwardSignal('SIGINT'));

child.on('exit', (code, signal) => {
  if (code !== null) {
    process.exit(code);
  } else if (signal) {
    process.kill(process.pid, signal);
  }
});

