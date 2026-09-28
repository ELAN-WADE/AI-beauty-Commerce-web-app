import React, { useState } from 'react';
import {
  ArrowRight,
  Search,
  Flame,
  ChevronRight,
  Sparkles,
  MapPin,
  Store,
  Users,
  ShieldCheck,
  Award,
  Clock,
  HeartHandshake,
  Star,
  Package
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/common/ProductCard';
import { Header } from '../components/common/Header';
import { CartReminderBanner } from '../components/common/CartReminderBanner';

export const Screen03Home: React.FC = () => {
  const {
    products,
    navigateTo,
    setSelectedCategory,
    openCommunity,
    selectedCity,
    setIsLocationModalOpen,
    getDistributorsForCity
  } = useApp();

  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchStartX - touchEndX;
    if (deltaX > 75) {
      openCommunity();
    }
    setTouchStartX(null);
  };

  const localDistributors = getDistributorsForCity(selectedCity);
  const flashSaleProducts = products.filter((p) => p.isFlashSale || p.discountPercentage);
  const pickedForYou = products.slice(0, 4);
  const bodyCareProducts = products.filter((p) => p.category === 'Body Care');
  const fragranceProducts = products.filter((p) => p.category === 'Fragrance');

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug);
    navigateTo('catalogue');
  };

  // 2-Row Temu-Style Circular Categories Definition
  const circularCategoriesRow1 = [
    { name: 'Whipped Butters', slug: 'body-care', count: '3 SKUs', img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=240&q=80' },
    { name: 'Radiant Glow Oils', slug: 'body-care', count: '5 SKUs', img: 'https://images.unsplash.com/photo-1608248597359-0c679234b4c7?auto=format&fit=crop&w=240&q=80' },
    { name: 'Exfoliating Scrubs', slug: 'body-care', count: '2 SKUs', img: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=240&q=80' },
    { name: 'Nourishing Wash', slug: 'body-care', count: '4 SKUs', img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=240&q=80' },
    { name: 'Gentle Cleansers', slug: 'skincare', count: '3 SKUs', img: 'https://images.unsplash.com/photo-1556228722-d0b5b144675e?auto=format&fit=crop&w=240&q=80' },
    { name: 'Sun Defense SPF', slug: 'skincare', count: '2 SKUs', img: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=240&q=80' },
  ];

  const circularCategoriesRow2 = [
    { name: 'Perfume Oils', slug: 'fragrance', count: '5 SKUs', img: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=240&q=80' },
    { name: 'Eau de Parfum', slug: 'fragrance', count: '5 SKUs', img: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=240&q=80' },
    { name: 'Velvet Lip Glaze', slug: 'makeup', count: '10 Shades', img: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=240&q=80' },
    { name: 'Satin Lipsticks', slug: 'makeup', count: '10 Shades', img: 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?auto=format&fit=crop&w=240&q=80' },
    { name: 'Artisan Lashes', slug: 'makeup', count: '10 Styles', img: 'https://images.unsplash.com/photo-1583001809873-a128495da465?auto=format&fit=crop&w=240&q=80' },
    { name: 'Wellness Essentials', slug: 'lifestyle', count: 'Essential', img: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&w=240&q=80' },
  ];

  return (
    <div
      className="min-h-screen bg-white text-[#0F0F10] pb-28 select-none sm:select-auto"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 1. Mobile Header with Desla Brandmark & City Sourcing Indicator */}
      <Header />

      <main className="max-w-md mx-auto px-4 pt-2 space-y-5">
        {/* 2. Global Search Bar */}
        <section aria-label="Global Search">
          <div
            onClick={() => navigateTo('search')}
            className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-[#F6F5F2] border border-[#E5E7EB] shadow-xs cursor-pointer hover:border-[#D4AF37] active:scale-[0.99] transition-all"
          >
            <Search size={16} className="text-[#6B7280] shrink-0" strokeWidth={2.2} />
            <span className="text-xs text-[#6B7280] truncate flex-1 font-medium">
              Search body glow oils, perfumes, butters...
            </span>
          </div>
        </section>

        {/* 2.5 Cart Abandonment Alert Banner */}
        <CartReminderBanner />

        {/* 3. REVERSE-ENGINEERED @uiwiki.co HERO SECTION FOR MOBILE */}
        <section className="relative overflow-hidden rounded-3xl bg-[#FAF9F6] border border-[#E5E7EB] p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FBF5E8] border border-[#D4AF37]/30 text-[#997A2E] text-[10px] font-mono font-bold uppercase tracking-wider">
              <Sparkles size={11} className="text-[#D4AF37]" />
              <span>Clinical Haute Formulations</span>
            </span>
          </div>

          <div>
            <h1 className="font-heading font-semibold text-2xl text-[#0F0F10] tracking-tight leading-snug">
              Health Before Beauty. Intention Before Trend.
            </h1>
            <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
              Safe-conscious skincare, whipped butters &amp; extrait perfume oils crafted for melanin-rich skin. Stocked locally in {selectedCity}.
            </p>
          </div>

          {/* Organic Curved Container Framing Visual & Floating Metric Chips */}
          <div className="relative h-[220px] rounded-2xl overflow-hidden shadow-md border border-[#E5E7EB]">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
              alt="Desla Melanin Beauty"
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Floating Metric 1: 99% Barrier (Top Left) */}
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl shadow-md border border-[#E5E7EB] flex items-center gap-1.5">
              <span className="font-digit font-semibold text-xs text-[#0F0F10]">99%</span>
              <span className="text-[9.5px] font-medium text-[#6B7280]">Barrier Purity</span>
            </div>

            {/* Floating Metric 2: 4.8 Rating (Top Right) */}
            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl shadow-md border border-[#E5E7EB] flex items-center gap-1">
              <span className="font-digit font-semibold text-xs text-[#0F0F10]">4.8</span>
              <Star size={12} fill="#D4AF37" className="text-[#D4AF37]" />
              <span className="text-[9.5px] text-[#6B7280]">Nigeria</span>
            </div>

            {/* Floating Metric 3: 25K+ (Bottom Left) */}
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/40 shadow-sm flex items-center gap-1">
              <span className="font-digit font-semibold text-[10px] text-[#0F0F10]">25K+</span>
              <span className="text-[9px] text-[#6B7280]">Delivered in Lagos &amp; Abuja</span>
            </div>
          </div>

          {/* Primary Hero CTA */}
          <div className="pt-1">
            <button
              onClick={() => {
                setSelectedCategory('All');
                navigateTo('catalogue');
              }}
              className="w-full py-3 px-4 rounded-xl bg-[#0F0F10] hover:bg-[#D4AF37] text-white hover:text-[#0F0F10] font-heading font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              <span>Explore Formulations</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </section>

        {/* 3.5 DEDICATED ASK DESLA!™ AI CONCIERGE & PACKAGE TRACKING CARD */}
        <section
          onClick={() => navigateTo('ask-ai')}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0F0F10] to-[#1A1817] text-white border-2 border-[#D4AF37]/60 p-4 shadow-md cursor-pointer group active:scale-[0.98] transition-all"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FAF9F6] border border-[#D4AF37] text-[#D4AF37] flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles size={18} strokeWidth={2.4} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-heading font-bold text-xs text-white">
                    Ask Desla<span className="text-[#D4AF37]">!™</span> AI Concierge
                  </h4>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[10px] text-gray-300">
                  Track Package #DES-829104 or skincare advice
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#D4AF37] text-[#0F0F10] text-[10px] font-bold font-heading shrink-0 flex items-center gap-1">
              <span>Open</span>
              <ArrowRight size={11} />
            </span>
          </div>
        </section>

        {/* 4. LOCAL CITY FULFILLMENT & DISTRIBUTOR ROUTING BANNER */}
        <section className="relative overflow-hidden rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] p-3.5 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FBF5E8] text-[#997A2E] flex items-center justify-center shrink-0 mt-0.5 border border-[#D4AF37]/30">
                <MapPin size={16} strokeWidth={2.2} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-[#997A2E] uppercase tracking-wider font-bold">
                    Local Hub: {selectedCity}
                  </span>
                  <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-[#F3EEE3] text-[#0F0F10] font-semibold border border-[#E5E7EB]">
                    {localDistributors.length} Verified
                  </span>
                </div>
                <h4 className="text-xs font-heading font-bold text-[#0F0F10] mt-0.5">
                  Save ₦3,000+ on interstate courier delivery
                </h4>
                <p className="text-[11px] text-[#6B7280] leading-tight mt-0.5">
                  Direct same-day dispatch or store pickup available in {selectedCity}.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="text-[10px] font-bold text-[#0F0F10] bg-[#D4AF37] px-2.5 py-1.5 rounded-full hover:bg-[#F6E7C1] active:scale-95 shrink-0 transition-colors shadow-xs cursor-pointer"
            >
              Change
            </button>
          </div>

          <div className="mt-2.5 pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-[#6B7280]">
            <button
              onClick={() => navigateTo('distributors')}
              className="text-[#997A2E] hover:underline flex items-center gap-1 font-bold"
            >
              <Store size={12} />
              <span>Browse {selectedCity} Distributor Directory →</span>
            </button>
            <span className="text-[10px] text-gray-400">Lagos HQ Direct</span>
          </div>
        </section>

        {/* 5. TEMU-STYLE 2-ROW CIRCULAR CATEGORY RAIL */}
        <section aria-label="Shop by category" className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-sm text-[#0F0F10] font-bold">
              Collections &amp; Pillars
            </h3>
            <button
              onClick={() => navigateTo('categories')}
              className="text-xs text-[#997A2E] font-bold hover:underline flex items-center gap-0.5"
            >
              <span>Explore all</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Row 1 */}
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
            {circularCategoriesRow1.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => handleCategorySelect(cat.slug)}
                className="flex flex-col items-center gap-1 shrink-0 group active:scale-95 transition-all w-[70px]"
              >
                <div className="w-14 h-14 rounded-full p-0.5 border-2 border-transparent group-hover:border-[#D4AF37] transition-all bg-[#F6F5F2] shadow-xs">
                  <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                    <img
                      src={cat.img}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                </div>
                <span className="text-[10px] font-medium text-[#4B5563] group-hover:text-[#0F0F10] tracking-tight truncate w-full text-center">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>

          {/* Row 2 */}
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
            {circularCategoriesRow2.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => handleCategorySelect(cat.slug)}
                className="flex flex-col items-center gap-1 shrink-0 group active:scale-95 transition-all w-[70px]"
              >
                <div className="w-14 h-14 rounded-full p-0.5 border-2 border-transparent group-hover:border-[#D4AF37] transition-all bg-[#F6F5F2] shadow-xs">
                  <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                    <img
                      src={cat.img}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                </div>
                <span className="text-[10px] font-medium text-[#4B5563] group-hover:text-[#0F0F10] tracking-tight truncate w-full text-center">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* 6. Commercial Bestsellers (2-Column Grid) */}
        <section aria-label="Bestsellers">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Flame size={15} className="text-[#D4AF37]" />
              <h3 className="font-heading font-semibold text-sm text-[#0F0F10]">
                Best-Selling Formulations
              </h3>
            </div>
            <button
              onClick={() => {
                setSelectedCategory('All');
                navigateTo('catalogue');
              }}
              className="text-xs text-[#997A2E] font-bold hover:underline"
            >
              See all
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {pickedForYou.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* 7. Flagship Body Care Shelf (Horizontal Rail) */}
        <section aria-label="Body Care Shelf">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="font-heading font-semibold text-sm text-[#0F0F10]">
              Whipped Butters &amp; Oils
            </h3>
            <button
              onClick={() => handleCategorySelect('body-care')}
              className="text-xs text-[#997A2E] font-bold hover:underline"
            >
              View collection
            </button>
          </div>

          <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
            {bodyCareProducts.map((product) => (
              <ProductCard key={product.id} product={product} variant="rail" />
            ))}
          </div>
        </section>

        {/* 8. Haute Parfumerie Shelf */}
        <section aria-label="Fragrance Shelf">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="font-heading font-bold text-sm text-[#0F0F10]">
              Extrait Perfume Oils
            </h3>
            <button
              onClick={() => handleCategorySelect('fragrance')}
              className="text-xs text-[#997A2E] font-bold hover:underline"
            >
              View collection
            </button>
          </div>

          <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
            {fragranceProducts.map((product) => (
              <ProductCard key={product.id} product={product} variant="rail" />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
