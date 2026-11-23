import React from 'react';
import { X, Check, SlidersHorizontal, RotateCcw } from '../common/SolidIcons';
import { useApp } from '../../context/AppContext';
import { DeslaMobileDrawer } from '../motion/DeslaMobileDrawer';

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
  } = useApp();

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
    'Natural Barrier Repair',
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
    <DeslaMobileDrawer
      open={isFilterSheetOpen}
      onClose={() => setIsFilterSheetOpen(false)}
      ariaLabel="Filter and sort formulations"
      desktopPanelClassName="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E5E7EB] p-5 sm:p-6"
      mobileContentClassName="bg-white rounded-t-[26px] border-t border-[#E7E1D6] shadow-2xl max-h-[88dvh] flex flex-col overflow-hidden"
    >
      <div className="px-5 pb-5 sm:p-0 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E5E7EB] shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-[#D4AF37]" />
            <h3 className="font-heading font-semibold text-sm text-[#0F0F10]">
              Filter &amp; Sort Formulations
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="text-[11px] font-medium text-[#6B7280] hover:text-[#0F0F10] flex items-center gap-1 cursor-pointer px-2 py-1 rounded-full hover:bg-[#FAF9F6]"
            >
              <RotateCcw size={11} />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={() => setIsFilterSheetOpen(false)}
              className="min-h-9 min-w-9 rounded-full text-gray-400 hover:text-black cursor-pointer flex items-center justify-center"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-4 my-4 max-h-[58dvh] overflow-y-auto overscroll-contain-y pr-1">
          {/* Categories Pillar */}
          <div>
            <span className="text-xs font-medium text-[#0F0F10] block mb-2">
              Taxonomy Pillar
            </span>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => {
                const isActive = selectedCategory.toLowerCase() === cat.value.toLowerCase();
                return (
                  <button
                    type="button"
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-[transform,background-color,color] duration-150 active:scale-95 cursor-pointer ${
                      isActive
                        ? 'bg-[#0F0F10] text-white shadow-sm'
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
            <span className="text-xs font-medium text-[#0F0F10] block mb-2">
              Primary Skin Focus
            </span>
            <div className="flex flex-wrap gap-1.5">
              {concerns.map((concern) => {
                const isActive = selectedConcern === concern;
                return (
                  <button
                    type="button"
                    key={concern}
                    onClick={() => setSelectedConcern(concern)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-[transform,background-color,color] duration-150 active:scale-95 cursor-pointer ${
                      isActive
                        ? 'bg-[#0F0F10] text-white shadow-sm'
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
            <span className="text-xs font-medium text-[#0F0F10] block mb-2">
              Sort By
            </span>
            <div className="space-y-1.5">
              {sortOptions.map((opt) => {
                const isSelected = sortOption === opt.value;
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setSortOption(opt.value)}
                    className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-[border-color,background-color,color] duration-150 text-left ${
                      isSelected
                        ? 'border-[#D4AF37] bg-[#FBF5E8]/60 font-semibold text-[#0F0F10]'
                        : 'border-[#E5E7EB] hover:bg-[#FAF9F6] font-normal text-[#4B5563]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check size={14} className="text-[#997A2E]" strokeWidth={2.5} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Apply CTA */}
        <button
          type="button"
          onClick={() => setIsFilterSheetOpen(false)}
          className="w-full py-3.5 rounded-full bg-[#0F0F10] hover:bg-[#1F1D22] text-white font-heading font-semibold text-xs tracking-wide shadow-md active:scale-[0.97] transition-[transform,background-color] duration-150 cursor-pointer shrink-0"
        >
          Apply Filters &amp; View Formulations
        </button>
      </div>
    </DeslaMobileDrawer>
  );
};
