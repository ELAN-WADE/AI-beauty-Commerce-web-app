import React from 'react';
import { ChevronLeft, Heart, ShoppingBag, MessageSquareHeart } from 'lucide-react';
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
    wishlist,
    openCommunity,
    unreadCommunityCount,
    isCartBannerDismissed
  } = useApp();

  const isMainTab = ['home', 'categories', 'account'].includes(currentScreen);
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
        return 'My Profile';
      case 'community':
        return 'Desla Collective';
      default:
        return '';
    }
  };

  const displayTitle = getScreenTitle();

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] px-4 py-2.5 transition-all duration-200 shadow-xs">
      <div className="flex items-center justify-between gap-2 max-w-md mx-auto">
        {shouldShowBack ? (
          <div className="flex items-center gap-2">
            <button
              onClick={goBack}
              className="p-1.5 -ml-1 rounded-full text-[#0F0F10] hover:bg-[#F3F4F6] active-press transition-all cursor-pointer"
              aria-label="Go back"
            >
              <ChevronLeft size={22} strokeWidth={2.2} />
            </button>
            <h1 className="font-heading font-extrabold text-base sm:text-lg text-[#0F0F10] tracking-tight truncate max-w-[200px]">
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

        <div className="flex items-center gap-1">
          {/* Beauty Community Chat Button */}
          <button
            onClick={openCommunity}
            className="p-2 rounded-full text-[#6B7280] hover:text-[#0F0F10] hover:bg-[#F3F4F6] active-press relative transition-all"
            aria-label="Desla Collective"
            title="Open Community Collective"
          >
            <MessageSquareHeart size={20} strokeWidth={1.8} className="text-[#0F0F10]" />
            {unreadCommunityCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 bg-[#D4AF37] text-[#0F0F10] text-[9.5px] font-bold rounded-full flex items-center justify-center shadow-sm">
                {unreadCommunityCount}
              </span>
            )}
          </button>

          {/* Wishlist */}
          <button
            onClick={() => navigateTo('catalogue')}
            className="p-2 rounded-full text-[#6B7280] hover:text-[#0F0F10] hover:bg-[#F3F4F6] active-press relative transition-all"
            aria-label="Wishlist"
          >
            <Heart size={20} strokeWidth={1.75} className={wishlist.length > 0 ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-[#0F0F10]'} />
            {wishlist.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#D4AF37]" />
            )}
          </button>

          {/* Shopping Bag */}
          <button
            onClick={() => navigateTo('cart')}
            className="p-2 rounded-full text-[#6B7280] hover:text-[#0F0F10] hover:bg-[#F3F4F6] active-press relative transition-all"
            aria-label="Shopping bag"
          >
            <ShoppingBag
              size={20}
              strokeWidth={1.75}
              className={`text-[#0F0F10] ${cartCount > 0 && !isCartBannerDismissed ? 'animate-cart-shake' : ''}`}
            />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[#D4AF37] text-[#0F0F10] text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

