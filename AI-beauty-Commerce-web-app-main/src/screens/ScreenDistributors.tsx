import React, { useState } from 'react';
import {
  ChevronLeft,
  MapPin,
  Store,
  Phone,
  MessageCircle,
  ShieldCheck,
  Star,
  Clock,
  Truck,
  ArrowRight,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supportedCities } from '../data/distributors';

export const ScreenDistributors: React.FC = () => {
  const {
    goBack,
    distributors,
    selectedCity,
    setSelectedCity,
    navigateTo,
    setSelectedCategory
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'store' | 'online'>('all');

  const cityDistributors = distributors.filter(
    (d) => d.city.toLowerCase() === selectedCity.toLowerCase()
  );

  const filteredDistributors = cityDistributors.filter((d) => {
    if (activeFilter === 'store') return !d.isOnlineOnly;
    if (activeFilter === 'online') return d.isOnlineOnly;
    return true;
  });

  const cityMeta = supportedCities.find(
    (c) => c.city.toLowerCase() === selectedCity.toLowerCase()
  );

  return (
    <div className="min-h-screen bg-white text-[#0F0F10] pb-24">
      {/* Top Header */}
      <div className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={goBack}
              className="p-2 -ml-2 rounded-full text-[#0F0F10] hover:bg-gray-100 active-press transition-colors"
              aria-label="Go back"
            >
              <ChevronLeft size={22} strokeWidth={2} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Store size={18} className="text-[#D4AF37]" />
                <h1 className="font-heading font-extrabold text-lg lg:text-xl text-[#0F0F10] tracking-tight">
                  Verified Local Distributors
                </h1>
              </div>
              <p className="text-xs text-[#6B7280]">
                Same-day dispatch &amp; pickup across Nigerian cities
              </p>
            </div>
          </div>

          <button
            onClick={() => navigateTo('distributor-portal')}
            className="px-4 py-2 rounded-full bg-[#0F0F10] text-white hover:bg-[#D4AF37] hover:text-[#0F0F10] font-heading font-extrabold text-xs active:scale-[0.97] transition-all cursor-pointer shadow-xs"
          >
            Become a Partner
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-6 space-y-6">
        {/* City Selector Ribbon */}
        <div className="p-4 lg:p-6 rounded-card bg-[#FAF9F6] border border-[#D4AF37]/25 shadow-float relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#997A2E] block">
                Local Sourcing Network
              </span>
              <h2 className="font-heading font-extrabold text-xl lg:text-2xl text-[#0F0F10] mt-0.5 tracking-tight">
                Current Location: <span className="text-[#997A2E] font-bold">{selectedCity}</span>
              </h2>
              <p className="text-xs text-[#6B7280] mt-1 max-w-xl">
                Sourcing from local distributors saves you up to ₦4,500 in interstate courier fees compared to dispatch from Lagos HQ, while providing same-day delivery or direct pickup.
              </p>
            </div>

            {/* City Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {supportedCities.map((item) => (
                <button
                  key={item.city}
                  onClick={() => setSelectedCity(item.city)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap active-press transition-all ${
                    selectedCity.toLowerCase() === item.city.toLowerCase()
                      ? 'bg-[#D4AF37] text-[#0F0F10] font-bold shadow-xs'
                      : 'bg-[#F6F5F2] text-[#6B7280] hover:text-[#0F0F10] border border-[#E5E7EB]'
                  }`}
                >
                  {item.city}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-4 pt-4 border-t border-[#E5E7EB] grid grid-cols-3 gap-4 text-center">
            <div>
              <span className="text-[10.5px] text-[#6B7280] uppercase tracking-wider block">
                Local Partners
              </span>
              <span className="font-mono font-bold text-sm text-[#0F0F10]">
                {filteredDistributors.length} Verified
              </span>
            </div>
            <div>
              <span className="text-[10.5px] text-[#6B7280] uppercase tracking-wider block">
                Estimated Delivery
              </span>
              <span className="font-mono font-bold text-base text-[#0F0F10]">
                {cityMeta?.estimatedDeliveryHours || '2-4 Hours'}
              </span>
            </div>
            <div>
              <span className="text-[10.5px] text-[#6B7280] uppercase tracking-wider block">
                Local Courier Fee
              </span>
              <span className="font-mono font-bold text-sm text-[#D4AF37]">
                ₦{cityMeta?.localFee.toLocaleString() || '1,500'}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeFilter === 'all'
                  ? 'bg-[#D4AF37] text-black font-bold'
                  : 'bg-[#FAF9F6] text-[#6B7280] hover:text-[#0F0F10] border border-[#E5E7EB]'
              }`}
            >
              All Partners ({cityDistributors.length})
            </button>
            <button
              onClick={() => setActiveFilter('store')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeFilter === 'store'
                  ? 'bg-[#D4AF37] text-black font-bold'
                  : 'bg-[#FAF9F6] text-[#6B7280] hover:text-[#0F0F10] border border-[#E5E7EB]'
              }`}
            >
              Walk-in & Pickup
            </button>
            <button
              onClick={() => setActiveFilter('online')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeFilter === 'online'
                  ? 'bg-[#D4AF37] text-black font-bold'
                  : 'bg-[#FAF9F6] text-[#6B7280] hover:text-[#0F0F10] border border-[#E5E7EB]'
              }`}
            >
              Instant Courier Dispatch
            </button>
          </div>

          <span className="text-xs text-[#6B7280] hidden sm:inline">
            100% Genuine Laboratory Stock
          </span>
        </div>

        {/* Distributor Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {filteredDistributors.map((dist) => (
            <div
              key={dist.id}
              className="p-5 rounded-card bg-[#FAF9F6] border border-[#E5E7EB] hover:border-[#D4AF37]/50 shadow-soft transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-bold text-base text-[#0F0F10]">
                        {dist.name}
                      </h3>
                      {dist.verified && (
                        <ShieldCheck size={16} className="text-[#997A2E] shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-[#6B7280]">
                      {dist.businessName} • {dist.tier} Partner
                    </span>
                  </div>

                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F6F5F2] border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold">
                    <Star size={11} fill="currentColor" strokeWidth={0} />
                    <span>{dist.rating}</span>
                    <span className="text-[10px] text-[#6B7280]">({dist.reviewsCount})</span>
                  </div>
                </div>

                {/* Location & Details */}
                <div className="space-y-1.5 text-xs text-[#6B7280]">
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-[#D4AF37] shrink-0 mt-0.5" />
                    <span className="text-[#0F0F10]">{dist.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-[#6B7280] shrink-0" />
                    <span>{dist.operatingHours}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck size={14} className="text-[#997A2E] shrink-0" />
                    <span className="text-[#0F0F10] font-medium">
                      {dist.pickupAvailable ? 'Pickup & Local Courier Available' : 'Direct Courier Delivery Only'}
                    </span>
                  </div>
                </div>

                {/* Stocked SKUs Tag Cloud */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block mb-1.5">
                    Verified In Stock:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {dist.stockedSkus.map((sku) => (
                      <span
                        key={sku}
                        className="px-2 py-0.5 rounded-md bg-white border border-[#E5E7EB] text-[9.5px] font-mono font-bold text-[#0F0F10]"
                      >
                        {sku}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#E5E7EB] flex items-center gap-2">
                <a
                  href={`https://wa.me/${dist.whatsapp}?text=Hello%20${encodeURIComponent(dist.name)},%20I%20am%20contacting%20you%20from%20the%20Desla!%20Web%20App%20to%20order%20products%20in%20${selectedCity}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-heading font-bold text-xs flex items-center justify-center gap-1.5 active:scale-[0.97] transition-colors"
                >
                  <MessageCircle size={15} />
                  <span>WhatsApp Partner</span>
                </a>

                <a
                  href={`tel:${dist.phone}`}
                  className="py-2.5 px-3 rounded-btn bg-[#F6F5F2] border border-[#E5E7EB] text-[#0F0F10] hover:text-[#D4AF37] hover:border-[#D4AF37]/40 active-press transition-colors"
                  aria-label="Call partner"
                >
                  <Phone size={15} />
                </a>

                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    navigateTo('catalogue');
                  }}
                  className="py-2.5 px-4 rounded-btn bg-[#0F0F10] text-white font-heading font-bold text-xs flex items-center gap-1.5 active-press shadow-soft"
                >
                  <span>Shop Stock</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
