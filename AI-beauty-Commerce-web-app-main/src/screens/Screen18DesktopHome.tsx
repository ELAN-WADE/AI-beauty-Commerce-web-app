import React, { useRef } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award,
  Truck,
  Flame,
  Star,
  CheckCircle2,
  Mail,
  MapPin,
  Store,
  Users,
  Compass,
  Package,
  Layers,
  Clock,
  Instagram,
  ChevronLeft,
  ChevronRight,
  Droplet,
  Heart
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DesktopNav } from '../components/common/DesktopNav';
import { ProductCard } from '../components/common/ProductCard';
import { BrandLogo } from '../components/common/BrandLogo';

export const Screen18DesktopHome: React.FC = () => {
  const {
    products,
    navigateTo,
    setSelectedCategory,
    selectedCity,
    setIsLocationModalOpen,
    getDistributorsForCity,
    viewProductDetails
  } = useApp();

  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const localDistributors = getDistributorsForCity(selectedCity);
  const bestsellers = products.filter((p) => p.isBestseller).slice(0, 5);
  const bodyCareProducts = products.filter((p) => p.category === 'Body Care').slice(0, 5);
  const fragranceProducts = products.filter((p) => p.category === 'Fragrance').slice(0, 5);
  const makeupProducts = products.filter((p) => p.category === 'Makeup').slice(0, 5);

  // 2-Row Temu-Style Circular Categories Definition
  const circularCategoriesRow1 = [
    { name: 'Whipped Butters', slug: 'body-care', count: '3 SKUs', img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=240&q=80' },
    { name: 'Radiant Glow Oils', slug: 'body-care', count: '5 SKUs', img: 'https://images.unsplash.com/photo-1608248597359-0c679234b4c7?auto=format&fit=crop&w=240&q=80' },
    { name: 'Exfoliating Scrubs', slug: 'body-care', count: '2 SKUs', img: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=240&q=80' },
    { name: 'Nourishing Body Wash', slug: 'body-care', count: '4 SKUs', img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=240&q=80' },
    { name: 'Gentle Cleansers', slug: 'skincare', count: '3 SKUs', img: 'https://images.unsplash.com/photo-1556228722-d0b5b144675e?auto=format&fit=crop&w=240&q=80' },
    { name: 'Sun Defense SPF 50+', slug: 'skincare', count: '2 SKUs', img: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=240&q=80' },
  ];

  const circularCategoriesRow2 = [
    { name: 'Extrait Perfume Oils', slug: 'fragrance', count: '5 SKUs', img: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=240&q=80' },
    { name: 'Eau de Parfum', slug: 'fragrance', count: '5 SKUs', img: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=240&q=80' },
    { name: 'Velvet Lip Glaze', slug: 'makeup', count: '10 Shades', img: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=240&q=80' },
    { name: 'Satin Lipsticks', slug: 'makeup', count: '10 Shades', img: 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?auto=format&fit=crop&w=240&q=80' },
    { name: 'Artisan Lashes', slug: 'makeup', count: '10 Styles', img: 'https://images.unsplash.com/photo-1583001809873-a128495da465?auto=format&fit=crop&w=240&q=80' },
    { name: 'Lifestyle & Wellness', slug: 'lifestyle', count: 'Essential', img: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&w=240&q=80' },
  ];

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug);
    navigateTo('catalogue');
  };

  const scrollCategories = (dir: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const amount = dir === 'left' ? -350 : 350;
      categoryScrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0F0F10] flex flex-col font-body selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      {/* Main Storefront Body */}
      <main className="flex-1">
        {/* REFINED EDITORIAL HERO COMPOSITION (Faithful 1:1 Art-Directed Composition for Desla) */}
        <section className="relative w-full bg-[#EDEAE4] py-8 sm:py-10 px-4 sm:px-6 lg:px-8 border-b border-[#E2DFD8]">
          {/* Large Floating White Hero Container (Refined Width, Rounded-44px, Soft Shadow) */}
          <div className="w-full max-w-5xl mx-auto rounded-[36px] sm:rounded-[44px] bg-white shadow-[0_20px_50px_-15px_rgba(0,0,0,0.06)] border border-black/[0.03] px-6 sm:px-10 lg:px-12 pt-8 sm:pt-10 pb-10 sm:pb-12 relative">
            
            {/* 1. Eyebrow: Quiet, Centered, Rounded Pill */}
            <div className="flex justify-center mb-3">
              <span className="border border-gray-200/90 bg-white px-3.5 py-1 rounded-full text-[11px] font-semibold text-[#997A2E] tracking-wider uppercase shadow-2xs">
                Safe-Conscious Apothecary
              </span>
            </div>

            {/* 2. Headline: Authentic Desla Philosophy, Display Size, Semibold 600, Tight Leading */}
            <h1 className="font-heading font-semibold text-3xl sm:text-4xl md:text-5xl lg:text-[48px] text-[#0F0F10] tracking-[-0.03em] leading-[1.12] max-w-3xl mx-auto text-center mb-3.5">
              Health Before Beauty. Intention Before Trend.
            </h1>

            {/* 3. Supporting Copy: Constrained Width, Centered, Moderate Line Height */}
            <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed max-w-xl mx-auto text-center mb-8 md:mb-10">
              Safe-conscious skincare, whipped shea butters, and extrait perfume oils engineered for melanin-rich African skin. Formulated with clinical science and fulfilled locally in your city.
            </p>

            {/* 4. Central Asymmetric Photographic Composition & Floating Information Cards */}
            <div className="relative w-full max-w-[880px] mx-auto select-none">
              {/* Asymmetric Masked Photograph (stepped contour matching reference) */}
              <div className="relative w-full">
                <svg
                  viewBox="0 0 960 480"
                  className="w-full h-auto block select-none drop-shadow-[0_12px_32px_rgba(0,0,0,0.06)] overflow-visible"
                >
                  <defs>
                    <clipPath id="hero-asymmetric-silhouette">
                      <path d="M 280 16 H 740 A 32 32 0 0 1 772 48 V 160 A 24 24 0 0 0 796 184 H 840 A 28 28 0 0 1 868 212 V 320 A 32 32 0 0 1 836 352 H 760 A 24 24 0 0 0 736 328 H 530 A 28 28 0 0 0 502 356 V 432 A 32 32 0 0 1 470 464 H 120 A 32 32 0 0 1 88 432 V 220 A 28 28 0 0 1 116 192 H 220 A 28 28 0 0 0 248 164 V 48 A 32 32 0 0 1 280 16 Z" />
                    </clipPath>
                  </defs>
                  <image
                    href="/hero_editorial.jpg"
                    x="0"
                    y="0"
                    width="960"
                    height="480"
                    preserveAspectRatio="xMidYMid slice"
                    clipPath="url(#hero-asymmetric-silhouette)"
                  />
                </svg>
              </div>

              {/* Floating Card 01 — Upper Left (Columns 2 → 4, Obsidian dark surface, shifted cleanly to side) */}
              <div className="absolute top-[5%] sm:top-[6%] left-[0%] sm:left-[2%] bg-[#111315] text-white p-3.5 sm:p-4 rounded-[18px] sm:rounded-[22px] shadow-2xl shadow-black/25 border border-white/10 z-20 transition-transform hover:scale-[1.02] duration-300">
                <span className="font-digit font-semibold text-2xl sm:text-[32px] leading-none text-white block">
                  99%
                </span>
                <p className="text-[10px] sm:text-xs text-gray-300 font-normal leading-snug mt-1.5 sm:mt-2 max-w-[125px] sm:max-w-[155px]">
                  Barrier Purity for safe-conscious clinical protection
                </p>
              </div>

              {/* Floating Card 02 — Lower Left (Columns 1 → 3, White surface, lower and further left) */}
              <div className="absolute bottom-[8%] sm:bottom-[10%] left-[-2%] sm:left-[0%] bg-white px-3.5 py-2.5 sm:px-4 sm:py-3.5 rounded-[16px] sm:rounded-[20px] shadow-xl shadow-black/8 border border-gray-100/90 z-20 transition-transform hover:scale-[1.02] duration-300">
                <span className="font-digit font-semibold text-2xl sm:text-[30px] leading-none text-[#0F1123] block">
                  25,000+
                </span>
                <p className="text-[10px] sm:text-xs text-[#6B7280] font-normal leading-snug mt-1 sm:mt-1.5 max-w-[110px] sm:max-w-[130px]">
                  Formulations delivered locally in Lagos &amp; Abuja
                </p>
              </div>

              {/* Floating Card 03 — Upper Right (Columns 10 → 12, White surface, clinical rating badge) */}
              <div className="absolute top-[15%] sm:top-[18%] right-[0%] sm:right-[2%] bg-white px-3.5 py-2.5 sm:px-4 sm:py-3.5 rounded-[16px] sm:rounded-[20px] shadow-xl shadow-black/8 border border-gray-100/90 z-20 transition-transform hover:scale-[1.02] duration-300">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-digit font-semibold text-2xl sm:text-[30px] leading-none text-[#0F1123]">
                    4.8
                  </span>
                  <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-[#111315] text-white flex items-center justify-center text-[9px] sm:text-[10px]">
                    <Star size={10} fill="currentColor" />
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-[#6B7280] font-normal leading-snug mt-1 sm:mt-1.5 max-w-[95px] sm:max-w-[115px]">
                  Average clinical rating (2,400+ reviews)
                </p>
              </div>

              {/* Floating Card 04 — Lower Right Context Card (Columns 7 → 11, Editorial categories in notch) */}
              <div className="absolute bottom-[6%] sm:bottom-[8%] right-[2%] sm:right-[5%] z-20 flex flex-col gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => handleCategorySelect('body-care')}
                    className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold text-[#1F2937] hover:bg-gray-100/90 transition-colors cursor-pointer"
                  >
                    Whipped Shea
                  </button>
                  <button
                    onClick={() => handleCategorySelect('body-care')}
                    className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold text-[#1F2937] hover:bg-gray-100/90 transition-colors cursor-pointer"
                  >
                    Radiant Glow Oils
                  </button>
                  <button
                    onClick={() => handleCategorySelect('fragrance')}
                    className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold text-[#1F2937] hover:bg-gray-100/90 transition-colors cursor-pointer"
                  >
                    Extrait de Parfum
                  </button>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => handleCategorySelect('makeup')}
                    className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold text-[#1F2937] hover:bg-gray-100/90 transition-colors cursor-pointer"
                  >
                    Velvet Lip Glazes
                  </button>
                  <button
                    onClick={() => handleCategorySelect('skincare')}
                    className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold text-[#1F2937] hover:bg-gray-100/90 transition-colors cursor-pointer"
                  >
                    Clean Actives
                  </button>
                </div>
              </div>
            </div>

            {/* 5. Primary Centered CTA Beneath the Visual Composition */}
            <div className="flex justify-center mt-7 sm:mt-9">
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  navigateTo('catalogue');
                }}
                className="bg-[#0F0F10] hover:bg-[#D4AF37] text-white hover:text-[#0F0F10] px-8 py-3 rounded-full text-xs sm:text-sm font-semibold shadow-md flex items-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Explore Formulations</span>
                <ArrowRight size={14} />
              </button>
            </div>

          </div>
        </section>

        {/* REFINED 1-ROW HORIZONTAL SWIPEABLE CATEGORY RAIL */}
        <section className="py-8 bg-white border-b border-[#E5E7EB]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-heading font-semibold text-lg text-[#0F0F10]">
                  Explore Desla!™ Taxonomy
                </h2>
                <p className="text-xs text-[#6B7280]">
                  Select a category to view clinical formulations stocked in {selectedCity}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => scrollCategories('left')}
                  className="w-8 h-8 rounded-full border border-[#E5E7EB] hover:border-[#D4AF37] flex items-center justify-center text-[#0F0F10] hover:text-[#997A2E] active-press transition-colors cursor-pointer"
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => scrollCategories('right')}
                  className="w-8 h-8 rounded-full border border-[#E5E7EB] hover:border-[#D4AF37] flex items-center justify-center text-[#0F0F10] hover:text-[#997A2E] active-press transition-colors cursor-pointer"
                  aria-label="Scroll right"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Single Continuous Row of Circular Category Icons with Swipe / Scroll */}
            <div
              ref={categoryScrollRef}
              className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2 scroll-smooth"
            >
              {[...circularCategoriesRow1, ...circularCategoriesRow2].map((cat) => (
                <div
                  key={cat.name}
                  onClick={() => handleCategorySelect(cat.slug)}
                  className="flex flex-col items-center justify-between group cursor-pointer w-28 sm:w-32 h-[140px] sm:h-[146px] p-3 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] hover:border-[#D4AF37] hover:shadow-sm transition-all duration-200 text-center shrink-0 active:scale-[0.97]"
                >
                  <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-full overflow-hidden p-0.5 border-2 border-transparent group-hover:border-[#D4AF37] transition-all duration-200 bg-[#F6F5F2] shrink-0">
                    <img
                      src={cat.img}
                      alt={cat.name}
                      className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <span className="text-xs font-heading font-semibold text-[#0F0F10] group-hover:text-[#997A2E] transition-colors leading-tight line-clamp-2 mt-1">
                    {cat.name}
                  </span>
                  <span className="text-[10px] text-[#6B7280] font-mono">
                    {cat.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TEMU-INSPIRED FILTER & SORT PILL RAIL */}
        <section className="py-3 bg-[#FAF9F6] border-b border-[#E5E7EB] sticky top-[118px] z-20">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between overflow-x-auto no-scrollbar gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#0F0F10] shrink-0 mr-1 flex items-center gap-1">
                <span>Filter By:</span>
              </span>

              <button
                onClick={() => handleCategorySelect('All')}
                className="px-3.5 py-1.5 rounded-full bg-white border border-[#E5E7EB] hover:border-[#D4AF37] text-[#0F0F10] font-medium active-press transition-colors shrink-0 cursor-pointer"
              >
                All Items
              </button>

              <button
                onClick={() => setIsLocationModalOpen(true)}
                className="px-3.5 py-1.5 rounded-full bg-[#FBF5E8] border border-[#D4AF37]/50 text-[#997A2E] font-bold active-press transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
              >
                <MapPin size={12} className="text-[#D4AF37]" />
                <span>In Stock: {selectedCity} Only</span>
              </button>

              <button
                onClick={() => handleCategorySelect('body-care')}
                className="px-3.5 py-1.5 rounded-full bg-white border border-[#E5E7EB] hover:border-[#D4AF37] text-[#0F0F10] font-medium active-press transition-colors shrink-0 cursor-pointer"
              >
                Whipped Butters &amp; Oils
              </button>

              <button
                onClick={() => handleCategorySelect('fragrance')}
                className="px-3.5 py-1.5 rounded-full bg-white border border-[#E5E7EB] hover:border-[#D4AF37] text-[#0F0F10] font-medium active-press transition-colors shrink-0 cursor-pointer"
              >
                Extrait Parfums
              </button>

              <button
                onClick={() => handleCategorySelect('makeup')}
                className="px-3.5 py-1.5 rounded-full bg-white border border-[#E5E7EB] hover:border-[#D4AF37] text-[#0F0F10] font-medium active-press transition-colors shrink-0 cursor-pointer"
              >
                Velvet Lip Glazes
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[#6B7280]">Showing <strong>{products.length}</strong> formulations</span>
            </div>
          </div>
        </section>

        {/* SECTION 1: BEST-SELLING FORMULATIONS (High-Density 4-Column Grid) */}
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-end justify-between mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#997A2E] uppercase tracking-wider mb-1">
                  <Flame size={14} className="text-[#D4AF37]" />
                  <span>Commercial Favorites</span>
                </div>
                <h2 className="font-heading font-semibold text-2xl text-[#0F0F10] tracking-tight">
                  Best-Selling Formulations
                </h2>
              </div>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  navigateTo('catalogue');
                }}
                className="text-xs font-bold text-[#997A2E] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All Best-Sellers</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* 5-Column High-Density Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-5">
              {bestsellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 2: LOCAL CITY SOURCING SPOTLIGHT BANNER */}
        <section className="py-8 bg-[#FAF9F6] border-y border-[#E5E7EB]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="p-6 md:p-8 rounded-3xl bg-white border border-[#E5E7EB] shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EEE3] border border-[#E5E7EB] text-[#0F0F10] text-[11px] font-bold">
                  <Truck size={13} className="text-[#997A2E]" />
                  <span>Bypass Interstate Delivery Delays</span>
                </div>
                <h3 className="font-heading font-extrabold text-xl md:text-2xl text-[#0F0F10]">
                  Get Same-Day Delivery in {selectedCity}
                </h3>
                <p className="text-xs md:text-sm text-[#6B7280] leading-relaxed">
                  Why wait 3-5 days for shipping from Lagos? Authorized local distributors in {selectedCity} have authentic Desla stock ready for immediate dispatch or physical pickup.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <button
                  onClick={() => navigateTo('distributors')}
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#0F0F10] hover:bg-[#1F1D22] text-white text-xs font-heading font-bold active-press transition-colors cursor-pointer"
                >
                  View {selectedCity} Distributors ({localDistributors.length})
                </button>
                <button
                  onClick={() => setIsLocationModalOpen(true)}
                  className="w-full sm:w-auto px-5 py-3 rounded-full bg-[#F8F9FA] hover:bg-gray-100 border border-[#E5E7EB] text-[#0F0F10] text-xs font-heading font-semibold active-press transition-colors cursor-pointer"
                >
                  Change City
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2.5: ASK DESLA!™ AI CONCIERGE & LIVE TRACKING PORTAL BANNER */}
        <section className="py-8 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#0F0F10] via-[#1A1817] to-[#0F0F10] text-white border-2 border-[#D4AF37]/50 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden">
              {/* Background ambient glow */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle,rgba(212,175,55,0.15)_0%,transparent_70%)] pointer-events-none" />

              <div className="space-y-3 max-w-xl z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-mono font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>24/7 ChatGPT-Powered Beauty Concierge</span>
                </div>
                <h3 className="font-heading font-extrabold text-2xl md:text-3xl text-white tracking-tight">
                  Have Questions or Need to Track an Order?
                </h3>
                <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
                  Connect instantly with our dedicated AI concierge. Get instant live courier tracking on order <strong>#DES-829104</strong>, personalized clinical recommendations for hyperpigmentation, or check NAFDAC batch seals.
                </p>

                {/* Quick 1-tap query pills */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => navigateTo('ask-ai')}
                    className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs text-gray-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Package size={13} className="text-[#D4AF37]" />
                    <span>Track Package #DES-829104</span>
                  </button>
                  <button
                    onClick={() => navigateTo('ask-ai')}
                    className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs text-gray-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Sparkles size={13} className="text-[#D4AF37]" />
                    <span>Hyperpigmentation Routine</span>
                  </button>
                  <button
                    onClick={() => navigateTo('ask-ai')}
                    className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs text-gray-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ShieldCheck size={13} className="text-[#D4AF37]" />
                    <span>NAFDAC Authenticity</span>
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <div className="shrink-0 z-10 w-full sm:w-auto">
                <button
                  onClick={() => navigateTo('ask-ai')}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#D4AF37] hover:bg-[#F6E7C1] text-[#0F0F10] font-heading font-extrabold text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer group"
                >
                  <Sparkles size={16} className="text-[#0F0F10]" />
                  <span>Open Ask Desla!™ AI (ChatGPT)</span>
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: FLAGSHIP BODY CARE COLLECTION (4-Column Grid) */}
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-end justify-between mb-6">
              <div>
                <span className="text-xs font-bold text-[#997A2E] uppercase tracking-wider block mb-1">
                  Flagship Formulations
                </span>
                <h2 className="font-heading font-extrabold text-2xl text-[#0F0F10] tracking-tight">
                  Whipped Butters &amp; Radiant Glow Oils
                </h2>
              </div>
              <button
                onClick={() => handleCategorySelect('body-care')}
                className="text-xs font-bold text-[#997A2E] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Shop Body Care ({bodyCareProducts.length})</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-5">
              {bodyCareProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4: HAUTE PARFUMERIE & LIP GLAZES (5-Column Grid) */}
        <section className="py-12 bg-[#FAF9F6] border-t border-[#E5E7EB]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-end justify-between mb-6">
              <div>
                <span className="text-xs font-bold text-[#997A2E] uppercase tracking-wider block mb-1">
                  Artisanal Luxury
                </span>
                <h2 className="font-heading font-extrabold text-2xl text-[#0F0F10] tracking-tight">
                  Extrait de Parfum &amp; Lips
                </h2>
              </div>
              <button
                onClick={() => handleCategorySelect('fragrance')}
                className="text-xs font-bold text-[#997A2E] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Shop Fragrances</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-5">
              {fragranceProducts.concat(makeupProducts).slice(0, 5).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* LUXURY WHITE FOOTER */}
      <footer className="bg-white border-t border-[#E5E7EB] pt-14 pb-8 text-[#6B7280] text-xs">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Column 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo variant="dark" size="md" showTagline={true} />
            <p className="text-xs leading-relaxed max-w-sm text-[#4B5563]">
              Desla Beauty and Lifestyle Limited. Unisex luxury skincare, artisanal body oils, and concentrated extrait perfumes formulated specifically for melanin-rich skin.
            </p>
            <div className="flex items-center gap-3 pt-2 text-[#0F0F10]">
              <span className="text-[11px] font-mono text-[#997A2E] font-bold">Lagos HQ • Abuja • Port Harcourt • Kano</span>
            </div>
          </div>

          {/* Column 2: Pillars */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#0F0F10]">
              Formulations
            </h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => handleCategorySelect('body-care')} className="hover:text-[#0F0F10]">Body Oils &amp; Butters</button></li>
              <li><button onClick={() => handleCategorySelect('skincare')} className="hover:text-[#0F0F10]">Barrier Cleansers</button></li>
              <li><button onClick={() => handleCategorySelect('fragrance')} className="hover:text-[#0F0F10]">Extrait de Parfum</button></li>
              <li><button onClick={() => handleCategorySelect('makeup')} className="hover:text-[#0F0F10]">Lip Glazes &amp; Lashes</button></li>
            </ul>
          </div>

          {/* Column 3: Partner Network */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#0F0F10]">
              Partners &amp; Creators
            </h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => navigateTo('distributors')} className="hover:text-[#0F0F10]">Find Local Distributor</button></li>
              <li><button onClick={() => navigateTo('distributor-portal')} className="hover:text-[#0F0F10]">Distributor Portal</button></li>
              <li><button onClick={() => navigateTo('creators')} className="hover:text-[#0F0F10]">Creator Affiliate Hub</button></li>
              <li><button onClick={() => navigateTo('community')} className="hover:text-[#0F0F10]">Desla Collective</button></li>
            </ul>
          </div>

          {/* Column 4: Orders & Support */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#0F0F10]">
              Assistance
            </h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => navigateTo('orders')} className="hover:text-[#0F0F10]">Track Your Order</button></li>
              <li><button onClick={() => navigateTo('ai-scan')} className="hover:text-[#0F0F10]">AI Skin Diagnostic</button></li>
              <li><a href="https://wa.me/2348148120642" target="_blank" rel="noopener noreferrer" className="hover:text-[#0F0F10]">WhatsApp Support</a></li>
              <li><span className="text-[#0F0F10] font-medium">NAFDAC Clinical Quality</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-6 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#9CA3AF]">
          <span>&copy; {new Date().getFullYear()} Desla Beauty and Lifestyle Limited. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span className="text-[#0F0F10] font-medium">Health before beauty. Intention before trend.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
