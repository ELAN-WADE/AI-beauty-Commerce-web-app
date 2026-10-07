import React from 'react';
import { ChevronLeft, ShoppingBag, Search, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from './BrandLogo';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, showBack }) => {
  const {
    currentScreen,
    goBack,
    navigateTo,
    cartCount,
    isCartBannerDismissed,
    authUser
  } = useApp();

  const isMainTab = ['home', 'categories'].includes(currentScreen);
  const shouldShowBack = showBack !== undefined ? showBack : !isMainTab && currentScreen !== 'splash' && currentScreen !== 'onboarding';

  const getScreenTitle = (): string => {
    if (title) return title;
    switch (currentScreen) {
      case 'categories':
        return 'Collections & Taxonomy';
      case 'catalogue':
        return 'Desla!™ Catalogue';
      case 'search':
        return 'Search Store';
      case 'product-details':
        return 'Product Details';
      case 'distributors':
        return 'Local Distributors';
      case 'distributor-portal':
        return 'Distributor Portal';
      case 'creators':
        return 'Creator & MUA Hub';
      case 'cart':
        return 'Shopping Bag';
      case 'checkout':
        return 'Checkout & Fulfillment';
      case 'payment':
        return 'Payment & Security';
      case 'order-confirmed':
        return 'Order Confirmed';
      case 'orders':
        return 'Order Tracking';
      case 'ai-scan':
        return 'AI Skin Diagnosis';
      case 'rewards':
        return 'Desla Club Rewards';
      case 'account':
        return 'Client Dossier';
      case 'community':
        return 'Desla Collective';
      default:
        return '';
    }
  };

  const displayTitle = getScreenTitle();

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] px-4 py-2.5 pt-[calc(0.625rem+env(safe-area-inset-top,0px))] transition-colors duration-160 shadow-xs font-body">
      <div className="flex items-center justify-between gap-2 max-w-md mx-auto">
        {shouldShowBack ? (
          <div className="flex items-center gap-2">
            <button
              onClick={goBack}
              className="p-1.5 -ml-1 rounded-full text-[#0F0F10] hover:bg-[#F3F4F6] active-press transition-colors cursor-pointer"
              aria-label="Go back"
            >
              <ChevronLeft size={22} strokeWidth={2.2} />
            </button>
            <h1 className="font-heading font-extrabold text-base text-[#0F0F10] tracking-tight truncate max-w-[200px]">
              {displayTitle}
            </h1>
          </div>
        ) : (
          <BrandLogo
            variant="dark"
            size="sm"
            onClick={() => navigateTo('home')}
          />
        )}

        {/* Right Action Icons: Cart Bag + Sign In / Account */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick Search only on non-home pages when not already on search screen */}
          {currentScreen !== 'home' && currentScreen !== 'search' && (
            <button
              onClick={() => navigateTo('search')}
              className="p-2 rounded-full text-[#0F0F10] hover:bg-[#F3F4F6] active-press transition-colors cursor-pointer"
              aria-label="Search skincare"
              title="Search skincare"
            >
              <Search size={18} strokeWidth={2} />
            </button>
          )}

          {/* Shopping Bag with live count badge */}
          <button
            onClick={() => navigateTo('cart')}
            className="p-2 rounded-full text-[#0F0F10] hover:bg-[#F3F4F6] active-press relative transition-colors cursor-pointer"
            aria-label={`Shopping bag${cartCount > 0 ? `, ${cartCount} items` : ''}`}
            title="View shopping bag"
          >
            <ShoppingBag
              size={18}
              strokeWidth={2}
              className={`text-[#0F0F10] ${cartCount > 0 && !isCartBannerDismissed ? 'animate-cart-shake' : ''}`}
            />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 bg-[#D4AF37] text-[#0F0F10] text-[9.5px] font-extrabold rounded-full flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            )}
          </button>

          {/* Account / Sign In access */}
          {authUser ? (
            <button
              onClick={() => navigateTo('account')}
              className="p-1 rounded-full border border-[#D4AF37] hover:border-black active-press transition-all cursor-pointer relative"
              aria-label="Account Dossier"
              title={`Account: ${authUser.email}`}
            >
              <div className="w-6 h-6 rounded-full bg-[#0F0F10] text-[#D4AF37] flex items-center justify-center text-[10px] font-bold">
                {authUser.profile?.displayName ? authUser.profile.displayName.charAt(0).toUpperCase() : <User size={12} />}
              </div>
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
            </button>
          ) : (
            <button
              onClick={() => navigateTo('login')}
              className="px-3 py-1 rounded-full bg-[#0F0F10] text-white hover:bg-[#27272A] text-[11px] font-semibold active-press transition-colors cursor-pointer"
              aria-label="Sign In"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};


