import React, { useState } from 'react';
import {
  ChevronLeft,
  Store,
  Package,
  TrendingUp,
  Plus,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  Phone,
  MapPin,
  Truck,
  DollarSign,
  Users,
  BarChart3,
  Calendar,
  Search,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ScreenDistributorPortal: React.FC = () => {
  const { goBack, products, registerDistributor, selectedCity } = useApp();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'orders' | 'wholesale' | 'register'>('dashboard');

  // Registration Form State
  const [formName, setFormName] = useState('');
  const [formBusiness, setFormBusiness] = useState('');
  const [formCity, setFormCity] = useState(selectedCity || 'Abuja');
  const [formAddress, setFormAddress] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formTier, setFormTier] = useState<'Bronze' | 'Silver' | 'Gold'>('Silver');
  const [formIsOnline, setFormIsOnline] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Orders State with interactive update
  const [orders, setOrders] = useState([
    {
      id: 'ORD-ABJ-8912',
      customer: 'Khadija Sanusi',
      items: 'DES-BO-01 Radiant Glow Oil (100ml) × 2',
      totalNgn: 48000,
      deliveryAddress: 'Wuse 2, Abuja',
      method: 'Express Local Bike',
      status: 'Ready for Pickup',
      time: '25 mins ago'
    },
    {
      id: 'ORD-ABJ-8904',
      customer: 'Emeka Nwosu',
      items: 'DES-SS-01 Sun Defense SPF50+ × 1, Royal Amber × 1',
      totalNgn: 39500,
      deliveryAddress: 'Maitama, Abuja',
      method: 'Same-Day Local Bike',
      status: 'Out for Delivery',
      time: '1 hour ago'
    },
    {
      id: 'ORD-ABJ-8879',
      customer: 'Zainab Aliyu',
      items: 'DES-BB-01 Whipped Shea Butter (200ml) × 1',
      totalNgn: 24000,
      deliveryAddress: 'Gwarinpa, Abuja',
      method: 'Hub Walk-In Pickup',
      status: 'Fulfilled',
      time: '3 hours ago'
    },
    {
      id: 'ORD-ABJ-8851',
      customer: 'Dr. Tunde Adeleke',
      items: 'DES-PF-01 Extrait de Parfum (50ml) × 1',
      totalNgn: 42000,
      deliveryAddress: 'Asokoro, Abuja',
      method: 'Same-Day Local Bike',
      status: 'Fulfilled',
      time: 'Yesterday'
    }
  ]);

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPhone) return;

    registerDistributor({
      name: formName,
      businessName: formBusiness || `${formName} Luxury Beauty`,
      city: formCity,
      state: formCity === 'Abuja' ? 'FCT' : 'State Hub',
      address: formAddress || 'Storefront Address Pending Physical Audit',
      phone: formPhone,
      whatsapp: formPhone.replace(/\D/g, ''),
      tier: formTier,
      isOnlineOnly: formIsOnline,
      pickupAvailable: !formIsOnline,
      operatingHours: 'Mon - Sat (9:00 AM - 6:00 PM)',
      stockedSkus: ['DES-BO-01-100ML', 'DES-BB-01-200ML', 'DES-PO-01-10ML']
    });

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setActiveTab('dashboard');
    }, 2000);
  };

  const handleUpdateOrderStatus = (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const nextStatus =
            ord.status === 'Ready for Pickup'
              ? 'Out for Delivery'
              : ord.status === 'Out for Delivery'
              ? 'Fulfilled'
              : 'Fulfilled';
          return { ...ord, status: nextStatus };
        }
        return ord;
      })
    );
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0F0F10] pb-24 font-body selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      {/* Top Header (Mobile/Tablet Only — Hidden on Desktop) */}
      <header className="lg:hidden sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] px-4 lg:px-8 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={goBack}
              className="p-2 -ml-2 rounded-full text-[#0F0F10] hover:bg-gray-100 active-press transition-colors cursor-pointer"
              aria-label="Go back"
            >
              <ChevronLeft size={22} strokeWidth={2} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-[#D4AF37]" />
                <h1 className="font-heading font-extrabold text-base lg:text-xl text-[#0F0F10] tracking-tight">
                  Distributor Operations Portal
                </h1>
              </div>
              <p className="text-xs text-[#6B7280]">
                Live city inventory, same-day order routing &amp; Lagos HQ wholesale desk
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FBF5E8] border border-[#D4AF37]/40 text-[#997A2E] text-xs font-mono font-bold">
              <MapPin size={12} className="text-[#D4AF37]" />
              <span>{selectedCity} Hub Active</span>
            </span>
            <button
              onClick={() => setActiveTab('wholesale')}
              className="px-4 py-2 rounded-full bg-[#0F0F10] text-white hover:bg-[#D4AF37] hover:text-[#0F0F10] font-heading font-bold text-xs active-press transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Restock Cartons</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-6 space-y-6">
        {/* Desktop Header Greeting */}
        <div className="hidden lg:flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
              Regional Partner Network
            </span>
            <h1 className="font-heading font-extrabold text-2xl text-[#0F0F10] tracking-tight">
              Welcome Back, Authorized Partner
            </h1>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Live city inventory, same-day order routing &amp; Lagos HQ wholesale desk
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FBF5E8] border border-[#D4AF37]/40 text-[#997A2E] text-xs font-mono font-bold">
              <MapPin size={12} className="text-[#D4AF37]" />
              <span>{selectedCity} Hub Active</span>
            </span>
            <button
              onClick={() => setActiveTab('wholesale')}
              className="px-4 py-2 rounded-full bg-[#0F0F10] text-white hover:bg-[#D4AF37] hover:text-[#0F0F10] font-heading font-bold text-xs active-press transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Restock Cartons</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-full text-xs font-heading font-semibold whitespace-nowrap active-press transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-[#0F0F10] text-white font-bold shadow-xs'
                : 'bg-white text-[#6B7280] hover:text-[#0F0F10] border border-[#E5E7EB]'
            }`}
          >
            Operations Dashboard
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-full text-xs font-heading font-semibold whitespace-nowrap active-press transition-all cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-[#0F0F10] text-white font-bold shadow-xs'
                : 'bg-white text-[#6B7280] hover:text-[#0F0F10] border border-[#E5E7EB]'
            }`}
          >
            City Stock Allocation ({products.length} SKUs)
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-full text-xs font-heading font-semibold whitespace-nowrap active-press transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-[#0F0F10] text-white font-bold shadow-xs'
                : 'bg-white text-[#6B7280] hover:text-[#0F0F10] border border-[#E5E7EB]'
            }`}
          >
            Local Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('wholesale')}
            className={`px-4 py-2 rounded-full text-xs font-heading font-semibold whitespace-nowrap active-press transition-all cursor-pointer ${
              activeTab === 'wholesale'
                ? 'bg-[#0F0F10] text-white font-bold shadow-xs'
                : 'bg-white text-[#6B7280] hover:text-[#0F0F10] border border-[#E5E7EB]'
            }`}
          >
            Wholesale Restock HQ
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`px-4 py-2 rounded-full text-xs font-heading font-semibold whitespace-nowrap active-press transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-[#0F0F10] text-white font-bold shadow-xs'
                : 'bg-white text-[#6B7280] hover:text-[#0F0F10] border border-[#E5E7EB]'
            }`}
          >
            + Register New City Hub
          </button>
        </div>

        {/* TAB 1: OPERATIONS DASHBOARD (Reverse-Engineered from Images 2 & 3) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Header Greeting & Date Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-heading font-extrabold text-xl lg:text-2xl text-[#0F0F10]">
                  Welcome Back, {selectedCity} Hub Director
                </h2>
                <p className="text-xs text-[#6B7280]">
                  Here is real-time fulfillment intelligence for your regional territory.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E5E7EB] text-xs font-mono text-[#6B7280] shadow-xs">
                <Calendar size={13} className="text-[#D4AF37]" />
                <span>Today: Same-Day Dispatch Active</span>
              </div>
            </div>

            {/* 4 Top KPI Stat Metric Cards (Image 3 Inspiration) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#6B7280]">Regional Revenue</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                    ↑ 18.4%
                  </span>
                </div>
                <span className="font-mono font-extrabold text-2xl text-[#0F0F10] block">
                  ₦8,450,000
                </span>
                <span className="text-[11px] text-[#6B7280]">
                  Generated in {selectedCity}
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#6B7280]">Active Client Base</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                    ↑ 12%
                  </span>
                </div>
                <span className="font-mono font-extrabold text-2xl text-[#0F0F10] block">
                  420
                </span>
                <span className="text-[11px] text-[#6B7280]">
                  Local beauty buyers
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#6B7280]">Local Dispatches</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#FBF5E8] text-[#997A2E] text-[10px] font-bold">
                    4 Riders Active
                  </span>
                </div>
                <span className="font-mono font-extrabold text-2xl text-[#0F0F10] block">
                  84
                </span>
                <span className="text-[11px] text-[#6B7280]">
                  Same-day orders this week
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#D4AF37]/30 shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#997A2E]">Stock Availability</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                    Healthy
                  </span>
                </div>
                <span className="font-mono font-extrabold text-2xl text-[#0F0F10] block">
                  340 Units
                </span>
                <span className="text-[11px] text-[#6B7280]">
                  28 Master cartons in warehouse
                </span>
              </div>
            </div>

            {/* Middle Section: Golden Area Chart & Restock Desk */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Sales Overview Area Chart (8 cols) */}
              <div className="lg:col-span-8 p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-extrabold text-base text-[#0F0F10]">
                      Regional Order Demand &amp; Revenue Velocity
                    </h3>
                    <p className="text-xs text-[#6B7280]">
                      Weekly trends for same-day local delivery vs. store pickup in {selectedCity}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#997A2E] bg-[#FAF9F6] px-3 py-1 rounded-full border border-[#E5E7EB]">
                    Last 7 Days
                  </span>
                </div>

                {/* SVG Area Chart Graphic */}
                <div className="relative w-full h-56 pt-4">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="goldAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines */}
                    <line x1="0" y1="30" x2="500" y2="30" stroke="#F3F4F6" strokeDasharray="3,3" />
                    <line x1="0" y1="80" x2="500" y2="80" stroke="#F3F4F6" strokeDasharray="3,3" />
                    <line x1="0" y1="130" x2="500" y2="130" stroke="#F3F4F6" strokeDasharray="3,3" />

                    {/* Gradient Fill Area */}
                    <path
                      d="M 0 140 Q 60 110 120 120 T 240 70 T 360 85 T 500 25 L 500 180 L 0 180 Z"
                      fill="url(#goldAreaGrad)"
                    />

                    {/* Top Smooth Curve Line */}
                    <path
                      d="M 0 140 Q 60 110 120 120 T 240 70 T 360 85 T 500 25"
                      fill="none"
                      stroke="#D4AF37"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Interactive Data Point Dots */}
                    <circle cx="120" cy="120" r="5" fill="#0F0F10" stroke="#D4AF37" strokeWidth="2.5" />
                    <circle cx="240" cy="70" r="5" fill="#0F0F10" stroke="#D4AF37" strokeWidth="2.5" />
                    <circle cx="360" cy="85" r="5" fill="#0F0F10" stroke="#D4AF37" strokeWidth="2.5" />
                    <circle cx="500" cy="25" r="6" fill="#D4AF37" stroke="#0F0F10" strokeWidth="2.5" />
                  </svg>

                  {/* Day Labels */}
                  <div className="flex items-center justify-between text-[11px] text-[#6B7280] font-mono pt-3 border-t border-[#E5E7EB]">
                    <span>Mon (₦920k)</span>
                    <span>Tue (₦1.1M)</span>
                    <span>Wed (₦1.4M)</span>
                    <span>Thu (₦1.2M)</span>
                    <span>Fri (₦1.6M)</span>
                    <span className="font-bold text-[#0F0F10]">Sat (₦2.2M)</span>
                  </div>
                </div>
              </div>

              {/* Wholesale Quick Card (4 cols) */}
              <div className="lg:col-span-4 p-6 rounded-2xl bg-white border border-[#D4AF37]/30 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-[#D4AF37]" />
                  <h3 className="font-heading font-extrabold text-base text-[#0F0F10]">
                    Lagos HQ Restock Desk
                  </h3>
                </div>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Restock master cartons directly from the Lagos Central Formulation Lab with your authorized distributor tier discount.
                </p>

                <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[#6B7280]">Your Tier:</span>
                    <span className="font-mono font-bold text-[#0F0F10]">Silver Partner (32% Margin)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#6B7280]">Carton Threshold:</span>
                    <span className="font-mono font-bold text-[#0F0F10]">24 units / carton</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#6B7280]">HQ Lead Time:</span>
                    <span className="font-mono font-bold text-emerald-700">Priority 48-Hour Dispatch</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('wholesale')}
                  className="w-full py-3 rounded-full bg-[#0F0F10] text-white hover:bg-[#D4AF37] hover:text-[#0F0F10] font-heading font-bold text-xs active-press transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Open Wholesale Desk</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Bottom Section: Recent Orders Table (Image 3 Inspiration) */}
            <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-heading font-extrabold text-base text-[#0F0F10]">
                    Recent Local Orders &amp; City Dispatches
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Orders routed to your facility to prevent ₦5,000 interstate courier fees
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-heading font-bold text-[#997A2E] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View All {orders.length} Orders</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] text-[#6B7280] font-mono">
                      <th className="pb-3 font-semibold">Order ID</th>
                      <th className="pb-3 font-semibold">Customer &amp; Location</th>
                      <th className="pb-3 font-semibold">Formulation Items</th>
                      <th className="pb-3 font-semibold">Amount</th>
                      <th className="pb-3 font-semibold">Method</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]/60">
                    {orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-[#FAF9F6] transition-colors">
                        <td className="py-3.5 font-mono font-bold text-[#0F0F10]">{ord.id}</td>
                        <td className="py-3.5">
                          <span className="font-bold text-[#0F0F10] block">{ord.customer}</span>
                          <span className="text-[11px] text-[#6B7280]">{ord.deliveryAddress}</span>
                        </td>
                        <td className="py-3.5 text-[#4B5563] max-w-xs truncate">{ord.items}</td>
                        <td className="py-3.5 font-mono font-bold text-[#0F0F10]">
                          ₦{ord.totalNgn.toLocaleString()}
                        </td>
                        <td className="py-3.5 text-[11px] text-[#6B7280]">
                          <span className="inline-flex items-center gap-1">
                            <Truck size={12} className="text-[#D4AF37]" />
                            <span>{ord.method}</span>
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              ord.status === 'Fulfilled'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : ord.status === 'Out for Delivery'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-[#FBF5E8] text-[#997A2E] border border-[#D4AF37]/40'
                            }`}
                          >
                            {ord.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.id)}
                            className="px-3 py-1 rounded-full bg-white border border-[#E5E7EB] hover:border-[#D4AF37] text-[11px] font-bold text-[#0F0F10] active-press transition-colors cursor-pointer"
                          >
                            {ord.status === 'Fulfilled' ? 'Completed ✓' : 'Update Status'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INVENTORY ALLOCATION */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div>
                <h3 className="font-heading font-extrabold text-base text-[#0F0F10]">
                  {selectedCity} Regional Inventory Roster
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Real-time bottles and cartons assigned to your local facility for client dispatch
                </p>
              </div>
              <button
                onClick={() => setActiveTab('wholesale')}
                className="px-4 py-2 rounded-full bg-[#0F0F10] text-white hover:bg-[#D4AF37] hover:text-[#0F0F10] font-heading font-bold text-xs active-press transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Request Case Restock</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="p-4 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#D4AF37]/50 shadow-xs hover:shadow-md transition-all flex items-center gap-3.5"
                >
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="w-16 h-16 rounded-xl object-cover bg-[#FAF9F6] border border-[#E5E7EB] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-[9.5px] text-[#997A2E] font-bold block">
                      {prod.sku || 'DESLA-SKU'}
                    </span>
                    <h4 className="font-heading font-bold text-xs text-[#0F0F10] truncate">
                      {prod.name}
                    </h4>
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <span className="text-[#6B7280]">
                        Local Stock: <strong className="text-[#0F0F10] font-bold font-mono">24 units</strong>
                      </span>
                      <span className="font-mono font-bold text-[#0F0F10]">
                        ₦{prod.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: LOCAL ORDERS QUEUE */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs">
              <h3 className="font-heading font-extrabold text-base text-[#0F0F10]">
                Incoming Local Orders ({selectedCity} Territory)
              </h3>
              <p className="text-xs text-[#6B7280]">
                Fulfill local client orders within 2 hours to provide authentic same-day delivery.
              </p>
            </div>

            <div className="space-y-3">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-5 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#D4AF37]/40 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#997A2E]">
                        {ord.id}
                      </span>
                      <span className="text-xs text-[#6B7280]">• {ord.time}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ord.status === 'Fulfilled'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : ord.status === 'Out for Delivery'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-[#FBF5E8] text-[#997A2E] border border-[#D4AF37]/40'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>
                    <h4 className="font-heading font-bold text-sm text-[#0F0F10]">
                      {ord.customer}
                    </h4>
                    <p className="text-xs text-[#4B5563]">{ord.items}</p>
                    <span className="text-[11px] text-[#6B7280] block">
                      📍 {ord.deliveryAddress} • Method: <strong>{ord.method}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-4 self-end md:self-center">
                    <span className="font-mono font-bold text-base text-[#0F0F10]">
                      ₦{ord.totalNgn.toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleUpdateOrderStatus(ord.id)}
                      className="px-4 py-2 rounded-full bg-[#0F0F10] text-white hover:bg-[#D4AF37] hover:text-[#0F0F10] font-heading font-bold text-xs active-press transition-colors shadow-xs cursor-pointer"
                    >
                      {ord.status === 'Fulfilled' ? 'Marked Completed ✓' : 'Advance Order Stage'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: WHOLESALE RESTOCK HQ */}
        {activeTab === 'wholesale' && (
          <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-6">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
                Direct Laboratory Restock
              </span>
              <h3 className="font-heading font-extrabold text-xl text-[#0F0F10] mt-0.5">
                Wholesale Master Carton Orders from Lagos HQ
              </h3>
              <p className="text-xs text-[#6B7280] mt-1 max-w-xl">
                Restock minimum 1 master carton (24 units per SKU) directly from the Lagos Central Formulation Lab with your authorized distributor tier margin.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] space-y-2 shadow-xs">
                <span className="text-xs font-mono font-bold text-[#997A2E]">
                  Tier 1: Bronze Partner
                </span>
                <h4 className="font-heading font-extrabold text-base text-[#0F0F10]">
                  ₦250,000 Minimum
                </h4>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  25% wholesale margin. Designed for boutique salons and independent skincare clinics.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border-2 border-[#D4AF37] ring-1 ring-[#D4AF37]/20 space-y-2 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#997A2E]">
                    Tier 2: Silver Partner (Your Tier)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#FBF5E8] text-[#997A2E] text-[10px] font-bold">
                    Active
                  </span>
                </div>
                <h4 className="font-heading font-extrabold text-base text-[#0F0F10]">
                  ₦500,000 Minimum
                </h4>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  32% wholesale margin. Priority interstate dispatch and certified regional partner badge.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] space-y-2 shadow-xs">
                <span className="text-xs font-mono font-bold text-[#997A2E]">
                  Tier 3: Gold Regional Hub
                </span>
                <h4 className="font-heading font-extrabold text-base text-[#0F0F10]">
                  ₦1,000,000+ Minimum
                </h4>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  40% wholesale margin. Exclusive regional territory rights and co-branded PR gifting support.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-[#6B7280]">
                Questions on wholesale allocations? Contact Lagos HQ Concierge: 0903 045 6510
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => alert('Wholesale pro-forma invoice generated for Silver Tier (₦500,000)!')}
                  className="flex-1 sm:flex-initial py-3 px-5 rounded-full bg-white border border-[#E5E7EB] hover:border-[#D4AF37] text-[#0F0F10] font-heading font-extrabold text-xs active:scale-[0.97] transition-all shadow-xs cursor-pointer"
                >
                  Generate Wholesale Invoice
                </button>
                <button
                  onClick={() => alert('Wholesale carton replenishment request dispatched to Lagos HQ Labs!')}
                  className="flex-1 sm:flex-initial py-3 px-6 rounded-full bg-[#0F0F10] text-white hover:bg-[#D4AF37] hover:text-[#0F0F10] font-heading font-extrabold text-xs active:scale-[0.97] transition-all shadow-xs cursor-pointer"
                >
                  Place Bulk Restock Order
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: REGISTER NEW PARTNER HUB (Fixed inputs & contrast) */}
        {activeTab === 'register' && (
          <div className="max-w-xl mx-auto p-6 lg:p-8 rounded-2xl bg-white border border-[#E5E7EB] shadow-lg space-y-5">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
                Regional Expansion
              </span>
              <h3 className="font-heading font-extrabold text-xl text-[#0F0F10] mt-0.5">
                Apply to Become an Authorized Distributor
              </h3>
              <p className="text-xs text-[#6B7280] mt-1">
                Stock authentic Desla formulations in your city. Fulfill local client orders without interstate shipping delays.
              </p>
            </div>

            {isSubmitted ? (
              <div className="p-6 rounded-2xl bg-[#FBF5E8] border border-[#D4AF37]/40 text-center space-y-2">
                <CheckCircle2 size={32} className="text-[#997A2E] mx-auto" />
                <h4 className="font-heading font-extrabold text-base text-[#0F0F10]">
                  Application Submitted Successfully
                </h4>
                <p className="text-xs text-[#6B7280]">
                  Desla Lagos HQ has added your profile to the verification queue.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-[#0F0F10] font-semibold block mb-1">
                    Contact Person Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Halima Danjuma"
                    className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-xs text-[#0F0F10] placeholder-gray-400 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 shadow-xs"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#0F0F10] font-semibold block mb-1">
                    Store or Boutique Business Name
                  </label>
                  <input
                    type="text"
                    value={formBusiness}
                    onChange={(e) => setFormBusiness(e.target.value)}
                    placeholder="e.g. Aishah Luxury Beauty Hub"
                    className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-xs text-[#0F0F10] placeholder-gray-400 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#0F0F10] font-semibold block mb-1">
                      City *
                    </label>
                    <select
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-xs text-[#0F0F10] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 shadow-xs cursor-pointer"
                    >
                      <option value="Abuja">Abuja (FCT)</option>
                      <option value="Lagos">Lagos</option>
                      <option value="Port Harcourt">Port Harcourt</option>
                      <option value="Ibadan">Ibadan</option>
                      <option value="Kano">Kano</option>
                      <option value="Enugu">Enugu</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-[#0F0F10] font-semibold block mb-1">
                      Phone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="0814 812 0642"
                      className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-xs text-[#0F0F10] placeholder-gray-400 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[#0F0F10] font-semibold block mb-1">
                    Physical Store Address or Local Delivery Hub Address
                  </label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="e.g. Suite 12, Garki Mall, Area 11, Abuja"
                    className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-xs text-[#0F0F10] placeholder-gray-400 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 shadow-xs"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="onlineOnly"
                    checked={formIsOnline}
                    onChange={(e) => setFormIsOnline(e.target.checked)}
                    className="accent-[#D4AF37] w-4 h-4 rounded cursor-pointer"
                  />
                  <label htmlFor="onlineOnly" className="text-xs text-[#6B7280] cursor-pointer">
                    Online-only distributor (Express bike dispatch without walk-in retail store)
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-full bg-[#0F0F10] text-white hover:bg-[#D4AF37] hover:text-[#0F0F10] font-heading font-extrabold text-xs uppercase tracking-wider active-press transition-colors shadow-sm cursor-pointer mt-3"
                >
                  Submit Distributor Application
                </button>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
