// Server/Edge only. Never put these settings in NEXT_PUBLIC_* or client imports.
export const STAFF_ROLES = ['ADMIN', 'STAFF', 'SUPER_ADMIN', 'INVENTORY_MANAGER', 'SUPPORT'];
export const hasStaffRole = (roles: string[]) => roles.some(role => STAFF_ROLES.includes(role));
export const adminEmail = () => (process.env.ADMIN_GOOGLE_EMAIL || 'deslaadmin@gmail.com').trim().toLowerCase();
export function adminEntryPath(): string | null {
  const path = process.env.ADMIN_ENTRY_PATH?.trim();
  return path && /^\/ops-[a-z0-9-]{16,80}$/.test(path) ? path : null;
}
export function adminPageDecision(pathname: string, screen: string | null) {
  if (pathname.startsWith('/api/')) return 'pass';
  const entry = adminEntryPath();
  if (entry && pathname === entry) return 'private';
  if (/^\/(?:admin|admin-console)(?:\/|$)/.test(pathname) || screen === 'admin-console') return 'deny';
  return 'pass';
}
