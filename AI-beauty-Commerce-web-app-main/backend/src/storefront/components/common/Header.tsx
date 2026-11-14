import React from 'react';
import { CaretLeft, ShoppingBag, MagnifyingGlass, User, UsersThree } from '@phosphor-icons/react';
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

  const isMainTab = ['home', 'categories', 'catalogue', 'search', 'ai-scan', 'community', 'account'].includes(currentScreen);
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
    <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-[#E5E7EB]/80 px-4 py-2.5 pt-[calc(0.625rem+env(safe-area-inset-top,0px))] transition-colors duration-160 shadow-[0_4px_20px_-6px_rgba(0,0,0,0.03)] font-body">
      <div className="flex items-center justify-between gap-2 max-w-md mx-auto">
        {shouldShowBack || ['catalogue', 'search', 'ai-scan', 'community', 'account'].includes(currentScreen) ? (
          <div className="flex items-center gap-2">
            {shouldShowBack && <button
              onClick={goBack}
              className="p-1.5 -ml-1 rounded-full text-[#0F0F10] hover:bg-[#F3F4F6] active-press transition-colors cursor-pointer"
              aria-label="Go back"
            >
              <CaretLeft size={21} weight="bold" aria-hidden="true" />
            </button>}
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

        {/* Right Action Icons: Cart Bag + Sign In / Account + Community at the edge */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Quick Search only on non-home pages when not already on search screen */}
          {currentScreen !== 'home' && currentScreen !== 'search' && (
            <button
              onClick={() => navigateTo('search')}
              className="p-2 rounded-full text-[#0F0F10] hover:bg-[#F3F4F6] active-press transition-colors cursor-pointer"
              aria-label="Search skincare"
              title="Search skincare"
            >
              <MagnifyingGlass size={18} weight="bold" aria-hidden="true" />
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
              size={19}
              weight="fill"
              className={`text-[#0F0F10] ${cartCount > 0 && !isCartBannerDismissed ? 'animate-cart-shake' : ''}`}
              aria-hidden="true"
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
                {authUser.profile?.avatarUrl ? <img src={authUser.profile.avatarUrl} alt="Your profile" className="w-full h-full rounded-full object-cover" /> : (authUser.profile?.displayName || authUser.email || 'D').charAt(0).toUpperCase()}
              </div>
            </button>
          ) : (
            <button
              onClick={() => navigateTo('login')}
              className="px-2.5 py-1 rounded-full bg-[#0F0F10] text-white hover:bg-[#27272A] text-[11px] font-semibold active-press transition-colors cursor-pointer"
              aria-label="Sign In"
            >
              Sign In
            </button>
          )}

          {/* Community Icon at the edge of the navbar right-hand side */}
          <button
            onClick={() => navigateTo('community')}
            className={`p-2 rounded-full hover:bg-[#F3F4F6] active-press transition-colors cursor-pointer relative ${
              currentScreen === 'community' ? 'text-[#8B6E27] bg-[#F6E7C1]/20' : 'text-[#0F0F10]'
            }`}
            aria-label="Community Collective"
            title="Desla Collective Community"
          >
            <UsersThree size={19} weight="fill" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
};


