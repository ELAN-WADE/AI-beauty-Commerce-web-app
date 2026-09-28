import React from 'react';
import { Home, LayoutGrid, Store, MessageSquare, ShoppingBag, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const BottomNav: React.FC = () => {
  const { currentScreen, navigateTo, cartCount } = useApp();

  const getActiveTab = (): string => {
    if (['home', 'splash', 'onboarding'].includes(currentScreen)) return 'home';
    if (['categories', 'catalogue', 'product-details', 'search'].includes(currentScreen)) return 'shop';
    if (['distributors', 'distributor-portal'].includes(currentScreen)) return 'distributors';
    if (currentScreen === 'community') return 'community';
    if (['cart', 'checkout', 'payment', 'order-confirmed'].includes(currentScreen)) return 'cart';
    if (['account', 'rewards', 'orders'].includes(currentScreen)) return 'account';
    return 'home';
  };

  const activeTab = getActiveTab();

  return (
    <nav className="sticky bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-[#E5E7EB] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] shrink-0 lg:hidden font-body">
      <div className="w-full px-2 py-1.5 flex items-center justify-around">
        {/* Home */}
        <button
          onClick={() => navigateTo('home')}
          className={`flex flex-col items-center justify-center py-1 px-2 transition-colors min-h-[44px] min-w-[50px] active:scale-95 cursor-pointer ${
            activeTab === 'home' ? 'text-[#997A2E] font-bold' : 'text-[#6B7280] hover:text-[#0F0F10]'
          }`}
          aria-label="Home"
        >
          <Home size={20} strokeWidth={activeTab === 'home' ? 2.5 : 1.75} />
          <span className="text-[10px] mt-1 tracking-tight">Home</span>
        </button>

        {/* Shop */}
        <button
          onClick={() => navigateTo('categories')}
          className={`flex flex-col items-center justify-center py-1 px-2 transition-colors min-h-[44px] min-w-[50px] active:scale-95 cursor-pointer ${
            activeTab === 'shop' ? 'text-[#997A2E] font-bold' : 'text-[#6B7280] hover:text-[#0F0F10]'
          }`}
          aria-label="Shop Catalog"
        >
          <LayoutGrid size={20} strokeWidth={activeTab === 'shop' ? 2.5 : 1.75} />
          <span className="text-[10px] mt-1 tracking-tight">Shop</span>
        </button>

        {/* Local Distributors */}
        <button
          onClick={() => navigateTo('distributors')}
          className={`flex flex-col items-center justify-center py-1 px-2 transition-colors min-h-[44px] min-w-[50px] active:scale-95 cursor-pointer ${
            activeTab === 'distributors' ? 'text-[#997A2E] font-bold' : 'text-[#6B7280] hover:text-[#0F0F10]'
          }`}
          aria-label="Local Distributors"
        >
          <div className="relative">
            <Store size={20} strokeWidth={activeTab === 'distributors' ? 2.5 : 1.75} />
            <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Local</span>
        </button>

        {/* Desla Collective (Social Community) */}
        <button
          onClick={() => navigateTo('community')}
          className={`flex flex-col items-center justify-center py-1 px-2 transition-colors min-h-[44px] min-w-[50px] active:scale-95 cursor-pointer ${
            activeTab === 'community' ? 'text-[#997A2E] font-bold' : 'text-[#6B7280] hover:text-[#0F0F10]'
          }`}
          aria-label="Community Collective"
        >
          <MessageSquare size={20} strokeWidth={activeTab === 'community' ? 2.5 : 1.75} />
          <span className="text-[10px] mt-1 tracking-tight">Collective</span>
        </button>

        {/* Bag */}
        <button
          onClick={() => navigateTo('cart')}
          className={`flex flex-col items-center justify-center py-1 px-2 transition-colors min-h-[44px] min-w-[50px] active:scale-95 cursor-pointer ${
            activeTab === 'cart' ? 'text-[#997A2E] font-bold' : 'text-[#6B7280] hover:text-[#0F0F10]'
          }`}
          aria-label="Cart Bag"
        >
          <div className="relative">
            <ShoppingBag size={20} strokeWidth={activeTab === 'cart' ? 2.5 : 1.75} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 bg-[#D4AF37] text-[#0F0F10] text-[9.5px] font-extrabold rounded-full flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Bag</span>
        </button>

        {/* Account */}
        <button
          onClick={() => navigateTo('account')}
          className={`flex flex-col items-center justify-center py-1 px-2 transition-colors min-h-[44px] min-w-[50px] active:scale-95 cursor-pointer ${
            activeTab === 'account' ? 'text-[#997A2E] font-bold' : 'text-[#6B7280] hover:text-[#0F0F10]'
          }`}
          aria-label="Account"
        >
          <User size={20} strokeWidth={activeTab === 'account' ? 2.5 : 1.75} />
          <span className="text-[10px] mt-1 tracking-tight">Profile</span>
        </button>
      </div>
    </nav>
  );
};
