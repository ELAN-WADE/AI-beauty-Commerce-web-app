export type DesignPreviewPortal = 'CREATOR' | 'DISTRIBUTOR' | 'ADMIN';

/** Local presentation preview only; never a session or a server permission. */
export function isPortalDesignPreview(): boolean {
  return process.env.NODE_ENV === 'development' && typeof window !== 'undefined'
    && ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)
    && new URLSearchParams(window.location.search).get('preview') === 'design';
}

export function getDesignPreviewPortal(): DesignPreviewPortal | null {
  if (!isPortalDesignPreview()) return null;
  const screen = new URLSearchParams(window.location.search).get('screen');
  if (screen) {
    if (['creators', 'creator-dashboard'].includes(screen)) return 'CREATOR';
    if (['distributor-portal', 'distributor-dashboard'].includes(screen)) return 'DISTRIBUTOR';
    return screen === 'admin-console' ? 'ADMIN' : null;
  }
  return window.location.pathname === '/creators' ? 'CREATOR'
    : window.location.pathname === '/distributor' ? 'DISTRIBUTOR'
    : window.location.pathname === '/admin' ? 'ADMIN' : null;
}
