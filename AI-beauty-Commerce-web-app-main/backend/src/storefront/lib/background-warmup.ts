/** Warm code/assets after first paint; one task at a time, without mounting hidden UIs. */
export function scheduleBackgroundWarmup(tasks: (() => Promise<unknown> | void)[]) {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '')) return () => {};
  let cancelled = false, index = 0, timer = 0;
  let idle: number | undefined;
  const next = () => {
    if (cancelled || index >= tasks.length) return;
    const run = async () => {
      if (cancelled) return;
      if (document.hidden) { timer = window.setTimeout(next, 1000); return; }
      try { await tasks[index++](); } catch { /* A normal navigation retries a failed preload. */ }
      next();
    };
    if ('requestIdleCallback' in window) idle = window.requestIdleCallback(() => { void run(); }, { timeout: 2000 });
    else timer = globalThis.setTimeout(() => { void run(); }, 500) as unknown as number;
  };
  // Give the first render and its initial media requests priority.
  timer = window.setTimeout(next, 1000);
  return () => { cancelled = true; window.clearTimeout(timer); if (idle !== undefined) window.cancelIdleCallback(idle); };
}
