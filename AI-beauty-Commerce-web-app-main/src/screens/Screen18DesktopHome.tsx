import React, { useRef, useState, useEffect } from 'react';
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
  Heart,
  X
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

  const [isFlagshipModalOpen, setIsFlagshipModalOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const localDistributors = getDistributorsForCity(selectedCity);
  const bestsellers = products.filter((p) => p.isBestseller).slice(0, 5);
  const bodyCareProducts = products.filter((p) => p.category === 'Body Care').slice(0, 5);
  const fragranceProducts = products.filter((p) => p.category === 'Fragrance').slice(0, 5);
  const makeupProducts = products.filter((p) => p.category === 'Makeup').slice(0, 5);

  // Rotating Word in Single Straight-Line Headline
  const rotatingWords = [
    { text: 'Beauty', color: 'text-[#D4AF37]' },
    { text: 'Trends', color: 'text-[#FB7701]' },
    { text: 'Intentions', color: 'text-[#16A34A]' },
    { text: 'Hype', color: 'text-[#997A2E]' }
  ];
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % rotatingWords.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [rotatingWords.length]);

  // 3-Slide Dynamic Crossfading Slideshow Definitions
  const heroSlides = [
    {
      id: 'routine',
      image: '/hero_slide_1.jpg',
      tag: 'Safe-Conscious Routine',
      card1: {
        stat: '99.4%',
        label: 'Melanin barrier lipid retention',
      },
      card2: {
        stat: 'pH 5.5',
        label: 'Biocompatible Shea & Niacinamide',
      },
      card3: {
        rating: '4.9',
        label: '3,200+ clinical routine scans',
        actionText: 'Start 30s Scan',
        actionRoute: 'ai-scan',
      },
    },
    {
      id: 'distributor',
      image: '/hero_slide_2.jpg',
      tag: 'Regional Distributor Network',
      card1: {
        stat: '14 Hubs',
        label: 'Lagos · Abuja · Accra · PH',
      },
      card2: {
        stat: '38% Net',
        label: 'Wholesale B2B NAFDAC tier',
      },
      card3: {
        rating: '100%',
        label: 'Same-day city hub dispatch',
        actionText: 'Apply as Partner',
        actionRoute: 'distributor-portal',
      },
    },
    {
      id: 'creator',
      image: '/hero_slide_3.jpg',
      tag: 'Creator & MUA Collective',
      card1: {
        stat: '15% Net',
        label: 'Seasonal PR gifting press box',
      },
      card2: {
        stat: '12h Sillage',
        label: 'Cold-pressed extrait oils',
      },
      card3: {
        rating: '850+',
        label: 'Testing melanin swatch kits',
        actionText: 'Claim Creator Kit',
        actionRoute: 'creators',
      },
    },
  ];

  // Auto-slide effect (5.5s interval, paused on hover)
  useEffect(() => {
    if (isHeroPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isHeroPaused, heroSlides.length]);

  const activeSlide = heroSlides[currentSlide];

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

  const allCircularCategories = [...circularCategoriesRow1, ...circularCategoriesRow2];

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
        {/* 1. REFINED CONTINUOUS MARQUEE CATEGORY RAIL (Positioned at TOP immediately beneath DesktopNav) */}
        <section className="py-5 bg-white border-b border-[#E5E7EB] overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 mb-3">
            <div className="flex items-center justify-between">
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
          </div>

          {/* Seamless Infinite Continuous Marquee Rail with Left & Right Gradient Masks */}
          <div
            ref={categoryScrollRef}
            className="relative w-full overflow-hidden"
          >
            {/* Edge subtle gradient masks */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-r from-white to-transparent z-10" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-l from-white to-transparent z-10" />

            <div className="animate-marquee-smooth flex items-center gap-6 sm:gap-8 py-2 px-4">
              {[...allCircularCategories, ...allCircularCategories].map((cat, idx) => (
                <div
                  key={`${cat.name}-${idx}`}
                  onClick={() => handleCategorySelect(cat.slug)}
                  className="flex flex-col items-center group cursor-pointer w-24 sm:w-28 shrink-0 active:scale-[0.97]"
                >
                  <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full overflow-hidden p-0.5 border border-[#E5E7EB] group-hover:border-[#D4AF37] group-hover:shadow-md transition-all duration-300 bg-[#F6F5F2] shrink-0 shadow-xs">
                    <img
                      src={cat.img}
                      alt={cat.name}
                      className="w-full h-full object-cover rounded-full group-hover:scale-108 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <span className="text-xs font-heading font-semibold text-[#0F0F10] group-hover:text-[#997A2E] transition-colors leading-tight text-center mt-2.5 line-clamp-2 px-1">
                    {cat.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 2. REFINED EDITORIAL HERO COMPOSITION (Directly Underneath Taxonomy Rail) */}
        <section className="relative w-full bg-[#EDEAE4] pt-4 sm:pt-6 pb-10 sm:pb-12 px-4 sm:px-6 lg:px-8 border-b border-[#E2DFD8]">
          <div className="w-full max-w-5xl mx-auto relative">
            {/* Single Straight-Line Animated Editorial Headline */}
            <div className="text-center py-2 sm:py-3 mb-2 sm:mb-4 select-none">
              <h1 className="font-heading font-semibold text-lg sm:text-xl md:text-2xl text-[#0F0F10] tracking-tight inline-flex items-center justify-center gap-1.5 flex-wrap">
                <span>Health Before</span>
                <span
                  key={wordIndex}
                  className={`font-semibold inline-block transition-all duration-500 ease-out animate-in fade-in slide-in-from-bottom-1 ${rotatingWords[wordIndex].color}`}
                >
                  {rotatingWords[wordIndex].text}.
                </span>
                <span className="text-[#0F0F10]/25 mx-1 hidden sm:inline">•</span>
                <span className="text-[#4B5563] font-normal text-base sm:text-lg">
                  Intention Before Trend.
                </span>
              </h1>
            </div>

            {/* Central Asymmetric Photographic Composition & Floating Information Cards (Aligned to Reference Design) */}
            <div
              className="relative w-full max-w-[880px] mx-auto select-none"
              onMouseEnter={() => setIsHeroPaused(true)}
              onMouseLeave={() => setIsHeroPaused(false)}
            >
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
                  {heroSlides.map((slide, idx) => (
                    <image
                      key={slide.id}
                      href={slide.image}
                      x="0"
                      y="0"
                      width="960"
                      height="480"
                      preserveAspectRatio="xMidYMid slice"
                      clipPath="url(#hero-asymmetric-silhouette)"
                      style={{
                        opacity: currentSlide === idx ? 1 : 0,
                        transition: 'opacity 700ms cubic-bezier(0.77, 0, 0.175, 1)',
                        pointerEvents: currentSlide === idx ? 'auto' : 'none'
                      }}
                    />
                  ))}
                </svg>
              </div>

              {/* Floating Card 01 — Upper Left (Obsidian dark minimalist surface, NO border, matching reference 99%) */}
              <div className="absolute top-[4%] sm:top-[5%] left-[1%] sm:left-[2%] bg-[#0F1117] text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl shadow-black/25 z-20 transition-all duration-300 hover:scale-[1.02]">
                <span className="font-digit font-semibold text-2xl sm:text-3xl leading-none text-white block">
                  {activeSlide.card1.stat}
                </span>
                <p className="text-[10px] sm:text-xs text-gray-300 font-normal leading-snug mt-1.5 max-w-[130px] sm:max-w-[150px]">
                  {activeSlide.card1.label}
                </p>
              </div>

              {/* Floating Card 02 — Lower Left (Crisp white minimalist surface, NO border, matching reference 2.5M) */}
              <div className="absolute bottom-[6%] sm:bottom-[7%] left-[0%] sm:left-[1%] bg-white text-[#0F0F10] p-3 sm:p-3.5 rounded-2xl shadow-xl shadow-black/8 z-20 transition-all duration-300 hover:scale-[1.02]">
                <span className="font-digit font-semibold text-2xl sm:text-3xl leading-none text-[#0F1123] block">
                  {activeSlide.card2.stat}
                </span>
                <p className="text-[10px] sm:text-xs text-[#6B7280] font-normal leading-snug mt-1 max-w-[120px] sm:max-w-[135px]">
                  {activeSlide.card2.label}
                </p>
              </div>

              {/* Floating Card 03 — Upper Right (Crisp white minimalist surface, NO border, matching reference 4.8) */}
              <div className="absolute top-[8%] sm:top-[10%] right-[1%] sm:right-[2%] bg-white text-[#0F0F10] p-3 sm:p-3.5 rounded-2xl shadow-xl shadow-black/8 z-20 transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center gap-1.5">
                  <span className="font-digit font-semibold text-2xl sm:text-3xl leading-none text-[#0F1123]">
                    {activeSlide.card3.rating}
                  </span>
                  <div className="w-5 h-5 rounded-full bg-[#111315] text-[#D4AF37] flex items-center justify-center text-[10px]">
                    <Star size={10} fill="currentColor" />
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-[#6B7280] font-normal leading-snug mt-1 max-w-[115px] sm:max-w-[130px]">
                  {activeSlide.card3.label}
                </p>
                <button
                  onClick={() => navigateTo(activeSlide.card3.actionRoute as any)}
                  className="mt-2 text-[10px] sm:text-[11px] font-semibold text-[#0F0F10] hover:text-[#997A2E] flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
                >
                  <span>{activeSlide.card3.actionText}</span>
                  <ArrowRight size={10} />
                </button>
              </div>

              {/* Floating Card 04 — Lower Right Notch Category Links (Two clean rows of bare text links, matching reference) */}
              <div className="absolute bottom-[6%] sm:bottom-[7%] right-[2%] sm:right-[4%] z-20 flex flex-col gap-2 select-none">
                <div className="flex items-center gap-2.5 sm:gap-3.5 text-xs sm:text-[13px] font-medium text-[#2D2A26]">
                  <button
                    onClick={() => handleCategorySelect('body-care')}
                    className="hover:text-[#997A2E] transition-colors cursor-pointer"
                  >
                    Whipped Shea
                  </button>
                  <span className="text-[#2D2A26]/30 text-[10px]">•</span>
                  <button
                    onClick={() => handleCategorySelect('body-care')}
                    className="hover:text-[#997A2E] transition-colors cursor-pointer"
                  >
                    Radiant Glow Oils
                  </button>
                  <span className="text-[#2D2A26]/30 text-[10px]">•</span>
                  <button
                    onClick={() => handleCategorySelect('fragrance')}
                    className="hover:text-[#997A2E] transition-colors cursor-pointer"
                  >
                    Extrait Parfums
                  </button>
                </div>
                <div className="flex items-center gap-2.5 sm:gap-3.5 text-xs sm:text-[13px] font-medium text-[#2D2A26]">
                  <button
                    onClick={() => handleCategorySelect('makeup')}
                    className="hover:text-[#997A2E] transition-colors cursor-pointer"
                  >
                    Velvet Lip Glazes
                  </button>
                  <span className="text-[#2D2A26]/30 text-[10px]">•</span>
                  <button
                    onClick={() => handleCategorySelect('skincare')}
                    className="hover:text-[#997A2E] transition-colors cursor-pointer"
                  >
                    Clean Actives
                  </button>
                  <span className="text-[#2D2A26]/30 text-[10px]">•</span>
                  <button
                    onClick={() => setIsFlagshipModalOpen(true)}
                    className="font-semibold text-[#997A2E] hover:text-[#D4AF37] transition-colors cursor-pointer"
                  >
                    Flagship Formulations
                  </button>
                </div>
              </div>
            </div>

            {/* Slide Navigation Controls & Minimalist Indicators */}
            <div className="flex items-center justify-center gap-2 mt-5">
              {heroSlides.map((slide, idx) => {
                const isActive = currentSlide === idx;
                return (
                  <button
                    key={slide.id}
                    onClick={() => setCurrentSlide(idx)}
                    aria-label={`Go to slide ${idx + 1}: ${slide.tag}`}
                    className={`h-2 transition-all duration-300 rounded-full cursor-pointer ${
                      isActive
                        ? 'w-6 bg-[#FB7701]'
                        : 'w-2 bg-[#0F0F10]/20 hover:bg-[#0F0F10]/40'
                    }`}
                  />
                );
              })}
            </div>

            {/* Primary Centered CTA Beneath the Visual Composition */}
            <div className="flex justify-center mt-4 sm:mt-5">
              <button
                onClick={() => setIsFlagshipModalOpen(true)}
                className="bg-[#0F0F10] hover:bg-[#D4AF37] text-white hover:text-[#0F0F10] px-8 py-3.5 rounded-full text-xs sm:text-sm font-semibold shadow-md flex items-center gap-2 active:scale-[0.98] transition-all cursor-pointer group"
              >
                <span>Explore Formulations</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </section>

        {/* TEMU-INSPIRED FILTER & SORT PILL RAIL */}
        <section className="py-3 bg-[#FAF9F6] border-b border-[#E5E7EB]">
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
            <div className="p-6 md:p-8 rounded-3xl bg-[#0F0F10] text-white border border-white/10 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="space-y-3 max-w-xl z-10">
                <div className="inline-flex items-center gap-2 text-[#FB7701] text-xs font-mono font-bold tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-[#FB7701] animate-pulse" />
                  <span>24/7 ChatGPT-Powered Beauty Concierge</span>
                </div>
                <h3 className="font-heading font-extrabold text-2xl md:text-3xl text-white tracking-tight">
                  Have Questions or Need to Track an Order?
                </h3>
                <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
                  Connect instantly with our dedicated AI concierge. Get instant live courier tracking on order <strong>#DES-829104</strong>, personalized clinical recommendations for hyperpigmentation, or check NAFDAC batch seals.
                </p>

                {/* Quick 1-tap query links — MINIMALIST (No excess backgrounds) */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs text-gray-300">
                  <button
                    onClick={() => navigateTo('ask-ai')}
                    className="hover:text-[#FB7701] flex items-center gap-1.5 transition-colors cursor-pointer group"
                  >
                    <Package size={13} className="text-[#FB7701] group-hover:scale-110 transition-transform" />
                    <span className="underline-offset-4 group-hover:underline">Track Package #DES-829104</span>
                  </button>

                  <span className="text-white/20 hidden sm:inline">•</span>

                  <button
                    onClick={() => navigateTo('ask-ai')}
                    className="hover:text-[#FB7701] flex items-center gap-1.5 transition-colors cursor-pointer group"
                  >
                    <Sparkles size={13} className="text-[#FB7701] group-hover:scale-110 transition-transform" />
                    <span className="underline-offset-4 group-hover:underline">Hyperpigmentation Routine</span>
                  </button>

                  <span className="text-white/20 hidden sm:inline">•</span>

                  <button
                    onClick={() => navigateTo('ask-ai')}
                    className="hover:text-[#FB7701] flex items-center gap-1.5 transition-colors cursor-pointer group"
                  >
                    <ShieldCheck size={13} className="text-[#FB7701] group-hover:scale-110 transition-transform" />
                    <span className="underline-offset-4 group-hover:underline">NAFDAC Authenticity</span>
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <div className="shrink-0 z-10 w-full sm:w-auto">
                <button
                  onClick={() => navigateTo('ask-ai')}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#FB7701] hover:bg-[#e06b01] text-white font-heading font-extrabold text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer group"
                >
                  <Sparkles size={16} className="text-white" />
                  <span>Open Ask Desla!™ AI (ChatGPT)</span>
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* FLAGSHIP FORMULATIONS & ARTISANAL LUXURY MODAL */}
      {isFlagshipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          {/* Backdrop with smooth blur */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={() => setIsFlagshipModalOpen(false)}
            aria-label="Close modal backdrop"
          />

          {/* Dialog Container */}
          <div className="relative z-10 w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#D4AF37]/40 flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-[#E5E7EB] bg-[#FAF9F6] flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FBF5E8] border border-[#D4AF37]/40 text-[#997A2E] text-[11px] font-bold uppercase tracking-wider mb-2">
                  <Sparkles size={12} className="text-[#D4AF37]" />
                  <span>Flagship Formulations &amp; Artisanal Luxury</span>
                </div>
                <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-[#0F0F10] tracking-tight">
                  Whipped Butters, Radiant Glow Oils &amp; Extrait de Parfum
                </h3>
                <p className="text-xs text-[#6B7280] mt-1">
                  Clinical science engineered for melanin-rich African skin • Local stock ready for same-day dispatch in {selectedCity}
                </p>
              </div>

              <button
                onClick={() => setIsFlagshipModalOpen(false)}
                className="w-9 h-9 rounded-full bg-white hover:bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-black transition-colors cursor-pointer shrink-0"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content Grid */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-white">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...bodyCareProducts, ...fragranceProducts, ...makeupProducts].slice(0, 8).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-[#E5E7EB] bg-[#FAF9F6] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
                <span>100% NAFDAC certified authentic batch formulations</span>
              </div>

              <button
                onClick={() => {
                  setIsFlagshipModalOpen(false);
                  setSelectedCategory('All');
                  navigateTo('catalogue');
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#0F0F10] hover:bg-[#D4AF37] text-white hover:text-[#0F0F10] font-heading font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Explore Full Catalogue</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

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
