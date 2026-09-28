import React from 'react';
import { useViewport } from './context/ViewportContext';
import { useApp } from './context/AppContext';
import { DesktopNav } from './components/common/DesktopNav';
import { BottomNav } from './components/common/BottomNav';
import { AIFloatingButton } from './components/common/AIFloatingButton';
import { LocationSelector } from './components/common/LocationSelector';
import { AddToCartSheet } from './components/sheets/AddToCartSheet';
import { FilterSortSheet } from './components/sheets/FilterSortSheet';
import { AIAssistantDrawer } from './components/sheets/AIAssistantDrawer';
import { CommunityChatDrawer } from './components/community/CommunityChatDrawer';
import { InitialBrandLoader } from './components/common/InitialBrandLoader';

// Screens
import { Screen01Splash } from './screens/Screen01Splash';
import { Screen03Home } from './screens/Screen03Home';
import { Screen04Search } from './screens/Screen04Search';
import { Screen05Categories } from './screens/Screen05Categories';
import { Screen06Catalogue } from './screens/Screen06Catalogue';
import { Screen07ProductDetails } from './screens/Screen07ProductDetails';
import { Screen09Cart } from './screens/Screen09Cart';
import { Screen10Checkout } from './screens/Screen10Checkout';
import { Screen11Payment } from './screens/Screen11Payment';
import { Screen12OrderConfirmed } from './screens/Screen12OrderConfirmed';
import { Screen13OrdersTracking } from './screens/Screen13OrdersTracking';
import { Screen14AISkinScan } from './screens/Screen14AISkinScan';
import { ScreenAskAI } from './screens/ScreenAskAI';
import { Screen16Rewards } from './screens/Screen16Rewards';
import { Screen17Account } from './screens/Screen17Account';
import { Screen18DesktopHome } from './screens/Screen18DesktopHome';
import { ScreenCommunityChat } from './screens/ScreenCommunityChat';
import { ScreenDistributors } from './screens/ScreenDistributors';
import { ScreenDistributorPortal } from './screens/ScreenDistributorPortal';
import { ScreenCreators } from './screens/ScreenCreators';

export const App: React.FC = () => {
  const { isDesktop } = useViewport();
  const { currentScreen, isLiveBackend, livePayment, dismissLivePayment } = useApp();

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
        return <ScreenDistributorPortal />;
      case 'creators':
        return <ScreenCreators />;
      default:
        return isDesktop ? <Screen18DesktopHome /> : <Screen03Home />;
    }
  };

  const isImmersiveScreen = ['splash', 'ask-ai'].includes(currentScreen);
  const showBottomNav =
    !isDesktop &&
    ![
      'splash',
      'checkout',
      'payment',
      'order-confirmed',
      'desktop-home',
      'ask-ai'
    ].includes(currentScreen);

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0F0F10] relative font-body flex flex-col selection:bg-[#D4AF37]/20 selection:text-[#997A2E] overflow-x-clip">
      {/* Initial Luxury Brand Loading Experience (Delsla Logo reveal) */}
      <InitialBrandLoader />

      {/* Global Desktop Navigation Bar on Desktop Screens */}
      {isDesktop && !isImmersiveScreen && <DesktopNav />}

      {/* Main Responsive Storefront Viewport */}
      <main className="flex-1 w-full relative">
        {renderActiveScreen()}
      </main>

      {/* Mobile Edge-to-Edge Sticky Bottom Navigation */}
      {showBottomNav && <BottomNav />}

      {/* Persistent Global Floating AI Assistant Concierge Button */}
      <AIFloatingButton />

      {/* Global Sheets, Drawers & Modals */}
      <AddToCartSheet />
      <FilterSortSheet />
      <AIAssistantDrawer />
      <CommunityChatDrawer />
      <LocationSelector />

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
