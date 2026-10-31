import React from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { ProductImage } from '../common/ProductImage';
import { SpotlightCard } from '../common/SpotlightCard';

interface CategoryMosaicProps {
  onSelectCategory: (category: string) => void;
  onViewAll: () => void;
}

export const CategoryMosaic: React.FC<CategoryMosaicProps> = ({
  onSelectCategory,
  onViewAll
}) => {
  const collections = [
    {
      id: 'barrier-repair',
      title: 'Natural Barrier Precision',
      category: 'skincare',
      image: '/product_barrier_cream.jpg',
      tag: 'Cellular Lipids',
      description: 'Physiological ceramides and bio-identical fatty acids engineered to prevent transepidermal water loss.',
      spanClass: 'lg:col-span-8 min-h-[260px] sm:min-h-[290px]'
    },
    {
      id: 'hyperpigmentation',
      title: 'Pigment Regulation',
      category: 'skincare',
      image: '/product_cleanser.jpg',
      tag: 'Targeted Actives',
      description: 'Stabilized azelaic complex and tyrosinase modulators for post-inflammatory clarity.',
      spanClass: 'lg:col-span-4 min-h-[260px] sm:min-h-[290px]'
    },
    {
      id: 'sun-defense',
      title: 'Invisible Solar Shield',
      category: 'skincare',
      image: '/product_sunscreen.jpg',
      tag: '0% White Cast',
      description: 'Broad-spectrum SPF 50 fluid calibrated for deep Fitzpatrick phototypes.',
      spanClass: 'lg:col-span-4 min-h-[230px] sm:min-h-[250px]'
    },
    {
      id: 'body-lipid',
      title: 'High-Density Body Lipids',
      category: 'body-care',
      image: '/carousel/photo_6_butter.jpg',
      tag: 'Nilotica Shea',
      description: 'Cold-pressed wildcrafted shea matrix melted with biomimetic squalane.',
      spanClass: 'lg:col-span-4 min-h-[230px] sm:min-h-[250px]'
    },
    {
      id: 'botanical-extrait',
      title: 'Haute Extrait Parfumerie',
      category: 'fragrance',
      image: '/carousel/photo_3_apothecary.jpg',
      tag: 'Artisanal Resins',
      description: 'Rare botanical resins, African frankincense, and warm golden amber.',
      spanClass: 'lg:col-span-4 min-h-[230px] sm:min-h-[250px]'
    },
    {
      id: 'barrier-cleanse',
      title: 'Physiological Cleansing Emulsion',
      category: 'skincare',
      image: '/carousel/photo_4_cleanser.jpg',
      tag: 'pH 5.5 Balanced',
      description: 'Sulfate-free lipid wash respecting the epidermal acid mantle and microbiome.',
      spanClass: 'lg:col-span-6 min-h-[240px] sm:min-h-[260px]'
    },
    {
      id: 'peptide-lip',
      title: 'Peptide Lip Architecture',
      category: 'makeup',
      image: '/carousel/photo_7_application.jpg',
      tag: 'Barrier Cushion',
      description: 'Volumizing bio-peptides and plant waxes for lasting nocturnal repair.',
      spanClass: 'lg:col-span-6 min-h-[240px] sm:min-h-[260px]'
    }
  ];

  return (
    <section
      aria-label="Formulation Collections"
      className="py-12 sm:py-16 bg-[#FAF9F6] border-b border-[#E5E7EB]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Breathable Spacing and Concise Subtitle */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-7 sm:mb-9 gap-3">
          <div>
            <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#0F0F10] tracking-tight">
              Curated Collections
            </h2>
            <p className="text-xs sm:text-[13px] text-[#6B7280] mt-1 font-normal max-w-lg">
              Formulations structured by specific epidermal requirement and daily ritual.
            </p>
          </div>

          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex items-center gap-1.5 text-xs font-heading font-semibold text-[#0F0F10] hover:text-[#997A2E] transition-colors cursor-pointer group shrink-0 hover-underline-minimal"
          >
            <span>View Full Catalogue</span>
            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* 7-Item Bento Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-5">
          {collections.map((item) => (
            <SpotlightCard
              key={item.id}
              role="link"
              tabIndex={0}
              onClick={() => onSelectCategory(item.category)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectCategory(item.category);
                }
              }}
              aria-label={`Explore ${item.title}`}
              className={`group rounded-2xl shadow-[0_6px_24px_rgba(0,0,0,0.07)] hover:shadow-[0_14px_36px_rgba(0,0,0,0.14)] bg-white cursor-pointer select-none transition-all duration-300 micro-press flex flex-col justify-end relative overflow-hidden ${item.spanClass}`}
            >
              {/* Background Product Image with Smooth Hover Zoom */}
              <ProductImage
                src={item.image}
                alt={item.title}
                sizes="(max-width: 768px) 100vw, 500px"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />

              {/* Gradient Scrim for Flawless Contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none transition-opacity duration-300 group-hover:from-black/90" />

              {/* Bento Card Content */}
              <div className="relative z-10 p-5 sm:p-6 flex flex-col justify-end text-white">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] font-semibold drop-shadow-xs">
                    {item.tag}
                  </span>
                  <div className="w-6 h-6 rounded-full bg-white/20 group-hover:bg-white group-hover:text-[#0F0F10] text-white flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                    <ArrowUpRight size={12} />
                  </div>
                </div>

                <h3 className="font-heading font-bold text-base sm:text-lg text-white leading-snug drop-shadow-xs mt-1.5">
                  {item.title}
                </h3>

                <p className="text-[11px] sm:text-xs text-white/80 leading-relaxed font-normal mt-1 max-w-md drop-shadow-xs">
                  {item.description}
                </p>
              </div>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  );
};
