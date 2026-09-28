import React from 'react';
import { X, Check, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useViewport } from '../../context/ViewportContext';

export const FilterSortSheet: React.FC = () => {
  const {
    isFilterSheetOpen,
    setIsFilterSheetOpen,
    selectedCategory,
    setSelectedCategory,
    selectedConcern,
    setSelectedConcern,
    sortOption,
    setSortOption,
    selectedCity,
    setIsLocationModalOpen
  } = useApp();
  const { isDesktop } = useViewport();

  if (!isFilterSheetOpen) return null;

  const categories = [
    { label: 'All Range', value: 'All' },
    { label: 'Body Care', value: 'body-care' },
    { label: 'Skincare', value: 'skincare' },
    { label: 'Haute Fragrance', value: 'fragrance' },
    { label: 'Complexion & Lips', value: 'makeup' },
    { label: 'Lifestyle & Wellness', value: 'lifestyle' }
  ];

  const concerns = [
    'All Concerns',
    'Melanin Barrier Repair',
    'Hyperpigmentation',
    'Deep Hydration',
    'Skin Glow & Radiance',
    'Uneven Texture'
  ];

  const sortOptions = [
    { label: 'Best-Sellers / Featured', value: 'recommended' as const },
    { label: 'Price: Low to High', value: 'price-low' as const },
    { label: 'Price: High to Low', value: 'price-high' as const },
    { label: 'Highest Rated', value: 'rating' as const },
    { label: 'Newest Arrivals', value: 'newest' as const }
  ];

  const handleReset = () => {
    setSelectedCategory('All');
    setSelectedConcern('All Concerns');
    setSortOption('recommended');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        onClick={() => setIsFilterSheetOpen(false)}
      />

      {/* Responsive Filter Modal (Centered on Desktop, Slide-up on Mobile) */}
      <div
        className={`relative z-10 w-full bg-white rounded-3xl shadow-2xl border border-[#E5E7EB] p-5 sm:p-6 transition-all duration-200 ${
          isDesktop
            ? 'max-w-md animate-in zoom-in-95'
            : 'max-w-md mt-auto sm:my-auto animate-in slide-in-from-bottom-4'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-[#D4AF37]" />
            <h3 className="font-heading font-extrabold text-sm text-[#0F0F10]">
              Filter &amp; Sort Formulations
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="text-[11px] font-bold text-[#6B7280] hover:text-[#0F0F10] flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={11} />
              <span>Reset</span>
            </button>
            <button
              onClick={() => setIsFilterSheetOpen(false)}
              className="p-1 rounded-full text-gray-400 hover:text-black cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-4 my-4 max-h-[65vh] overflow-y-auto pr-1">
          {/* Categories Pillar */}
          <div>
            <span className="text-xs font-bold text-[#0F0F10] block mb-2">
              Taxonomy Pillar
            </span>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => {
                const isActive = selectedCategory.toLowerCase() === cat.value.toLowerCase();
                return (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 cursor-pointer ${
                      isActive
                        ? 'bg-[#0F0F10] text-white shadow-xs'
                        : 'bg-[#F3EEE3] hover:bg-[#EAE4D7] text-[#0F0F10]'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Skin Concern */}
          <div>
            <span className="text-xs font-bold text-[#0F0F10] block mb-2">
              Primary Skin Focus
            </span>
            <div className="flex flex-wrap gap-1.5">
              {concerns.map((concern) => {
                const isActive = selectedConcern === concern;
                return (
                  <button
                    key={concern}
                    onClick={() => setSelectedConcern(concern)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 cursor-pointer ${
                      isActive
                        ? 'bg-[#0F0F10] text-white shadow-xs'
                        : 'bg-[#F6F5F2] hover:bg-gray-200 text-[#4B5563] border border-[#E5E7EB]'
                    }`}
                  >
                    {concern}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sort By */}
          <div>
            <span className="text-xs font-bold text-[#0F0F10] block mb-2">
              Sort By
            </span>
            <div className="space-y-1.5">
              {sortOptions.map((opt) => {
                const isSelected = sortOption === opt.value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => setSortOption(opt.value)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#D4AF37] bg-[#FBF5E8]/60 font-bold text-[#0F0F10]'
                        : 'border-[#E5E7EB] hover:bg-[#FAF9F6] text-[#4B5563]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check size={14} className="text-[#997A2E]" strokeWidth={2.5} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Apply CTA */}
        <button
          onClick={() => setIsFilterSheetOpen(false)}
          className="w-full py-3.5 rounded-full bg-[#0F0F10] hover:bg-[#1F1D22] text-white font-heading font-extrabold text-xs tracking-wide shadow-md active:scale-[0.97] transition-all cursor-pointer"
        >
          Apply Filters &amp; View Formulations
        </button>
      </div>
    </div>
  );
};
