import React, { useEffect, useState } from 'react';
import { CaretLeft, ShoppingBag, MagnifyingGlass } from '@phosphor-icons/react';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from './BrandLogo';
import { DeslaRollingNumber } from '../motion/DeslaMobileDrawer';

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
        return 'AI Skin Assessment';
      case 'rewards':
        return 'Desla Club Rewards';
      case 'account':
        return 'Client Dossier';
      case 'community':
        return 'Community Hub';
      default:
        return '';
    }
  };

  const displayTitle = getScreenTitle();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 w-full bg-white/95 backdrop-blur-xl border-b px-4 py-2 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] transition-[border-color,box-shadow,background-color] duration-150 font-body ${
        scrolled ? 'border-[#E7E1D6] shadow-[0_6px_20px_-14px_rgba(17,17,17,0.16)]' : 'border-[#EAE5DC]/75'
      }`}
    >
      <div className="flex items-center justify-between gap-2 max-w-md mx-auto min-h-[40px]">
        {shouldShowBack || ['categories', 'catalogue', 'search', 'ai-scan', 'community', 'account'].includes(currentScreen) ? (
          <div className="flex items-center gap-1.5 min-w-0">
            {shouldShowBack && (
              <button
                type="button"
                onClick={goBack}
                className="w-9 h-9 -ml-1.5 rounded-full flex items-center justify-center text-[#111111] hover:bg-[#F5F2EB] active-press transition-colors cursor-pointer shrink-0"
                aria-label="Go back"
              >
                <CaretLeft size={20} weight="bold" aria-hidden="true" />
              </button>
            )}
            <h1 className="font-heading font-semibold text-[15px] text-[#111111] tracking-tight truncate">
              {displayTitle}
            </h1>
          </div>
        ) : (
          <BrandLogo
            variant="dark"
            size="sm"
            showTagline={false}
            onClick={() => navigateTo('home')}
          />
        )}

        {/* Right Action Icons: Search + Shopping Bag (NumberFlow) + Account / Sign In */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick Search when not already on search screen */}
          {currentScreen !== 'search' && (
            <button
              type="button"
              onClick={() => navigateTo('search')}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#111111] hover:bg-[#F5F2EB] active-press transition-colors cursor-pointer"
              aria-label="Search skincare"
              title="Search skincare"
            >
              <MagnifyingGlass size={18} weight="regular" aria-hidden="true" />
            </button>
          )}

          {/* Shopping Bag with rolling NumberFlow live count badge */}
          <button
            type="button"
            onClick={() => navigateTo('cart')}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#111111] hover:bg-[#F5F2EB] active-press relative transition-colors cursor-pointer"
            aria-label={`Shopping bag${cartCount > 0 ? `, ${cartCount} items` : ''}`}
            title="View shopping bag"
            data-cart-target
          >
            <ShoppingBag
              size={19}
              weight={cartCount > 0 ? 'fill' : 'regular'}
              className="text-[#111111]"
              aria-hidden="true"
            />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 min-w-[17px] h-[17px] px-1 bg-[#D4AF37] text-[#111111] text-[9.5px] font-semibold rounded-full flex items-center justify-center shadow-sm leading-none">
                <DeslaRollingNumber value={cartCount} />
              </span>
            )}
          </button>

          {/* Account / Sign In access (Community lives cleanly in BottomNav Tab #4) */}
          {authUser ? (
            <button
              type="button"
              onClick={() => navigateTo('account')}
              className="p-0.5 rounded-full border border-[#D4AF37]/80 hover:border-[#111111] active-press transition-[transform,border-color] duration-150 cursor-pointer relative"
              aria-label="Account Dossier"
              title={`Account: ${authUser.email}`}
            >
              <div className="w-7 h-7 rounded-full bg-[#111111] text-[#E6C77A] flex items-center justify-center text-[10px] font-semibold overflow-hidden">
                {authUser.profile?.avatarUrl ? (
                  <img src={authUser.profile.avatarUrl} alt="Your profile" className="w-full h-full object-cover" />
                ) : (
                  (authUser.profile?.displayName || authUser.email || 'D').charAt(0).toUpperCase()
                )}
              </div>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigateTo('login')}
              className="px-3 h-8 rounded-full bg-[#111111] text-white hover:bg-[#242426] text-[11px] font-medium active-press transition-colors cursor-pointer"
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


