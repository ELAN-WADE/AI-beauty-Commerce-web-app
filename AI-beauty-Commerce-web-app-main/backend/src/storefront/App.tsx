import React from 'react';
import { isPortalDesignPreview } from './lib/portal-preview';
import { useViewport } from './context/ViewportContext';
import { StorefrontOverlays } from './components/common/StorefrontOverlays';
import { CartStatusBanner } from './components/common/CartStatusBanner';
import { useApp } from './context/AppContext';
import { DesktopNav } from './components/common/DesktopNav';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { AIFloatingButton } from './components/common/AIFloatingButton';
import { OfflineStatusBanner } from './components/common/OfflineStatusBanner';

// Screens — grouped by feature (see src/screens/README.md)
const Screen01Splash = React.lazy(() => import('./screens/catalog/Screen01Splash').then(module => ({ default: module.Screen01Splash })));
const Screen03Home = React.lazy(() => import('./screens/catalog/Screen03Home').then(module => ({ default: module.Screen03Home })));
const Screen04Search = React.lazy(() => import('./screens/catalog/Screen04Search').then(module => ({ default: module.Screen04Search })));
const Screen05Categories = React.lazy(() => import('./screens/catalog/Screen05Categories').then(module => ({ default: module.Screen05Categories })));
const Screen06Catalogue = React.lazy(() => import('./screens/catalog/Screen06Catalogue').then(module => ({ default: module.Screen06Catalogue })));
const Screen07ProductDetails = React.lazy(() => import('./screens/catalog/Screen07ProductDetails').then(module => ({ default: module.Screen07ProductDetails })));
const Screen09Cart = React.lazy(() => import('./screens/checkout/Screen09Cart').then(module => ({ default: module.Screen09Cart })));
const Screen10Checkout = React.lazy(() => import('./screens/checkout/Screen10Checkout').then(module => ({ default: module.Screen10Checkout })));
const Screen11Payment = React.lazy(() => import('./screens/checkout/Screen11Payment').then(module => ({ default: module.Screen11Payment })));
const Screen12OrderConfirmed = React.lazy(() => import('./screens/checkout/Screen12OrderConfirmed').then(module => ({ default: module.Screen12OrderConfirmed })));
const Screen13OrdersTracking = React.lazy(() => import('./screens/orders/Screen13OrdersTracking').then(module => ({ default: module.Screen13OrdersTracking })));
const Screen14AISkinScan = React.lazy(() => import('./screens/ai/Screen14AISkinScan').then(module => ({ default: module.Screen14AISkinScan })));
const ScreenAskAI = React.lazy(() => import('./screens/ai/ScreenAskAI').then(module => ({ default: module.ScreenAskAI })));
const Screen16Rewards = React.lazy(() => import('./screens/account/Screen16Rewards').then(module => ({ default: module.Screen16Rewards })));
const Screen17Account = React.lazy(() => import('./screens/account/Screen17Account').then(module => ({ default: module.Screen17Account })));
const Screen18DesktopHome = React.lazy(() => import('./screens/catalog/Screen18DesktopHome').then(module => ({ default: module.Screen18DesktopHome })));
const ScreenCommunityChat = React.lazy(() => import('./screens/community/ScreenCommunityChat').then(module => ({ default: module.ScreenCommunityChat })));
const ScreenDistributors = React.lazy(() => import('./screens/partners/ScreenDistributors').then(module => ({ default: module.ScreenDistributors })));
const ScreenDistributorPortal = React.lazy(() => import('./screens/partners/ScreenDistributorPortal').then(module => ({ default: module.ScreenDistributorPortal })));
const ScreenCreators = React.lazy(() => import('./screens/partners/ScreenCreators').then(module => ({ default: module.ScreenCreators })));
const ScreenAdminConsole = React.lazy(() => import('./screens/admin/ScreenAdminConsole').then(module => ({ default: module.ScreenAdminConsole })));
const ScreenAuthSuite = React.lazy(() => import('./screens/account/ScreenAuthSuite').then(module => ({ default: module.ScreenAuthSuite })));
const ScreenGuestOrderLookup = React.lazy(() => import('./screens/orders/ScreenGuestOrderLookup').then(module => ({ default: module.ScreenGuestOrderLookup })));
import { RequireRole } from './components/auth/RequireRole';

export const App: React.FC = () => {
  const { isDesktop } = useViewport();
  const {
    currentScreen,
    isLiveBackend,
    livePayment,
    dismissLivePayment,
    navigateTo,
    loginAsDemoRole,
    quickModalProduct,
    closeQuickModal,
    authUser
  } = useApp();

  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <Screen01Splash />;
      case 'onboarding':
      case 'home':
        return isDesktop ? <Screen18DesktopHome /> : <Screen03Home />;
      case 'search':
        return <Screen04Search />;
      case 'categories':
        return <Screen05Categories />;
      case 'catalogue':
        return <Screen06Catalogue />;
      case 'product-details':
        return <Screen07ProductDetails />;
      case 'cart':
        return <Screen09Cart />;
      case 'checkout':
        return <Screen10Checkout />;
      case 'payment':
        return <Screen11Payment />;
      case 'order-confirmed':
        return <Screen12OrderConfirmed />;
      case 'orders':
        return <Screen13OrdersTracking />;
      case 'ai-scan':
        return <Screen14AISkinScan />;
      case 'ask-ai':
        return <ScreenAskAI />;
      case 'rewards':
        return <Screen16Rewards />;
      case 'account':
        return <Screen17Account />;
      case 'desktop-home':
        return <Screen18DesktopHome />;
      case 'community':
        return <ScreenCommunityChat />;
      case 'distributors':
        return <ScreenDistributors />;
      case 'distributor-portal':
        return (
          <RequireRole
            allowedRoles={['DISTRIBUTOR']}
            title="Distributor City Hub"
            description="Manage your regional city hub inventory, customer order pickups, and restock requests."
          >
            <ScreenDistributorPortal />
          </RequireRole>
        );
      case 'creators':
        return (
          <RequireRole
            allowedRoles={['CREATOR']}
            title="Creator Affiliate Studio"
            description="Access your VIP commission ledger, promo code performance, and seasonal PR box dispatch tracking."
          >
            <ScreenCreators />
          </RequireRole>
        );
      case 'admin-console':
        // Auth check suspended for instant staff / developer inspection
        return <ScreenAdminConsole />;
      case 'login':
        return <ScreenAuthSuite initialMode="login" />;
      case 'signup':
        return <ScreenAuthSuite initialMode="signup" />;
      case 'forgot-password':
        return <ScreenAuthSuite initialMode="forgot-password" />;
      case 'reset-password':
        return <ScreenAuthSuite initialMode="reset-password" />;
      case 'verify-email':
        return <ScreenAuthSuite initialMode="verify-email" />;
      case 'guest-order-lookup':
        return <ScreenGuestOrderLookup />;
      case 'creator-dashboard':
        return (
          <RequireRole
            allowedRoles={['CREATOR']}
            title="Creator Affiliate Studio"
          >
            <ScreenCreators />
          </RequireRole>
        );
      case 'distributor-dashboard':
        return (
          <RequireRole
            allowedRoles={['DISTRIBUTOR']}
            title="Distributor City Hub"
          >
            <ScreenDistributorPortal />
          </RequireRole>
        );
      default:
        return isDesktop ? <Screen18DesktopHome /> : <Screen03Home />;
    }
  };

  const isImmersiveScreen = [
    'splash',
    'ask-ai',
    'admin-console',
    'login',
    'signup',
    'forgot-password',
    'reset-password',
    'verify-email',
    'guest-order-lookup'
  ].includes(currentScreen);
  // Admin console and Partner Workspaces are separate operational surfaces (own shells, own chrome).
  const isAdminScreen = currentScreen === 'admin-console';
  const isPartnerWorkspace = ['creators', 'creator-dashboard', 'distributor-portal', 'distributor-dashboard'].includes(currentScreen);
  const showBottomNav =
    !isDesktop &&
    !isPartnerWorkspace &&
    ![
      'splash',
      'checkout',
      'payment',
      'order-confirmed',
      'desktop-home',
      'ask-ai',
      'admin-console',
      'login',
      'signup',
      'forgot-password',
      'reset-password',
      'verify-email',
      'guest-order-lookup'
    ].includes(currentScreen);

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0F0F10] relative font-body flex flex-col selection:bg-[#D4AF37]/20 selection:text-[#997A2E] overflow-x-clip">
      {/* Offline Status Awareness & Reconnection Toast */}
      <OfflineStatusBanner />
      {!isAdminScreen && !isPartnerWorkspace && <CartStatusBanner />}

      {/* Global Desktop Navigation Bar on Desktop Screens (storefront only) */}
      {isDesktop && !isImmersiveScreen && !isAdminScreen && !isPartnerWorkspace && <DesktopNav />}

      {/* Global Persistent Mobile Header on Mobile Screens (storefront only) */}
      {!isDesktop && !isImmersiveScreen && !isAdminScreen && !isPartnerWorkspace && <Header />}

      {/* Main Responsive Storefront Viewport */}
      <main className="flex-1 w-full relative">
        <React.Suspense fallback={<div role="status" className="min-h-[50vh] flex items-center justify-center text-sm">Loading workspace…</div>}>{renderActiveScreen()}</React.Suspense>
      </main>

      {/* Mobile Edge-to-Edge Sticky Bottom Navigation (storefront only) */}
      {showBottomNav && <BottomNav />}

      {/* Persistent Global Floating AI Assistant Concierge Button (storefront only) */}
      {!isAdminScreen && !isPartnerWorkspace && <AIFloatingButton />}



      {/* Global Sheets, Drawers & Modals (storefront only) */}
      {!isAdminScreen && !isPartnerWorkspace && (
        <StorefrontOverlays />
      )}

      {/* Live payment return states (owned backend only; demo flow untouched) */}
      {isLiveBackend && (livePayment.status === 'verifying' || livePayment.status === 'redirecting') && (
        <div className="fixed inset-0 z-[100] bg-white/95 backdrop-blur flex flex-col items-center justify-center gap-4 px-8 text-center">
          <div className="w-10 h-10 rounded-full border-2 border-[#E5E7EB] border-t-[#D4AF37] animate-spin" aria-label="Loading" />
          <p className="text-sm font-semibold text-[#0F0F10]">{livePayment.message || 'Confirming…'}</p>
          <p className="text-xs text-[#6B7280]">Do not close this page.</p>
        </div>
      )}
      {isLiveBackend && livePayment.status === 'error' && (
        <div className="fixed inset-x-4 bottom-24 z-[100] rounded-2xl bg-[#0F0F10] text-white p-4 shadow-float flex items-start gap-3">
          <p className="flex-1 text-xs leading-relaxed">{livePayment.message}</p>
          <button
            onClick={dismissLivePayment}
            className="shrink-0 px-4 py-2 rounded-full bg-[#D4AF37] text-[#0F0F10] text-xs font-bold active:scale-95 transition-all"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};
