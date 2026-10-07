import React, { useState } from 'react';
import {
  Search,
  ShoppingBag,
  MapPin,
  ChevronDown,
  User,
  ShieldCheck,
  Bus,
  Sparkles,
  Store,
  Users
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from './BrandLogo';

export const DesktopNav: React.FC = () => {
  const {
    currentScreen,
    navigateTo,
    loginAsDemoRole,
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
      {/* 1. TOP UTILITY RIBBON: Location & Authenticity (Restrained, Bounded) */}
      <div className="bg-[#0F0F10] text-[#E5E7EB] py-1.5 px-6 text-xs border-b border-black/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Location & Local Dispatch Guarantee */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 text-white active:scale-95 transition-transform duration-160 ease-out text-xs border border-white/10 cursor-pointer shadow-2xs"
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

          {/* Right: Authenticity & Concierge */}
          <div className="flex items-center gap-3.5 text-[11px]">
            <span className="font-price font-semibold text-[#D4AF37]">
              100% NAFDAC Authentic
            </span>
            <span className="text-white/20">|</span>
            <a
              href="https://wa.me/2348148120642"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#D4AF37] text-gray-300 transition-colors"
            >
              VIP Concierge: 0814 812 0642
            </a>
          </div>
        </div>
      </div>

      {/* 2. MAIN CONCISE NAVIGATION BAR */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-6">
          {/* Brand Logo on Left */}
          <div className="shrink-0">
            <BrandLogo
              variant="dark"
              size="md"
              showTagline={true}
              onClick={() => navigateTo('home')}
            />
          </div>

          {/* Concise Navigation Links: Home, Shop, Collections */}
          <nav aria-label="Main Navigation" className="flex items-center gap-8 text-sm font-semibold text-[#0F0F10]">
            <button
              onClick={() => navigateTo('home')}
              className={`transition-colors cursor-pointer py-1 relative ${
                isHomeActive ? 'text-[#0F0F10] font-bold' : 'text-[#4B5563] hover:text-[#0F0F10]'
              }`}
            >
              <span>Home</span>
              {isHomeActive && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-full" />
              )}
            </button>

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
              className="text-[#4B5563] hover:text-[#0F0F10] transition-colors cursor-pointer py-1"
            >
              Collections
            </button>

            {/* Quick Access to Partner Portals */}
            <div className="relative group">
              <button
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-[#FAF9F6] hover:bg-[#F3EEE3] text-[#0F0F10] border border-[#E5E7EB] transition-all cursor-pointer shadow-2xs group-hover:border-[#D4AF37]"
              >
                <Sparkles size={13} className="text-[#D4AF37]" />
                <span>Partner Portals</span>
                <ChevronDown size={12} className="text-[#6B7280] group-hover:text-[#0F0F10] transition-transform duration-160 group-hover:rotate-180" />
              </button>

              {/* Luxury Dropdown */}
              <div className="absolute top-full left-0 mt-2 w-64 p-2 bg-white rounded-2xl shadow-xl border border-[#E5E7EB] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                <button
                  onClick={() => {
                    loginAsDemoRole('CREATOR');
                    navigateTo('creators');
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-[#FAF9F6] transition-colors flex items-center justify-between group/item cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#FBF5E8] text-[#997A2E] flex items-center justify-center shrink-0">
                      <Users size={16} className="text-[#D4AF37]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#0F0F10]">Creator Studio</p>
                      <p className="text-[10.5px] text-[#6B7280]">12% cash &amp; PR box room</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-[#FBF5E8] text-[#997A2E]">
                    12 Screens
                  </span>
                </button>

                <button
                  onClick={() => {
                    loginAsDemoRole('DISTRIBUTOR');
                    navigateTo('distributor-portal');
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-[#FAF9F6] transition-colors flex items-center justify-between group/item cursor-pointer mt-1"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#FBF5E8] text-[#997A2E] flex items-center justify-center shrink-0">
                      <Store size={16} className="text-[#D4AF37]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#0F0F10]">Distributor Hub</p>
                      <p className="text-[10.5px] text-[#6B7280]">32% wholesale &amp; dispatch</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-[#FBF5E8] text-[#997A2E]">
                    10 Screens
                  </span>
                </button>
              </div>
            </div>
          </nav>

          {/* Search, Cart & Account Access on Right */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Search Pill */}
            <form onSubmit={handleSearchSubmit} className="relative hidden xl:block w-64">
              <div
                className={`relative flex items-center rounded-full bg-[#FAF9F6] border border-[#E5E7EB] transition-colors ${
                  isSearchFocused ? 'ring-2 ring-[#D4AF37]/50 border-[#D4AF37]' : ''
                }`}
              >
                <Search size={14} className="text-[#6B7280] ml-3 shrink-0" strokeWidth={2} />
                <input
                  type="text"
                  placeholder="Search skincare..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className="w-full bg-transparent px-2.5 py-1.5 text-xs text-[#0F0F10] placeholder-[#6B7280] focus:outline-none"
                />
              </div>
            </form>

            {/* Quick Search Button (compact screens) */}
            <button
              onClick={() => navigateTo('search')}
              className="xl:hidden p-2 rounded-full text-[#4B5563] hover:text-[#0F0F10] hover:bg-[#FAF9F6] transition-colors cursor-pointer"
              aria-label="Search"
            >
              <Search size={18} />
            </button>

            {/* Secondary Cart Access */}
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateTo('login')}
                  className="px-4 py-1.5 rounded-full bg-[#0F0F10] text-white hover:bg-[#27272A] text-xs font-semibold shadow-xs active:scale-95 transition-transform duration-160 ease-out cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

