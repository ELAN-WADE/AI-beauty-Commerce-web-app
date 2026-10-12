import React, { useState } from 'react';
import {
  Search,
  ShoppingBag,
  MapPin,
  ChevronDown,
  User,
  Bus,
  Package,
  Users
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from './BrandLogo';
import { FaceScanIcon } from './FaceScanIcon';

export const DesktopNav: React.FC = () => {
  const {
    currentScreen,
    navigateTo,
    cartCount,
    cartSubtotal,
    searchQuery,
    setSearchQuery,
    setSelectedCategory,
    selectedCity,
    setIsLocationModalOpen,
    authUser
  } = useApp();

  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const formatNaira = (amt: number) => '₦' + amt.toLocaleString('en-NG');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigateTo('search');
    }
  };

  const isHomeActive = currentScreen === 'home' || currentScreen === 'desktop-home';
  const isShopActive = ['catalogue', 'categories', 'product-details'].includes(currentScreen);

  return (
    <header className="sticky top-0 z-40 w-full shadow-xs bg-white font-body">
      {/* 1. TOP UTILITY RIBBON: Location & Authenticity (Restrained, Editorial) */}
      <div className="bg-[#0F0F10] text-[#E5E7EB] py-1.5 px-6 text-xs border-b border-black/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Location & Local Dispatch Guarantee */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 hover:bg-white/15 text-white active:scale-95 transition-transform duration-160 ease-out text-xs border border-white/10 cursor-pointer shadow-2xs"
            >
              <MapPin size={13} className="text-[#D4AF37]" />
              <span>
                Fulfillment in: <strong className="text-[#D4AF37] font-semibold">{selectedCity}</strong>
              </span>
              <ChevronDown size={12} className="text-white/60 ml-0.5" />
            </button>

            <span className="text-white/20">|</span>

            <span className="hidden md:inline-flex items-center gap-1.5 text-[11.5px] text-gray-300">
              <Bus size={13} className="text-[#D4AF37] shrink-0" />
              <span>Same-day local courier dispatch across verified city hubs</span>
            </span>
          </div>

          {/* Right: Authenticity & Concierge & Direct Orders Access */}
          <div className="flex items-center gap-3.5 text-[11px]">
            <span className="font-price font-semibold text-[#D4AF37]">
              100% NAFDAC Authentic
            </span>
            <span className="text-white/20">|</span>
            <button
              onClick={() => navigateTo('orders')}
              className="hover:text-[#D4AF37] text-gray-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Package size={12} className="text-[#D4AF37]" />
              <span>Orders</span>
            </button>
            <span className="text-white/20">|</span>
            <a
              href="https://wa.me/2348148120642"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#D4AF37] text-gray-300 transition-colors"
            >
              VIP Concierge
            </a>
          </div>
        </div>
      </div>

      {/* 2. MAIN CONCISE NAVIGATION BAR */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4 lg:gap-6">
          {/* Brand Logo & Core Nav on Left */}
          <div className="flex items-center gap-7 shrink-0">
            <BrandLogo
              variant="dark"
              size="md"
              showTagline={true}
              onClick={() => navigateTo('home')}
            />

            {/* Concise Navigation Links */}
            <nav aria-label="Main Navigation" className="hidden lg:flex items-center gap-6 text-sm font-semibold text-[#0F0F10]">
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  navigateTo('catalogue');
                }}
                className={`transition-colors cursor-pointer py-1 relative ${
                  isShopActive ? 'text-[#0F0F10] font-bold' : 'text-[#4B5563] hover:text-[#0F0F10]'
                }`}
              >
                <span>Shop</span>
                {isShopActive && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-full" />
                )}
              </button>

              <button
                onClick={() => navigateTo('categories')}
                className={`transition-colors cursor-pointer py-1 relative ${
                  currentScreen === 'categories' ? 'text-[#0F0F10] font-bold' : 'text-[#4B5563] hover:text-[#0F0F10]'
                }`}
              >
                <span>Collections</span>
                {currentScreen === 'categories' && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-full" />
                )}
              </button>

              <button
                onClick={() => navigateTo('community')}
                className={`transition-colors cursor-pointer py-1 flex items-center gap-1.5 relative ${
                  currentScreen === 'community' ? 'text-[#0F0F10] font-bold' : 'text-[#4B5563] hover:text-[#0F0F10]'
                }`}
              >
                <Users size={15} className="text-[#D4AF37]" strokeWidth={1.8} />
                <span>Community</span>
                {currentScreen === 'community' && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-full" />
                )}
              </button>

              <button
                onClick={() => navigateTo('ai-scan')}
                className={`transition-colors cursor-pointer py-1 flex items-center gap-1.5 relative ${
                  currentScreen === 'ai-scan' ? 'text-[#0F0F10] font-bold' : 'text-[#4B5563] hover:text-[#0F0F10]'
                }`}
              >
                <FaceScanIcon size={15} className="text-[#D4AF37]" strokeWidth={1.8} />
                <span>AI Scan</span>
                {currentScreen === 'ai-scan' && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-full" />
                )}
              </button>
            </nav>
          </div>

          {/* Extended Central Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md mx-2 sm:mx-4">
            <div
              className={`relative flex items-center rounded-full bg-[#FAF9F6] border border-[#E5E7EB] transition-all duration-200 ${
                isSearchFocused ? 'ring-2 ring-[#D4AF37]/50 border-[#D4AF37] bg-white shadow-xs' : 'hover:border-gray-300'
              }`}
            >
              <Search size={15} className="text-[#6B7280] ml-3.5 shrink-0" strokeWidth={2} />
              <input
                type="text"
                placeholder="Search formulations, ingredients, concerns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full bg-transparent px-3 py-2 text-xs text-[#0F0F10] placeholder-[#6B7280] focus:outline-none"
              />
            </div>
          </form>

          {/* Shopping Bag & Account on Right */}
          <div className="flex items-center gap-3.5 shrink-0">
            {/* Shopping Bag Access: Gated to authenticated users */}
            {authUser && (
              <button
                onClick={() => navigateTo('cart')}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF9F6] hover:bg-[#F3EEE3] border border-[#E5E7EB] text-[#0F0F10] active:scale-[0.97] transition-transform duration-160 ease-out cursor-pointer group"
                aria-label="View shopping bag"
              >
                <div className="relative flex items-center">
                  <ShoppingBag size={16} strokeWidth={2} className="text-[#0F0F10] group-hover:text-[#997A2E] transition-colors" />
                  {cartCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-[#D4AF37] text-[#0F0F10] text-[10px] font-extrabold rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold text-[#0F0F10]">
                  {cartSubtotal > 0 ? formatNaira(cartSubtotal) : 'Bag'}
                </span>
              </button>
            )}

            {/* Account Access: Sign In if logged out; Account Dossier if authenticated */}
            {authUser ? (
              <button
                onClick={() => navigateTo('account')}
                className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-[#FAF9F6] hover:bg-[#F3EEE3] border border-[#E5E7EB] text-xs font-semibold text-[#0F0F10] active:scale-[0.97] transition-transform duration-160 ease-out cursor-pointer"
                title={`Signed in as ${authUser.email}`}
              >
                <div className="w-6 h-6 rounded-full bg-[#0F0F10] text-[#D4AF37] flex items-center justify-center text-[10px] font-bold">
                  {authUser.profile?.displayName ? authUser.profile.displayName.charAt(0).toUpperCase() : <User size={12} />}
                </div>
                <span className="truncate max-w-[100px]">
                  {authUser.profile?.displayName || 'My Account'}
                </span>
              </button>
            ) : (
              <button
                onClick={() => navigateTo('login')}
                className="px-4 py-1.5 rounded-full bg-[#0F0F10] text-white hover:bg-[#27272A] text-xs font-semibold shadow-xs active:scale-95 transition-transform duration-160 ease-out cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
