import React from 'react';
import { useViewport } from './context/ViewportContext';
import { useApp } from './context/AppContext';
import { DesktopNav } from './components/common/DesktopNav';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { AIFloatingButton } from './components/common/AIFloatingButton';
import { LocationSelector } from './components/common/LocationSelector';
import { AddToCartSheet } from './components/sheets/AddToCartSheet';
import { FilterSortSheet } from './components/sheets/FilterSortSheet';
import { AIAssistantDrawer } from './components/sheets/AIAssistantDrawer';
import { CommunityChatDrawer } from './components/community/CommunityChatDrawer';
import { InitialBrandLoader } from './components/common/InitialBrandLoader';
import { OfflineStatusBanner } from './components/common/OfflineStatusBanner';
import { ProductQuickModal } from './components/common/ProductQuickModal';

// Screens — grouped by feature (see src/screens/README.md)
import { Screen01Splash } from './screens/catalog/Screen01Splash';
import { Screen03Home } from './screens/catalog/Screen03Home';
import { Screen04Search } from './screens/catalog/Screen04Search';
import { Screen05Categories } from './screens/catalog/Screen05Categories';
import { Screen06Catalogue } from './screens/catalog/Screen06Catalogue';
import { Screen07ProductDetails } from './screens/catalog/Screen07ProductDetails';
import { Screen09Cart } from './screens/checkout/Screen09Cart';
import { Screen10Checkout } from './screens/checkout/Screen10Checkout';
import { Screen11Payment } from './screens/checkout/Screen11Payment';
import { Screen12OrderConfirmed } from './screens/checkout/Screen12OrderConfirmed';
import { Screen13OrdersTracking } from './screens/orders/Screen13OrdersTracking';
import { Screen14AISkinScan } from './screens/ai/Screen14AISkinScan';
import { ScreenAskAI } from './screens/ai/ScreenAskAI';
import { Screen16Rewards } from './screens/account/Screen16Rewards';
import { Screen17Account } from './screens/account/Screen17Account';
import { Screen18DesktopHome } from './screens/catalog/Screen18DesktopHome';
import { ScreenCommunityChat } from './screens/community/ScreenCommunityChat';
import { ScreenDistributors } from './screens/partners/ScreenDistributors';
import { ScreenDistributorPortal } from './screens/partners/ScreenDistributorPortal';
import { ScreenCreators } from './screens/partners/ScreenCreators';
import { ScreenAdminConsole } from './screens/admin/ScreenAdminConsole';
import { ScreenAuthSuite } from './screens/account/ScreenAuthSuite';
import { ScreenGuestOrderLookup } from './screens/orders/ScreenGuestOrderLookup';
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
    closeQuickModal
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
            allowedRoles={['DISTRIBUTOR', 'STAFF', 'ADMIN', 'SUPER_ADMIN']}
            title="Distributor City Hub"
            description="Manage your regional city hub inventory, customer order pickups, and restock requests."
          >
            <ScreenDistributorPortal />
          </RequireRole>
        );
      case 'creators':
        return (
          <RequireRole
            allowedRoles={['CREATOR', 'STAFF', 'ADMIN', 'SUPER_ADMIN']}
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
            allowedRoles={['CREATOR', 'STAFF', 'ADMIN', 'SUPER_ADMIN']}
            title="Creator Affiliate Studio"
          >
            <ScreenCreators />
          </RequireRole>
        );
      case 'distributor-dashboard':
        return (
          <RequireRole
            allowedRoles={['DISTRIBUTOR', 'STAFF', 'ADMIN', 'SUPER_ADMIN']}
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

      {/* Initial Luxury Brand Loading Experience (Desla! Logo reveal) */}
      <InitialBrandLoader />

      {/* Global Desktop Navigation Bar on Desktop Screens (storefront only) */}
      {isDesktop && !isImmersiveScreen && !isAdminScreen && !isPartnerWorkspace && <DesktopNav />}

      {/* Global Persistent Mobile Header on Mobile Screens (storefront only) */}
      {!isDesktop && !isImmersiveScreen && !isAdminScreen && !isPartnerWorkspace && <Header />}

      {/* Main Responsive Storefront Viewport */}
      <main className="flex-1 w-full relative">
        {renderActiveScreen()}
      </main>

      {/* Mobile Edge-to-Edge Sticky Bottom Navigation (storefront only) */}
      {showBottomNav && <BottomNav />}

      {/* Persistent Global Floating AI Assistant Concierge Button (storefront only) */}
      {!isAdminScreen && !isPartnerWorkspace && <AIFloatingButton />}

      {/* Quick Launch Admin Portal Floating Pill (Clean minimalist, no green radio dot) */}
      {!isAdminScreen && (
        <button
          onClick={() => navigateTo('admin-console')}
          title="Open Admin Operations Console"
          className="fixed bottom-6 left-6 z-40 px-4 py-2 rounded-full bg-[#0F0F10] text-[#D4AF37] border border-[#D4AF37]/40 shadow-xl text-xs font-heading font-bold hover:bg-black active:scale-95 transition-all cursor-pointer backdrop-blur-md"
        >
          <span>Admin Portal</span>
        </button>
      )}

      {/* Global Sheets, Drawers & Modals (storefront only) */}
      {!isAdminScreen && !isPartnerWorkspace && (
        <>
          <ProductQuickModal
            product={quickModalProduct}
            isOpen={!!quickModalProduct}
            onClose={closeQuickModal}
          />
          <AddToCartSheet />
          <FilterSortSheet />
          <AIAssistantDrawer />
          <CommunityChatDrawer />
          <LocationSelector />
        </>
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
