/** One visible-tab connection, bounded retry backoff, and refresh after gaps. */
export function subscribeStorefrontSync(url: string, onSync: (slug?: string | null) => void): () => void {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') return () => {};
  let source: EventSource | null = null;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let active = true, connected = false, attempts = 0, openedAt = 0;

  const close = () => {
    clearTimeout(retry);
    retry = undefined;
    if (source) { source.onerror = null; source.close(); source = null; }
  };
  const available = () => active && !document.hidden && navigator.onLine !== false;
  const reconnect = () => {
    close();
    if (!available()) return;
    // Jitter prevents all open browsers from retrying together after a restart.
    const delay = Math.min(30000, 2000 * 2 ** Math.min(attempts++, 4));
    retry = setTimeout(connect, Math.min(30000, delay * (0.75 + Math.random() * 0.5)));
  };
  const connect = () => {
    close();
    if (!available()) return;
    try {
      const current = new EventSource(url);
      source = current;
      current.onopen = () => {
        if (source !== current || !active) return;
        openedAt = Date.now();
        // Updates may have happened while offline, backgrounded, or restarting.
        if (connected) onSync();
        connected = true;
      };
      current.addEventListener('sync', (event: MessageEvent) => {
        if (source !== current || !active) return;
        attempts = 0;
        let slug: string | null | undefined;
        try { slug = JSON.parse(event.data)?.slug; } catch { /* Refresh all public data. */ }
        onSync(slug);
      });
      current.onerror = () => {
        if (source !== current || !active) return;
        if (openedAt && Date.now() - openedAt > 30000) attempts = 0;
        openedAt = 0;
        reconnect();
      };
    } catch { reconnect(); }
  };
  const resume = () => { if (!available()) close(); else if (!source && !retry) connect(); };
  document.addEventListener('visibilitychange', resume);
  window.addEventListener('online', resume);
  window.addEventListener('offline', resume);
  connect();
  return () => {
    active = false;
    close();
    document.removeEventListener('visibilitychange', resume);
    window.removeEventListener('online', resume);
    window.removeEventListener('offline', resume);
  };
}
