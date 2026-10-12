/**
 * ScreenId -> Next.js URL map (Phase 1 lift-and-shift).
 * Zero UI change: every Vite `currentScreen` gets a real URL that renders
 * the SAME Screen* component. `navigateTo(screen)` becomes `router.push(path)`.
 *
 * Source of truth for chrome rules: `storefront/App.tsx`
 * (isImmersiveScreen / isAdminScreen / isPartnerWorkspace / showBottomNav).
 */
import type { ScreenId } from '@/storefront/types';

export const SCREEN_PATHS: Record<ScreenId, string> = {
  splash: '/splash',
  onboarding: '/welcome',
  home: '/',
  search: '/search',
  categories: '/categories',
  catalogue: '/catalogue',
  'product-details': '/products',
  cart: '/cart',
  checkout: '/checkout',
  payment: '/checkout/payment',
  'order-confirmed': '/order-confirmed',
  orders: '/orders',
  'ai-scan': '/ai-skin-scan',
  'ask-ai': '/ask-ai',
  rewards: '/rewards',
  account: '/account',
  'desktop-home': '/',
  community: '/community',
  distributors: '/distributors',
  'distributor-portal': '/distributor',
  creators: '/creators',
  'admin-console': '/admin',
  login: '/login',
  signup: '/signup',
  'forgot-password': '/forgot-password',
  'reset-password': '/reset-password',
  'verify-email': '/verify-email',
  'guest-order-lookup': '/guest-order-lookup',
  'creator-dashboard': '/creators',
  'distributor-dashboard': '/distributor',
};

export function productPath(slug: string): string {
  return `/products/${encodeURIComponent(slug.toLowerCase())}`;
}

/** Reverse lookup for legacy `navigateTo` shims / logging. */
export function screenForPath(pathname: string): ScreenId | null {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/products/')) return 'product-details';
  if (pathname.startsWith('/orders/')) return 'orders';
  const entry = (Object.entries(SCREEN_PATHS) as [ScreenId, string][]).find(
    ([, p]) => p === pathname,
  );
  return entry ? entry[0] : null;
}

// --- Chrome rules (ported verbatim from storefront/App.tsx) ---

const IMMERSIVE_PATHS = new Set([
  '/splash',
  '/ask-ai',
  '/admin',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/guest-order-lookup',
]);

const PARTNER_PREFIXES = ['/distributor', '/creators'];
const ADMIN_PREFIXES = ['/admin'];

/** No storefront DesktopNav/Header on immersive, admin, or partner workspaces. */
export function shouldShowStorefrontNav(pathname: string): boolean {
  if (IMMERSIVE_PATHS.has(pathname)) return false;
  if (ADMIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return false;
  if (PARTNER_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return false;
  return true;
}

const NO_BOTTOM_NAV = new Set([
  '/splash',
  '/checkout',
  '/checkout/payment',
  '/order-confirmed',
  '/ask-ai',
  '/admin',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/guest-order-lookup',
]);

/** Port of App.tsx `showBottomNav` (mobile only; desktop never shows it). */
export function shouldShowBottomNav(pathname: string, isDesktop: boolean): boolean {
  if (isDesktop) return false;
  if (ADMIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return false;
  if (PARTNER_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return false;
  if ([...NO_BOTTOM_NAV].some(p => pathname === p || pathname.startsWith(`${p}/`))) return false;
  return true;
}

/** Global sheets/drawers/AI button render on storefront only (never admin/partner). */
export function shouldShowStorefrontOverlays(pathname: string): boolean {
  if (ADMIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return false;
  if (PARTNER_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return false;
  return true;
}
