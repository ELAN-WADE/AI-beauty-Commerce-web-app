import React from 'react';
import { ChevronLeft, ArrowRight, Layers } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { categories } from '../../data/categories';

export const Screen05Categories: React.FC = () => {
  const { navigateTo, setSelectedCategory, goBack } = useApp();

  const handleSelect = (slug: string) => {
    setSelectedCategory(slug);
    navigateTo('catalogue');
  };

  return (
    <div className="min-h-screen bg-white text-[#0F0F10] pb-28 font-body selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      {/* Top Header */}
      <div className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] px-4 py-3.5">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={goBack}
              className="p-1.5 -ml-1 rounded-full text-[#0F0F10] hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
              aria-label="Go back"
            >
              <ChevronLeft size={22} strokeWidth={2.2} />
            </button>
            <h1 className="font-heading font-extrabold tracking-tight text-lg sm:text-xl text-[#0F0F10]">
              Collections &amp; Pillars
            </h1>
          </div>
          <span className="text-xs font-mono font-bold text-[#997A2E]">
            {categories.length} Taxonomy Pillars
          </span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-6 space-y-6">
        <div className="max-w-2xl">
          <span className="text-xs font-mono font-bold text-[#997A2E] uppercase tracking-wider">
            Curated Formulations
          </span>
          <h2 className="font-heading font-extrabold tracking-tight text-2xl sm:text-3xl text-[#0F0F10] mt-1">
            Intentional care for every personal ritual.
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1.5 leading-relaxed">
            From clinical melanin-barrier body washes and whipped shea butters to extrait perfume oils and velvet lip glazes.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleSelect(cat.slug)}
              className="group relative rounded-3xl overflow-hidden border border-[#E5E7EB] bg-[#FAF9F6] shadow-xs hover:shadow-md hover:border-[#D4AF37] transition-all cursor-pointer active:scale-[0.98]"
            >
              <div className="relative h-48 sm:h-56 overflow-hidden bg-[#F6F5F2]">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10.5px] font-mono font-bold text-[#0F0F10] shadow-sm">
                  {cat.itemCount} Formulations
                </div>

                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="font-heading font-extrabold tracking-tight text-xl sm:text-2xl text-white drop-shadow-sm">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-white/80 line-clamp-1 mt-0.5">
                    {cat.description || 'Safe-conscious formulation crafted with clinical intention.'}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-white flex items-center justify-between">
                <span className="text-xs font-bold text-[#0F0F10] group-hover:text-[#997A2E] transition-colors">
                  Explore {cat.name}
                </span>
                <div className="w-8 h-8 rounded-full bg-[#FAF9F6] group-hover:bg-[#0F0F10] group-hover:text-white flex items-center justify-center transition-all text-[#0F0F10] shadow-xs">
                  <ArrowRight size={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
