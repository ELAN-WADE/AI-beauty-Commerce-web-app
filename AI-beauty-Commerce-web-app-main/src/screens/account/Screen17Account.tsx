import React, { useState } from 'react';
import {
  User,
  Package,
  Heart,
  Clock,
  MapPin,
  Activity,
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
  Award,
  CheckCircle2,
  Plus,
  Trash2,
  X,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductCard } from '../../components/common/ProductCard';
import { BotanicalSprig, HandDrawnLoop, ApothecaryPuritySeal } from '../../components/common/HandDrawnAccents';

export interface SavedAddress {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  area: string;
  city: string;
  state: string;
  postalCode?: string;
  isDefault: boolean;
}

const initialSavedAddresses: SavedAddress[] = [
  {
    id: 'addr-abuja-1',
    fullName: 'Amina Bello',
    phone: '+234 814 812 0642',
    street: 'Suite 14, Purity Crescent, Off Amazon Street',
    area: 'Maitama',
    city: 'Abuja (FCT)',
    state: 'Federal Capital Territory',
    postalCode: '900271',
    isDefault: true
  },
  {
    id: 'addr-lagos-2',
    fullName: 'Amina Bello',
    phone: '+234 803 123 4567',
    street: 'Plot 4, Admiralty Way',
    area: 'Lekki Phase 1',
    city: 'Lagos',
    state: 'Lagos State',
    postalCode: '101233',
    isDefault: false
  }
];

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
    logout
  } = useApp();

  // Saved Addresses State with LocalStorage persistence
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>(() => {
    try {
      const saved = localStorage.getItem('desla_saved_addresses');
      return saved ? JSON.parse(saved) : initialSavedAddresses;
    } catch {
      return initialSavedAddresses;
    }
  });

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    street: '',
    area: '',
    city: 'Abuja (FCT)',
    state: 'Federal Capital Territory',
    postalCode: '',
    isDefault: false
  });

  const persistAddresses = (newList: SavedAddress[]) => {
    setSavedAddresses(newList);
    try {
      localStorage.setItem('desla_saved_addresses', JSON.stringify(newList));
    } catch (e) {
      console.warn('Failed to save addresses to localStorage', e);
    }
  };

  const activeDefaultAddress = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];

  const handleSetDefaultAddress = (id: string) => {
    const updated = savedAddresses.map((a) => ({
      ...a,
      isDefault: a.id === id
    }));
    persistAddresses(updated);
  };

  const handleDeleteAddress = (id: string) => {
    if (savedAddresses.length <= 1) {
      alert('You must retain at least one saved delivery address.');
      return;
    }
    const filtered = savedAddresses.filter((a) => a.id !== id);
    if (!filtered.some((a) => a.isDefault) && filtered.length > 0) {
      filtered[0].isDefault = true;
    }
    persistAddresses(filtered);
  };

  const handleOpenAddForm = () => {
    setIsAddingNewAddress(true);
    setAddressForm({
      fullName: authUser?.email ? 'Amina Bello' : userProfile.name,
      phone: userProfile.phone || '+234 814 812 0642',
      street: '',
      area: selectedCity || 'Maitama',
      city: selectedCity === 'Lagos' ? 'Lagos' : 'Abuja (FCT)',
      state: selectedCity === 'Lagos' ? 'Lagos State' : 'Federal Capital Territory',
      postalCode: '',
      isDefault: savedAddresses.length === 0
    });
  };

  const handleSaveAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.street.trim() || !addressForm.fullName.trim()) {
      alert('Please provide recipient name and street address.');
      return;
    }

    const newAddr: SavedAddress = {
      id: 'addr-' + Date.now(),
      ...addressForm
    };

    let updated: SavedAddress[];
    if (addressForm.isDefault) {
      updated = [...savedAddresses.map((a) => ({ ...a, isDefault: false })), newAddr];
    } else {
      updated = [...savedAddresses, newAddr];
    }

    persistAddresses(updated);
    setIsAddingNewAddress(false);
  };

  // Wishlist products
  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));
  const displayWishlist = wishlistedProducts.length > 0 ? wishlistedProducts.slice(0, 5) : products.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0F0F10] pb-28 font-body selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      {/* Main Fluid 2-Column Responsive Dashboard Grid */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: USER PROFILE & SETTINGS (4 Columns — Sticky on Desktop) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            {/* User Profile Card */}
            <div className="p-6 rounded-2xl bg-white/90 backdrop-blur-xl border border-[#E5E7EB] shadow-xs space-y-4 text-center relative overflow-hidden">
              <div className="relative w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-[#D4AF37] shadow-sm">
                <img
                  src={userProfile.avatar}
                  alt={userProfile.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="relative z-10 space-y-1">
                <h3 className="font-heading font-extrabold text-xl text-[#0F0F10]">
                  {authUser?.email ? 'Amina Bello' : userProfile.name}
                </h3>
                
                <p className="text-xs text-[#997A2E] font-medium tracking-wide">
                  Gold Tier Member • Verified Customer
                </p>

                <p className="text-xs text-[#6B7280] mt-1 font-mono">{authUser?.email || 'amina.bello@example.com'}</p>
                <p className="text-xs text-[#6B7280] font-mono">{userProfile.phone}</p>

                {/* Direct Partner Portal Shortcuts */}
                {authUser?.roles?.some((r) => ['STAFF', 'ADMIN', 'SUPER_ADMIN'].includes(r)) && (
                  <div className="pt-2">
                    <button
                      onClick={() => navigateTo('admin-console')}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#0F0F10] hover:bg-black text-[#D4AF37] border border-[#D4AF37]/40 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <ShieldCheck size={14} className="text-[#D4AF37]" />
                      <span>Admin Operations Console</span>
                    </button>
                  </div>
                )}
                {authUser?.roles?.includes('CREATOR') && (
                  <div className="pt-1">
                    <button
                      onClick={() => navigateTo('creators')}
                      className="w-full px-3.5 py-1.5 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] hover:border-[#D4AF37] text-xs font-bold text-[#0F0F10] transition-all cursor-pointer"
                    >
                      Creator Studio
                    </button>
                  </div>
                )}
                {authUser?.roles?.includes('DISTRIBUTOR') && (
                  <div className="pt-1">
                    <button
                      onClick={() => navigateTo('distributor-portal')}
                      className="w-full px-3.5 py-1.5 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] hover:border-[#D4AF37] text-xs font-bold text-[#0F0F10] transition-all cursor-pointer"
                    >
                      Distributor Hub
                    </button>
                  </div>
                )}

                {/* Understated Sign Out or Sign In action */}
                <div className="pt-1.5">
                  {authUser ? (
                    <button
                      onClick={() => logout()}
                      className="text-xs text-[#6B7280] hover:text-red-600 underline font-medium cursor-pointer transition-colors"
                    >
                      Sign Out
                    </button>
                  ) : (
                    <button
                      onClick={() => navigateTo('login')}
                      className="w-full py-2 rounded-xl bg-[#0F0F10] hover:bg-black text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                      Sign In to Account
                    </button>
                  )}
                </div>
              </div>

              {/* Desla Club Loyalty Points */}
              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] flex items-center justify-between text-left relative z-10">
                <div>
                  <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block font-semibold">
                    Desla Club Loyalty
                  </span>
                  <span className="font-mono font-extrabold text-xl text-[#0F0F10] block">
                    {(userProfile.points || 0).toLocaleString()} Points
                  </span>
                </div>
                <button
                  onClick={() => navigateTo('rewards')}
                  className="px-3.5 py-1.5 rounded-full bg-[#0F0F10] text-[#D4AF37] hover:bg-black font-heading font-bold text-xs active:scale-[0.97] transition-all cursor-pointer shadow-xs border border-[#D4AF37]/30"
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
              <div className="pt-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-[10.5px] text-[#6B7280] uppercase tracking-wider block font-semibold">
                    Saved Addresses
                  </span>
                  <span className="font-heading font-bold text-xs text-[#0F0F10] block mt-0.5">
                    {savedAddresses.length} Active Delivery {savedAddresses.length === 1 ? 'Address' : 'Addresses'}
                  </span>
                  {activeDefaultAddress && (
                    <p className="text-[11px] text-[#6B7280] mt-0.5 truncate">
                      <strong className="text-[#997A2E] font-medium">[Main]</strong> {activeDefaultAddress.street}, {activeDefaultAddress.area}, {activeDefaultAddress.city}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setIsAddressModalOpen(true)}
                  className="px-3 py-1 rounded-lg bg-[#FAF9F6] hover:bg-[#F3EEE3] border border-[#E5E7EB] text-xs font-heading font-bold text-[#0F0F10] hover:text-[#997A2E] cursor-pointer transition-colors shrink-0"
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
                    <ShieldCheck size={16} className="text-[#D4AF37]" />
                    <span>Desla AI Concierge &amp; Support</span>
                  </div>
                  <ChevronRight size={15} className="text-[#6B7280]" />
                </button>

                <a
                  href="https://wa.me/2348148120642?text=Hello%20Desla%20VIP%20Concierge,%20I%20am%20contacting%20you%20regarding%20my%20account."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#FAF9F6] hover:bg-[#F3EEE3] border border-[#E5E7EB] text-left text-xs font-heading font-bold text-[#0F0F10] flex items-center justify-between active:scale-[0.97] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <MessageCircle size={15} className="text-[#D4AF37]" />
                    <span>WhatsApp VIP Concierge</span>
                  </div>
                  <ExternalLink size={13} className="text-[#6B7280]" />
                </a>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: CUSTOMER ACTIVITY & INTELLIGENCE (8 Columns) */}
          <div className="lg:col-span-8 space-y-8">
            {/* 1. Active Orders & Regional Sourcing Tracker (Preserved intact) */}
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
              <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#0F0F10]">
                      Order #DES-98214 — Out for Delivery ({selectedCity} Hub)
                    </span>
                  </div>
                  <span className="font-mono text-xs text-[#997A2E] font-medium self-start sm:self-auto">
                    Arriving Today • Est. 4:30 PM
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="w-full bg-[#E5E7EB] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#D4AF37] h-full w-3/4 rounded-full transition-all duration-500" />
                  </div>
                  <div className="flex justify-between text-[11px] text-[#6B7280] font-medium">
                    <span>Compounded</span>
                    <span>Quality Verified</span>
                    <span className="text-[#0F0F10] font-bold">In Local Transit</span>
                    <span>Delivered</span>
                  </div>
                </div>

                {/* Quick actions for active order */}
                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-[#6B7280]">
                    Courier Partner: <strong className="text-[#0F0F10]">Wuse Express Courier</strong>
                  </span>
                  <button
                    onClick={() => navigateTo('orders')}
                    className="font-heading font-bold text-[#0F0F10] hover:text-[#997A2E] underline cursor-pointer"
                  >
                    Live Telemetry →
                  </button>
                </div>
              </div>
            </section>

            {/* 2. Personalized Vouchers & Rewards */}
            <section className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FBF5E8] flex items-center justify-center text-[#997A2E]">
                    <Award size={18} />
                  </div>
                  <div>
                    <h2 className="font-heading font-extrabold text-base text-[#0F0F10]">
                      Active Vouchers &amp; VIP Perks
                    </h2>
                    <span className="text-xs text-[#6B7280]">
                      Earned discounts and promotional credits
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => navigateTo('rewards')}
                  className="text-xs font-heading font-bold text-[#997A2E] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Reward Center</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Voucher 1 */}
                <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] space-y-2 relative overflow-hidden group hover:border-[#D4AF37] transition-colors">
                  <div className="flex justify-between items-start">
                    <span className="font-heading font-extrabold text-base text-[#0F0F10]">
                      ₦5,000 Off Full Routine
                    </span>
                    <span className="text-[11px] font-mono font-bold text-[#997A2E]">
                      Gold Tier
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7280]">
                    Applicable on any order above ₦40,000 across skincare &amp; body care categories.
                  </p>
                  <div className="pt-2 flex items-center justify-between text-[11px]">
                    <span className="text-[#A19B96] font-mono">Code: DESLA-GOLD-5K</span>
                    <span className="text-[#0F0F10] font-bold">Expires in 6 days</span>
                  </div>
                </div>

                {/* Voucher 2 */}
                <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] space-y-2 relative overflow-hidden group hover:border-[#D4AF37] transition-colors">
                  <div className="flex justify-between items-start">
                    <span className="font-heading font-extrabold text-base text-[#0F0F10]">
                      Complimentary Local Courier
                    </span>
                    <span className="text-[11px] font-mono font-bold text-[#0F0F10]">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7280]">
                    Zero-cost express dispatch to your Maitama address automatically applied.
                  </p>
                  <div className="pt-2 flex items-center justify-between text-[11px]">
                    <span className="text-[#A19B96] font-mono">Auto-applied at checkout</span>
                    <span className="text-[#0F0F10] font-bold">No Expiry</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. AI Skin Dossier Snapshot */}
            <section className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FBF5E8] flex items-center justify-center text-[#997A2E]">
                    <Activity size={18} />
                  </div>
                  <div>
                    <h2 className="font-heading font-extrabold text-base text-[#0F0F10]">
                      Personalized AI Diagnostic Dossier
                    </h2>
                    <span className="text-xs text-[#6B7280]">
                      Optical biomarker analysis &amp; barrier index
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => navigateTo('ai-scan')}
                  className="text-xs font-heading font-bold text-[#997A2E] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Re-scan Face</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-sm text-[#0F0F10]">
                      Skin Diagnostic Profile: Combination • Melanin Type V
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7280]">
                    Barrier Health Index: <strong className="text-emerald-700 font-mono">88/100 (Optimal)</strong> • Primary Focus: Post-inflammatory hyperpigmentation prevention.
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

      {/* Saved Delivery Address Manager Modal */}
      {isAddressModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => {
            setIsAddressModalOpen(false);
            setIsAddingNewAddress(false);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E5E7EB] p-6 max-h-[88vh] overflow-y-auto space-y-5 animate-in zoom-in-95 font-body"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div>
                <h3 className="font-heading font-extrabold text-lg text-[#0F0F10]">
                  Saved Delivery Addresses
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Manage delivery destinations &amp; set your primary dispatch hub.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddressModalOpen(false);
                  setIsAddingNewAddress(false);
                }}
                className="p-1.5 rounded-full text-[#6B7280] hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Address List */}
            <div className="space-y-3">
              {savedAddresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    addr.isDefault
                      ? 'border-[#D4AF37] bg-[#FAF9F6] shadow-2xs'
                      : 'border-[#E5E7EB] bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-heading font-bold text-sm text-[#0F0F10]">
                          {addr.fullName}
                        </span>
                        {addr.isDefault ? (
                          <span className="px-2 py-0.5 rounded-full bg-[#0F0F10] text-[#D4AF37] text-[10px] font-mono font-bold tracking-tight">
                            ★ Main Address
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="text-[10.5px] font-mono text-[#997A2E] hover:underline font-bold cursor-pointer"
                          >
                            Set as Main Address
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-[#4B5563] leading-relaxed">
                        {addr.street}, {addr.area}, {addr.city}, {addr.state} {addr.postalCode && `(${addr.postalCode})`}
                      </p>
                      <p className="text-[11px] font-mono text-[#6B7280]">
                        Phone: {addr.phone}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete Address"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Address Form / Trigger */}
            <div className="pt-2 border-t border-[#E5E7EB]">
              {!isAddingNewAddress ? (
                <button
                  onClick={handleOpenAddForm}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-[#FAF9F6] hover:bg-[#F3EEE3]/60 border border-[#E5E7EB] cursor-pointer transition-colors text-xs font-heading font-bold text-[#0F0F10]"
                >
                  <Plus size={16} className="text-[#D4AF37]" />
                  <span>+ Add New Delivery Address</span>
                </button>
              ) : (
                <form onSubmit={handleSaveAddressSubmit} className="space-y-3.5 p-4 rounded-2xl bg-[#FAF9F6]/60 border border-[#E5E7EB]">
                  <div className="flex items-center justify-between pb-1 border-b border-[#E5E7EB]">
                    <span className="text-xs font-heading font-bold text-[#0F0F10]">
                      New Delivery Location
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewAddress(false)}
                      className="text-xs text-[#6B7280] hover:text-black cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">
                        Full Name / Recipient
                      </label>
                      <input
                        type="text"
                        value={addressForm.fullName}
                        onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                        required
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#0F0F10] focus:outline-none focus:border-[#D4AF37]"
                        placeholder="e.g. Amina Bello"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                        required
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#0F0F10] focus:outline-none focus:border-[#D4AF37]"
                        placeholder="+234 814 812 0642"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={addressForm.street}
                      onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#0F0F10] focus:outline-none focus:border-[#D4AF37]"
                      placeholder="House / Flat No., Street Name, Landmark"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">
                        Area / District
                      </label>
                      <input
                        type="text"
                        value={addressForm.area}
                        onChange={(e) => setAddressForm({ ...addressForm, area: e.target.value })}
                        required
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#0F0F10] focus:outline-none focus:border-[#D4AF37]"
                        placeholder="Maitama / Wuse 2"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        required
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#0F0F10] focus:outline-none focus:border-[#D4AF37]"
                        placeholder="Abuja / Lagos"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        required
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#0F0F10] focus:outline-none focus:border-[#D4AF37]"
                        placeholder="FCT / Lagos State"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="isDefaultCheck"
                      checked={addressForm.isDefault}
                      onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                      className="rounded accent-[#D4AF37] cursor-pointer"
                    />
                    <label htmlFor="isDefaultCheck" className="text-xs text-[#4B5563] cursor-pointer">
                      Set as my main / default delivery address
                    </label>
                  </div>

                  <div className="flex justify-end gap-2.5 pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#0F0F10] hover:bg-black text-[#D4AF37] font-heading font-bold text-xs active:scale-95 transition-all cursor-pointer shadow-xs"
                    >
                      Save Address
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
