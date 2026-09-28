import React, { useState } from 'react';
import {
  User,
  Package,
  Heart,
  Clock,
  MapPin,
  Sparkles,
  MessageCircle,
  HelpCircle,
  Settings,
  LogOut,
  ChevronRight,
  Truck,
  ShieldCheck,
  Star,
  ArrowRight,
  ExternalLink,
  Award
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/common/ProductCard';

export const Screen17Account: React.FC = () => {
  const {
    userProfile,
    navigateTo,
    openAIAssistant,
    orders,
    wishlist,
    products,
    selectedCity,
    setIsLocationModalOpen,
    skinProfile,
    viewProductDetails,
    addToCart,
    isLiveBackend,
    authUser,
    authLoading,
    login,
    register,
    logout
  } = useApp();

  // Live auth form state (owned backend only; demo mode hides this panel)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword) {
      setAuthMessage('Enter your email and password.');
      return;
    }
    setAuthBusy(true);
    setAuthMessage('');
    try {
      const res = authMode === 'login' ? await login(authEmail, authPassword) : await register(authEmail, authPassword);
      setAuthMessage(res.message);
      if (res.success) {
        setAuthPassword('');
      }
    } finally {
      setAuthBusy(false);
    }
  };

  // Wishlist products
  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));
  const displayWishlist = wishlistedProducts.length > 0 ? wishlistedProducts.slice(0, 5) : products.slice(0, 5);

  // Recently viewed or recommended formulations
  const recentFormulations = products.slice(2, 7);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0F0F10] pb-28 font-body selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      {/* Top Page Header Banner (Mobile/Tablet Only — Hidden on Desktop where DesktopNav is sticky) */}
      <div className="lg:hidden border-b border-[#E5E7EB] bg-white py-6 px-4 lg:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
              Client Intelligence Dossier
            </span>
            <h1 className="font-heading font-extrabold text-2xl lg:text-3xl text-[#0F0F10] tracking-tight">
              My Account &amp; Beauty Dossier
            </h1>
            <p className="text-xs text-[#6B7280] mt-1">
              Personal formulations, live regional city order dispatch &amp; clinical AI skin telemetry.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] text-xs font-mono font-bold text-[#0F0F10]">
              Client ID: #DES-{userProfile.phone.slice(-4) || '9821'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Fluid 2-Column Responsive Dashboard Grid */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {/* Live account access (owned backend only; hidden in demo mode) */}
        {isLiveBackend && (
          <section aria-label="Account Access" className="mb-8 p-6 rounded-2xl bg-[#0F0F10] text-white border border-[#D4AF37]/30 shadow-xs">
            {authLoading ? (
              <p className="text-xs text-[#A19B96]">Checking session…</p>
            ) : authUser ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D4AF37]">
                    Signed In
                  </span>
                  <p className="font-heading font-bold text-base mt-0.5">{authUser.email}</p>
                  <p className="text-[11px] text-[#A19B96] mt-0.5">
                    {authUser.emailVerified ? 'Email verified' : 'Email unverified — check your inbox'} • {authUser.roles.join(', ') || 'CUSTOMER'}
                  </p>
                </div>
                <button
                  onClick={() => logout()}
                  className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold active:scale-95 transition-all cursor-pointer self-start sm:self-auto"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <form onSubmit={handleAuthSubmit} className="space-y-3 max-w-md">
                <div className="flex items-center gap-2">
                  {(['login', 'register'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setAuthMode(m); setAuthMessage(''); }}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all cursor-pointer ${authMode === m ? 'bg-[#D4AF37] text-[#0F0F10]' : 'bg-white/10 text-white hover:bg-white/15'}`}
                    >
                      {m === 'login' ? 'Sign In' : 'Create Account'}
                    </button>
                  ))}
                </div>
                <input
                  type="email"
                  required
                  placeholder="Email address"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm placeholder:text-[#A19B96] outline-none focus:border-[#D4AF37]/60"
                />
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Password (min 8 characters)"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm placeholder:text-[#A19B96] outline-none focus:border-[#D4AF37]/60"
                />
                {authMessage && <p className="text-[11px] text-[#F6E7C1]">{authMessage}</p>}
                <button
                  type="submit"
                  disabled={authBusy}
                  className="px-6 py-2.5 rounded-full bg-[#D4AF37] text-[#0F0F10] text-xs font-bold hover:bg-[#C29B2D] active:scale-95 transition-all cursor-pointer disabled:opacity-60"
                >
                  {authBusy ? 'Please wait…' : authMode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>
            )}
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: USER PROFILE & SETTINGS (4 Columns — Sticky on Desktop) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            {/* User Profile Card */}
            <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-4 text-center">
              <div className="relative w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-[#D4AF37] shadow-sm">
                <img
                  src={userProfile.avatar}
                  alt={userProfile.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h3 className="font-heading font-extrabold text-xl text-[#0F0F10]">
                  {userProfile.name}
                </h3>
                <span className="inline-block px-3 py-1 rounded-full bg-[#FBF5E8] border border-[#D4AF37]/50 text-[#997A2E] text-xs font-heading font-bold mt-1.5">
                  {userProfile.tier} Member
                </span>
                <p className="text-xs text-[#6B7280] mt-2 font-mono">{userProfile.email}</p>
                <p className="text-xs text-[#6B7280] font-mono">{userProfile.phone}</p>
              </div>

              {/* Desla Club Loyalty Points */}
              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] flex items-center justify-between text-left">
                <div>
                  <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block font-semibold">
                    Desla Club Loyalty
                  </span>
                  <span className="font-mono font-extrabold text-xl text-[#0F0F10] block">
                    {userProfile.points.toLocaleString()} Points
                  </span>
                </div>
                <button
                  onClick={() => navigateTo('rewards')}
                  className="px-3.5 py-1.5 rounded-full bg-[#0F0F10] text-white hover:bg-[#D4AF37] hover:text-[#0F0F10] font-heading font-bold text-xs active:scale-[0.97] transition-all cursor-pointer shadow-xs"
                >
                  Redeem
                </button>
              </div>
            </div>

            {/* Sourcing City & Delivery Settings */}
            <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-4 divide-y divide-[#E5E7EB]">
              {/* Sourcing City */}
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-2.5">
                  <MapPin size={18} className="text-[#D4AF37]" />
                  <div>
                    <span className="text-[10.5px] text-[#6B7280] uppercase tracking-wider block font-semibold">
                      Sourcing City
                    </span>
                    <span className="font-heading font-bold text-sm text-[#0F0F10]">
                      {selectedCity} (Wuse 2 &amp; Maitama)
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsLocationModalOpen(true)}
                  className="text-xs font-heading font-bold text-[#997A2E] hover:underline cursor-pointer"
                >
                  Change
                </button>
              </div>

              {/* Saved Delivery Addresses */}
              <div className="pt-3 flex items-center justify-between">
                <div>
                  <span className="text-[10.5px] text-[#6B7280] uppercase tracking-wider block font-semibold">
                    Saved Addresses
                  </span>
                  <span className="font-heading font-bold text-xs text-[#0F0F10]">
                    2 Active Delivery Addresses
                  </span>
                  <p className="text-[11px] text-[#6B7280] mt-0.5 truncate max-w-[200px]">
                    Suite 14, Maitama, Abuja (FCT)
                  </p>
                </div>
                <button
                  onClick={() => alert('Address Manager: 2 verified delivery locations in Abuja & Lagos.')}
                  className="text-xs font-heading font-bold text-[#0F0F10] hover:text-[#997A2E] cursor-pointer"
                >
                  Manage
                </button>
              </div>

              {/* Support & AI Concierge */}
              <div className="pt-3 space-y-2">
                <button
                  onClick={() => navigateTo('ask-ai')}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] hover:border-[#D4AF37] text-left text-xs font-heading font-bold text-[#0F0F10] flex items-center justify-between active:scale-[0.97] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles size={15} className="text-[#D4AF37]" />
                    <span>Desla AI Concierge &amp; Support</span>
                  </div>
                  <ChevronRight size={15} className="text-[#6B7280]" />
                </button>

                <a
                  href="https://wa.me/2348148120642?text=Hello%20Desla%20VIP%20Concierge,%20I%20am%20contacting%20you%20regarding%20my%20account."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-left text-xs font-heading font-bold text-emerald-800 flex items-center justify-between active:scale-[0.97] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <MessageCircle size={15} />
                    <span>WhatsApp VIP Concierge</span>
                  </div>
                  <ExternalLink size={13} />
                </a>
              </div>

              {/* Sign Out */}
              <div className="pt-4">
                <button
                  onClick={() => navigateTo('splash')}
                  className="w-full py-2.5 rounded-full border border-gray-200 text-xs font-heading font-semibold text-[#6B7280] hover:text-red-600 hover:border-red-200 active:scale-[0.97] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: CUSTOMER ACTIVITY & INTELLIGENCE (8 Columns) */}
          <div className="lg:col-span-8 space-y-8">
            {/* 1. Active Orders & Regional Sourcing Tracker */}
            <section className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E7EB] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FBF5E8] flex items-center justify-center text-[#997A2E]">
                    <Truck size={18} />
                  </div>
                  <div>
                    <h2 className="font-heading font-extrabold text-base text-[#0F0F10]">
                      Active Orders &amp; Regional Sourcing Tracker
                    </h2>
                    <span className="text-xs text-[#6B7280]">
                      Local city partner fulfillment dispatch
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => navigateTo('orders')}
                  className="text-xs font-heading font-bold text-[#997A2E] hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                >
                  <span>View All Orders ({orders.length})</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              {/* Live Active Delivery Status Card */}
              <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#D4AF37]/35 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="font-mono font-bold text-xs text-[#0F0F10]">
                      Order #DES-98214 — Out for Delivery ({selectedCity} Hub)
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-mono font-bold border border-emerald-200 self-start sm:self-auto">
                    ETA: 15–20 mins • PIN: 4821
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block">Assigned Dispatch</span>
                    <span className="font-heading font-bold text-[#0F0F10] block mt-0.5">Emeka (Bike Rider)</span>
                    <span className="text-[11px] text-[#6B7280]">2.4 km from your address</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block">Formulations En Route</span>
                    <span className="font-heading font-bold text-[#0F0F10] block mt-0.5">2 Items</span>
                    <span className="text-[11px] text-[#6B7280]">Radiant Oil &amp; Shea Butter</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-[#E5E7EB]">
                    <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block">Sourcing Facility</span>
                    <span className="font-heading font-bold text-[#0F0F10] block mt-0.5">{selectedCity} Hub Central</span>
                    <span className="text-[11px] text-emerald-700 font-semibold">₦1,500 local fee (Saved ₦4,500)</span>
                  </div>
                </div>

                {/* Progress track line */}
                <div className="space-y-1.5 pt-1">
                  <div className="w-full bg-[#E5E7EB] h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#D4AF37] to-[#997A2E] rounded-full w-4/5 transition-all duration-500" />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-[#6B7280]">
                    <span>Laboratory Packed</span>
                    <span>Hub Sorted</span>
                    <span className="text-[#0F0F10] font-bold">Courier En Route (80%)</span>
                    <span>Delivered</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Recently Viewed Formulations Carousel */}
            <section className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#F6F5F2] flex items-center justify-center text-[#0F0F10]">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h2 className="font-heading font-extrabold text-base text-[#0F0F10]">
                      Recently Viewed Formulations
                    </h2>
                    <span className="text-xs text-[#6B7280]">
                      Safe-conscious items you inspected recently
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2">
                {recentFormulations.map((prod) => (
                  <div key={prod.id} className="w-48 shrink-0">
                    <ProductCard product={prod} variant="rail" />
                  </div>
                ))}
              </div>
            </section>

            {/* 3. Clinical AI Skin Telemetry & Routine */}
            <section className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FBF5E8] flex items-center justify-center text-[#997A2E]">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h2 className="font-heading font-extrabold text-base text-[#0F0F10]">
                      Clinical AI Skin Telemetry &amp; Routine
                    </h2>
                    <span className="text-xs text-[#6B7280]">
                      Optical barrier diagnostics for melanin-rich African skin
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => navigateTo('ai-scan')}
                  className="px-3.5 py-1.5 rounded-full bg-[#0F0F10] text-white hover:bg-[#D4AF37] hover:text-[#0F0F10] font-heading font-bold text-xs active:scale-[0.97] transition-all cursor-pointer shadow-xs"
                >
                  {skinProfile ? 'Re-scan Skin' : 'Start 60s Scan'}
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] flex flex-col md:flex-row items-center justify-between gap-5">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E5E7EB] text-xs font-mono font-bold text-[#0F0F10]">
                    <ShieldCheck size={14} className="text-[#D4AF37]" />
                    <span>Barrier Health Index: {skinProfile?.overallScore || 86}% Optimal</span>
                  </div>
                  <h3 className="font-heading font-extrabold text-base text-[#0F0F10]">
                    Melanin-Barrier Peptide Toner &amp; Sun Defense SPF50+
                  </h3>
                  <p className="text-xs text-[#6B7280] leading-relaxed max-w-xl">
                    {skinProfile?.analysisSummary ||
                      'Clinical evaluation confirms resilient melanin-rich epidermal structure with localized moisture trans-evaporation in the T-zone. Botanical humectants and broad-spectrum sunscreen are prioritized.'}
                  </p>
                </div>

                <button
                  onClick={() => navigateTo('ai-scan')}
                  className="px-5 py-3 rounded-full bg-white border border-[#D4AF37] hover:bg-[#FBF5E8] text-[#997A2E] font-heading font-bold text-xs whitespace-nowrap active:scale-[0.97] transition-all cursor-pointer shadow-xs shrink-0"
                >
                  View Full Diagnosis
                </button>
              </div>
            </section>

            {/* 4. Saved Formulations (Wishlist) */}
            <section className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FBF5E8] flex items-center justify-center text-[#997A2E]">
                    <Heart size={18} />
                  </div>
                  <div>
                    <h2 className="font-heading font-extrabold text-base text-[#0F0F10]">
                      Saved Formulations (Wishlist)
                    </h2>
                    <span className="text-xs text-[#6B7280]">
                      {wishlist.length} favorited items curated in your beauty portfolio
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => navigateTo('catalogue')}
                  className="text-xs font-heading font-bold text-[#997A2E] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Explore All</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              {/* 5-item quick grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                {displayWishlist.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};
