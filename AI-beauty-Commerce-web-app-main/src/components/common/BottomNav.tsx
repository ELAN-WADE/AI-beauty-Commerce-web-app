import React from 'react';
import { Home, LayoutGrid, ShoppingBag, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const BottomNav: React.FC = () => {
  const { currentScreen, navigateTo, cartCount } = useApp();

  const getActiveTab = (): 'home' | 'shop' | 'cart' | 'account' => {
    if (['home', 'splash', 'onboarding'].includes(currentScreen)) return 'home';
    if (['categories', 'catalogue', 'product-details', 'search'].includes(currentScreen)) return 'shop';
    if (['cart', 'checkout', 'payment', 'order-confirmed'].includes(currentScreen)) return 'cart';
    if (['account', 'rewards', 'orders', 'distributors', 'distributor-portal', 'creators', 'community'].includes(currentScreen)) return 'account';
    return 'home';
  };

  const activeTab = getActiveTab();

  return (
    <nav className="sticky bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-2xl border-t border-[#E5E7EB] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] shrink-0 lg:hidden font-body pb-[env(safe-area-inset-bottom,0px)]">
      <div className="w-full px-2 py-1.5 flex items-center justify-around max-w-md mx-auto">
        {/* 1. Home */}
        <button
          onClick={() => navigateTo('home')}
          className={`flex flex-col items-center justify-center py-1 px-3 flex-1 min-h-[48px] active-press transition-colors cursor-pointer ${
            activeTab === 'home' ? 'text-[#0F0F10] font-bold' : 'text-[#6B7280] hover:text-[#0F0F10]'
          }`}
          aria-label="Home"
          aria-current={activeTab === 'home' ? 'page' : undefined}
        >
          <Home size={21} strokeWidth={activeTab === 'home' ? 2.4 : 1.8} className={activeTab === 'home' ? 'text-[#997A2E]' : ''} />
          <span className="text-[10.5px] mt-1 tracking-tight leading-none">Home</span>
          {activeTab === 'home' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-1" />
          )}
        </button>

        {/* 2. Shop / Explore */}
        <button
          onClick={() => navigateTo('catalogue')}
          className={`flex flex-col items-center justify-center py-1 px-3 flex-1 min-h-[48px] active-press transition-colors cursor-pointer ${
            activeTab === 'shop' ? 'text-[#0F0F10] font-bold' : 'text-[#6B7280] hover:text-[#0F0F10]'
          }`}
          aria-label="Shop Catalogue"
          aria-current={activeTab === 'shop' ? 'page' : undefined}
        >
          <LayoutGrid size={21} strokeWidth={activeTab === 'shop' ? 2.4 : 1.8} className={activeTab === 'shop' ? 'text-[#997A2E]' : ''} />
          <span className="text-[10.5px] mt-1 tracking-tight leading-none">Shop</span>
          {activeTab === 'shop' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-1" />
          )}
        </button>

        {/* 3. Bag / Cart */}
        <button
          onClick={() => navigateTo('cart')}
          className={`flex flex-col items-center justify-center py-1 px-3 flex-1 min-h-[48px] active-press transition-colors cursor-pointer ${
            activeTab === 'cart' ? 'text-[#0F0F10] font-bold' : 'text-[#6B7280] hover:text-[#0F0F10]'
          }`}
          aria-label={`Shopping bag${cartCount > 0 ? `, ${cartCount} items` : ''}`}
          aria-current={activeTab === 'cart' ? 'page' : undefined}
        >
          <div className="relative">
            <ShoppingBag size={21} strokeWidth={activeTab === 'cart' ? 2.4 : 1.8} className={activeTab === 'cart' ? 'text-[#997A2E]' : ''} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2.5 min-w-[16px] h-4 px-1 bg-[#D4AF37] text-[#0F0F10] text-[9.5px] font-extrabold rounded-full flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10.5px] mt-1 tracking-tight leading-none">Bag</span>
          {activeTab === 'cart' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-1" />
          )}
        </button>

        {/* 4. Account */}
        <button
          onClick={() => navigateTo('account')}
          className={`flex flex-col items-center justify-center py-1 px-3 flex-1 min-h-[48px] active-press transition-colors cursor-pointer ${
            activeTab === 'account' ? 'text-[#0F0F10] font-bold' : 'text-[#6B7280] hover:text-[#0F0F10]'
          }`}
          aria-label="Account Dossier"
          aria-current={activeTab === 'account' ? 'page' : undefined}
        >
          <User size={21} strokeWidth={activeTab === 'account' ? 2.4 : 1.8} className={activeTab === 'account' ? 'text-[#997A2E]' : ''} />
          <span className="text-[10.5px] mt-1 tracking-tight leading-none">Account</span>
          {activeTab === 'account' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-1" />
          )}
        </button>
      </div>
    </nav>
  );
};
