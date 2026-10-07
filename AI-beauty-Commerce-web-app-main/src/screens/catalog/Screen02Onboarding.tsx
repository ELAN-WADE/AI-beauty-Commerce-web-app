import React, { useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from '../../components/common/BrandLogo';

export const Screen02Onboarding: React.FC = () => {
  const { navigateTo } = useApp();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: 'Health Before Beauty. Intention Before Trend.',
      description: 'Dermatologically engineered body care and facial formulations designed for melanin-rich African skin.',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
      badge: 'Brand Philosophy'
    },
    {
      title: 'Local City Sourcing Across Nigeria',
      description: 'Based in Abuja, Port Harcourt, Kano or Ibadan? Connect directly with verified city distributors to eliminate interstate courier fees and enjoy same-day delivery.',
      image: 'https://images.unsplash.com/photo-1608248597359-0c679234b4c7?auto=format&fit=crop&w=800&q=80',
      badge: 'Local Fulfillment'
    },
    {
      title: 'Creator Network & Desla Collective',
      description: 'Discover transformation routines, verified photo reviews, and collaborate directly with top beauty creators & certified estheticians.',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      badge: 'Community & Creators'
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      navigateTo('home');
    }
  };

  const slide = slides[currentSlide];

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-[#09090B] text-[#FBF9F5] p-6 sm:p-8">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-2">
        <BrandLogo variant="gold" size="sm" />
        <button
          onClick={() => navigateTo('home')}
          className="text-xs font-semibold text-[#A19B96] hover:text-[#D4AF37] py-1 px-3 rounded-full hover:bg-white/5 active-press transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Center Visual & Content */}
      <div className="my-auto py-6 max-w-sm mx-auto w-full flex flex-col items-center text-center">
        {/* Centered Circular Portrait with Gold Accent Halo */}
        <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full overflow-hidden shadow-2xl border-2 border-[#D4AF37]/50 mb-6 ring-8 ring-[#D4AF37]/10 group">
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover transition-all duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        {/* Pillar Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-mono font-bold uppercase tracking-wider mb-3">
          <ShieldCheck size={12} />
          <span>{slide.badge}</span>
        </div>

        {/* Headline */}
        <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#FBF9F5] tracking-tight leading-snug max-w-[310px]">
          {slide.title}
        </h2>

        {/* Short Explanatory Text */}
        <p className="text-xs sm:text-sm text-[#A19B96] mt-3 leading-relaxed max-w-[300px]">
          {slide.description}
        </p>

        {/* 3 Pagination Dots */}
        <div className="flex items-center gap-2 mt-6">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentSlide === idx
                  ? 'w-6 bg-[#D4AF37]'
                  : 'w-2 bg-white/20 hover:bg-white/40'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Bottom Full-Width Continue CTA */}
      <div className="pb-4 max-w-sm mx-auto w-full">
        <button
          onClick={handleNext}
          className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#F6E7C1] to-[#D4AF37] text-[#09090B] font-heading font-extrabold text-sm tracking-wide shadow-2xl active:scale-[0.98] flex items-center justify-center gap-2 transition-all hover:brightness-105 border border-[#F6E7C1]/50 cursor-pointer"
        >
          <span>{currentSlide === slides.length - 1 ? 'Enter Desla! Storefront' : 'Continue'}</span>
          <ArrowRight size={18} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
};

