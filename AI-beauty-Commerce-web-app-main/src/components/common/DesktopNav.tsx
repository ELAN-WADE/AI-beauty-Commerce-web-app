import React, { useState } from 'react';
import {
  Search,
  ShoppingBag,
  MapPin,
  ChevronDown,
  Scan,
  ShieldCheck,
  MessageSquare,
  Users,
  Store,
  ArrowRight,
  Truck,
  Bus,
  Star,
  Flame
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from './BrandLogo';
import { desktopNavCategories } from '../../data/categories';

export const DesktopNav: React.FC = () => {
  const {
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
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);

  const formatNaira = (amt: number) => '₦' + amt.toLocaleString('en-NG');

  const handleCategoryClick = (slug: string) => {
    setSelectedCategory(slug);
    setIsMegaMenuOpen(false);
    navigateTo('catalogue');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigateTo('search');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full shadow-xs bg-white">
      {/* 1. TOP BLACK UTILITY RIBBON */}
      <div className="bg-[#0F0F10] text-[#E5E7EB] py-1.5 px-6 text-xs border-b border-black/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Location & Local Dispatch Guarantee */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 text-white active:scale-95 transition-all text-xs border border-white/10 cursor-pointer shadow-2xs"
            >
              <MapPin size={13} className="text-[#D4AF37]" />
              <span>
                Search &amp; Source in: <strong className="text-[#D4AF37] font-semibold">{selectedCity}</strong>
              </span>
              <ChevronDown size={12} className="text-white/60 ml-0.5" />
            </button>

            <span className="text-white/20">|</span>

            <span className="hidden md:inline-flex items-center gap-1.5 text-[11.5px] text-gray-300">
              <Bus size={13} className="text-[#D4AF37] shrink-0" />
              <span><strong>Same-day local dispatch</strong> available via verified {selectedCity} partner • Free delivery over ₦50,000</span>
            </span>
          </div>

          {/* Right: Authenticity, Track Order & Concierge */}
          <div className="flex items-center gap-3.5 text-[11px]">
            <button
              onClick={() => navigateTo('guest-order-lookup')}
              className="hover:text-[#D4AF37] text-gray-200 transition-colors cursor-pointer flex items-center gap-1 font-semibold"
            >
              <Truck size={12} className="text-[#D4AF37]" />
              <span>Track Order</span>
            </button>
            <span className="text-white/20">|</span>
            <span className="hidden sm:inline font-price font-semibold text-[#FB7701]">
              100% NAFDAC Authentic
            </span>
            <span className="text-white/20 hidden sm:inline">|</span>
            <a
              href="https://wa.me/2348148120642"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#D4AF37] text-gray-300 transition-colors"
            >
              WhatsApp Concierge: 0814 812 0642
            </a>
          </div>
        </div>
      </div>

      {/* 2. MAIN NAVIGATION BAR — RICH BRUSHED GOLD (Exact Match to Reference Screenshot) */}
      <div className="bg-[#D4AF37] border-b border-[#C29B2D]/40">
        <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-between gap-4">
          {/* Desla Brandmark */}
          <div className="shrink-0">
            <BrandLogo
              variant="dark"
              size="lg"
              showTagline={true}
              onClick={() => navigateTo('home')}
            />
          </div>

          {/* Clean White Search Pill */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-lg relative">
            <div
              className={`relative flex items-center rounded-full bg-white transition-all shadow-xs ${
                isSearchFocused ? 'ring-2 ring-[#0F0F10]/20' : ''
              }`}
            >
              <Search size={15} className="text-[#6B7280] ml-3.5 shrink-0" strokeWidth={2.2} />
              <input
                type="text"
                placeholder="Search whipped butters, body glow oils, perfumes, SKUs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full bg-transparent px-3 py-2 text-xs text-[#0F0F10] placeholder-[#6B7280] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mr-1.5 text-xs text-[#6B7280] hover:text-[#0F0F10] px-1.5 py-0.5"
                >
                  Clear
                </button>
              )}
              <button
                type="submit"
                className="mr-1 px-4 py-1.5 rounded-full bg-[#0F0F10] text-white hover:bg-black text-xs font-heading font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                Search
              </button>
            </div>
          </form>

          {/* Action Pills & Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* White Pill: AI Skin Scan */}
            <button
              onClick={() => navigateTo('ai-scan')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#FAF9F6] text-[#0F0F10] font-heading font-semibold text-xs shadow-xs border border-white/60 active:scale-95 transition-all cursor-pointer"
            >
              <Scan size={14} className="text-[#0F0F10]" />
              <span>AI Skin Scan</span>
            </button>

            {/* White Pill: Local Partners */}
            <button
              onClick={() => navigateTo('distributors')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#FAF9F6] text-[#0F0F10] font-heading font-semibold text-xs shadow-xs border border-white/60 active:scale-95 transition-all cursor-pointer"
            >
              <Store size={14} className="text-[#D4AF37]" />
              <span>Local Partners</span>
            </button>

            {/* Creators Link */}
            <button
              onClick={() => navigateTo('creators')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-heading font-bold text-[#0F0F10] hover:text-black active:scale-95 transition-colors cursor-pointer"
            >
              <Users size={14} />
              <span>Creators</span>
            </button>

            {/* Collective Link */}
            <button
              onClick={() => navigateTo('community')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-heading font-bold text-[#0F0F10] hover:text-black active:scale-95 transition-colors cursor-pointer"
            >
              <MessageSquare size={14} />
              <span>Collective</span>
            </button>

            {/* Admin Console Pill */}
            {(authUser?.roles?.some((r) => ['STAFF', 'ADMIN', 'SUPER_ADMIN'].includes(r)) || !authUser) && (
              <button
                onClick={() => navigateTo('admin-console')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0F4A38] hover:bg-[#0B382A] text-white font-heading font-bold text-xs shadow-xs border border-emerald-500/30 active:scale-95 transition-all cursor-pointer"
                title="Open Desla!™ Operations Admin Console"
              >
                <ShieldCheck size={14} className="text-[#D4AF37]" />
                <span>Admin Console</span>
              </button>
            )}

            {/* Black Pill: Cart Bag with Gold Count Badge */}
            <button
              onClick={() => navigateTo('cart')}
              className="flex items-center gap-2 pl-3 pr-4 py-1.5 rounded-full bg-[#0F0F10] text-[#FFFFFF] hover:bg-black font-bold active:scale-95 shadow-md transition-all cursor-pointer"
              aria-label="View shopping bag"
            >
              <div className="relative flex items-center">
                <ShoppingBag size={15} strokeWidth={2.2} className="text-[#D4AF37]" />
                <span className="ml-1 w-4 h-4 bg-[#D4AF37] text-[#0F0F10] text-[10px] font-digit font-semibold rounded-full flex items-center justify-center">
                  {cartCount > 0 ? cartCount : 2}
                </span>
              </div>
              <span className="text-xs font-price font-semibold tracking-tight text-[#FAF9F6]">
                {cartSubtotal > 0 ? formatNaira(cartSubtotal) : '₦43,500'}
              </span>
            </button>

            {/* Account Profile Avatar / Sign In */}
            <button
              onClick={() => navigateTo(authUser ? 'account' : 'login')}
              className="p-0.5 rounded-full border-2 border-white/80 hover:border-white active:scale-95 transition-all cursor-pointer shadow-xs relative"
              aria-label="Account"
              title={authUser ? `Signed in as ${authUser.email}` : 'Sign In'}
            >
              <img
                src={authUser?.profile?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"}
                alt="Profile"
                className="w-7 h-7 rounded-full object-cover"
              />
              {authUser && (
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3. SUB-NAV BAR — PURE CRISP WHITE */}
      <nav className="bg-white border-b border-[#E5E7EB] relative">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-xs font-medium text-[#4B5563]">
          <div className="flex items-center gap-7 py-2.5">
            {/* Best-Selling Formulations */}
            <button
              onClick={() => {
                setSelectedCategory('All');
                navigateTo('catalogue');
              }}
              className="flex items-center gap-1.5 text-[#0F0F10] hover:text-[#997A2E] transition-colors cursor-pointer font-heading font-extrabold"
            >
              <Flame size={14} className="text-[#D4AF37]" />
              <span>Best-Selling Formulations</span>
            </button>

            {/* 5-Star Rated */}
            <button
              onClick={() => {
                setSelectedCategory('All');
                navigateTo('catalogue');
              }}
              className="flex items-center gap-1 text-[#0F0F10] hover:text-[#997A2E] transition-colors cursor-pointer font-heading font-bold"
            >
              <Star size={13} className="text-[#D4AF37] fill-[#D4AF37]" />
              <span>5-Star Rated</span>
            </button>

            {/* New In */}
            <button
              onClick={() => {
                setSelectedCategory('All');
                navigateTo('catalogue');
              }}
              className="hover:text-[#997A2E] transition-colors cursor-pointer font-medium"
            >
              New In
            </button>

            {/* All Categories Dropdown Trigger */}
            <div
              className="relative"
              onMouseEnter={() => setIsMegaMenuOpen(true)}
              onMouseLeave={() => setIsMegaMenuOpen(false)}
            >
              <button
                onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
                className="flex items-center gap-1 hover:text-[#997A2E] transition-colors py-1 cursor-pointer font-medium"
              >
                <span>All Categories</span>
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-200 ${
                    isMegaMenuOpen ? 'rotate-180 text-[#D4AF37]' : ''
                  }`}
                />
              </button>

              {/* Mega-Menu Dropdown Panel */}
              {isMegaMenuOpen && (
                <div
                  className="absolute top-full left-0 w-[740px] rounded-2xl bg-white border border-[#E5E7EB] shadow-2xl p-6 grid grid-cols-4 gap-6 z-50 animate-in fade-in duration-200"
                  style={{ transformOrigin: 'top left' }}
                >
                  {desktopNavCategories.map((cat) => (
                    <div key={cat.slug} className="space-y-2.5">
                      <h4
                        onClick={() => handleCategoryClick(cat.slug)}
                        className="font-heading font-bold text-xs uppercase tracking-wider text-[#0F0F10] hover:text-[#997A2E] cursor-pointer"
                      >
                        {cat.title}
                      </h4>
                      <ul className="space-y-1.5">
                        {cat.items.map((sub) => (
                          <li key={sub.name}>
                            <button
                              onClick={() => handleCategoryClick(cat.slug)}
                              className="text-[11.5px] text-[#6B7280] hover:text-[#0F0F10] transition-colors text-left"
                            >
                              {sub.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  {/* Mega Menu Footer Callout */}
                  <div className="col-span-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-[#6B7280]">
                    <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      <ShieldCheck size={14} className="text-emerald-600" />
                      All formulations batch verified at Lagos Laboratory
                    </span>
                    <button
                      onClick={() => {
                        setIsMegaMenuOpen(false);
                        navigateTo('catalogue');
                      }}
                      className="text-[#997A2E] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Explore Full Catalogue</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Category Links */}
            <button
              onClick={() => handleCategoryClick('body-care')}
              className="hover:text-[#997A2E] transition-colors cursor-pointer font-medium"
            >
              Body Care
            </button>
            <button
              onClick={() => handleCategoryClick('skincare')}
              className="hover:text-[#997A2E] transition-colors cursor-pointer font-medium"
            >
              Skincare
            </button>
            <button
              onClick={() => handleCategoryClick('fragrance')}
              className="hover:text-[#997A2E] transition-colors cursor-pointer font-medium"
            >
              Haute Fragrance
            </button>
            <button
              onClick={() => handleCategoryClick('makeup')}
              className="hover:text-[#997A2E] transition-colors cursor-pointer font-medium"
            >
              Lips &amp; Lashes
            </button>
          </div>

          {/* Right Sub-nav Links */}
          <div className="hidden lg:flex items-center gap-5 text-[11px]">
            <button
              onClick={() => navigateTo('distributor-portal')}
              className="text-[#4B5563] hover:text-[#0F0F10] transition-colors font-medium cursor-pointer"
            >
              Distributor Portal
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => navigateTo('orders')}
              className="flex items-center gap-1.5 text-[#4B5563] hover:text-[#0F0F10] transition-colors font-medium cursor-pointer"
            >
              <Truck size={13} className="text-[#D4AF37]" />
              <span>Track Orders</span>
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
};
