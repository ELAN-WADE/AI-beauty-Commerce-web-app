export function portalForScreen(screen: string): 'CREATOR' | 'DISTRIBUTOR' | 'ADMIN' | null {
  if (['creators', 'creator-dashboard'].includes(screen)) return 'CREATOR';
  if (['distributor-portal', 'distributor-dashboard'].includes(screen)) return 'DISTRIBUTOR';
  return screen === 'admin-console' ? 'ADMIN' : null;
}

const creatorRoutes = ['overview', 'create', 'content', 'campaigns', 'pr-room', 'storefront', 'links', 'earnings', 'notifications', 'resources', 'support', 'settings'];
const distributorRoutes = ['overview', 'orders', 'inventory', 'restock', 'sales', 'earnings', 'territory', 'reports', 'support', 'settings'];

export function partnerRoute(kind: 'CREATOR' | 'DISTRIBUTOR', value: string | null): string {
  return value && (kind === 'CREATOR' ? creatorRoutes : distributorRoutes).includes(value) ? value : 'overview';
}
