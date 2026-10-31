/** Shared by API handlers and edge middleware; contains no Node-only imports. */
export function isDevLoopbackOrigin(origin: string): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  try {
    const url = new URL(origin);
    return ['http:', 'https:'].includes(url.protocol) &&
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && url.origin === origin;
  } catch { return false; }
}

export function isAllowedApiOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (isDevLoopbackOrigin(origin)) return true;
  const configured = [
    process.env.APP_URL,
    process.env.FRONTEND_URL,
    process.env.RENDER_EXTERNAL_URL,
    ...(process.env.ALLOWED_ORIGINS ?? '').split(','),
  ];
  return configured.some(value => {
    try { return Boolean(value?.trim()) && new URL(value!.trim()).origin === origin; }
    catch { return false; }
  });
}
