import { spawn } from 'node:child_process';

/** Optional account-email dispatcher in the existing web service, no extra service. */
export function superviseAccountEmail(root) {
  let worker, timer, stopping = false, attempts = 0;
  function start() {
    if (stopping) return;
    worker = spawn(process.execPath, ['--import', 'tsx', 'scripts/auth-email-worker.ts'], { cwd: root, stdio: 'inherit', windowsHide: true,
      env: { ...process.env, DATABASE_POOL_MAX: process.env.AUTH_EMAIL_DATABASE_POOL_MAX || '2' } });
    const started = Date.now();
    let handled = false;
    function retry(code = null, signal = null) {
      if (handled || stopping) return;
      handled = true;
      attempts = Date.now() - started > 60000 ? 1 : attempts + 1;
      const delay = Math.min(30000, 1000 * 2 ** Math.min(attempts - 1, 5));
      console.error(JSON.stringify({ scope: 'auth-email-supervisor', status: 'restarting', delayMs: delay, code: typeof code === 'number' ? code : null, signal, uptimeSeconds: Math.round((Date.now() - started) / 1000) }));
      timer = setTimeout(start, delay);
    }
    worker.on('error', retry);
    worker.on('exit', retry);
  }
  start();
  return () => {
    if (stopping) return;
    stopping = true;
    clearTimeout(timer);
    const current = worker;
    if (current && current.exitCode === null) {
      current.kill('SIGTERM');
      const deadline = setTimeout(() => { if (current.exitCode === null) current.kill('SIGKILL'); }, 10000);
      deadline.unref();
      current.once('exit', () => clearTimeout(deadline));
    }
  };
}
