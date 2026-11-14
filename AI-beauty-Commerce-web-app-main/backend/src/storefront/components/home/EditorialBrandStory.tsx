import React from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowRight } from '@phosphor-icons/react';
import { ProductImage } from '../common/ProductImage';

interface EditorialBrandStoryProps {
  onLearnMoreClick: () => void;
}

export const EditorialBrandStory: React.FC<EditorialBrandStoryProps> = ({
  onLearnMoreClick
}) => {
  const { brandStory } = useApp();
  if (!brandStory.heading.trim()) return null;
  return (
    <section
      aria-label="Brand Philosophy & Standards"
      className="py-14 sm:py-20 bg-[#FAF9F6] border-b border-[#E5E7EB]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Left Column: Clean Photographic Frame */}
          <div className="lg:col-span-6">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-white border border-[#E5E7EB] shadow-xs">
              <ProductImage
                src={brandStory.image}
                alt="Desla! natural formulation laboratory and raw botanicals"
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="w-full h-full object-cover image-subtle-zoom"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />

              <div className="absolute bottom-3.5 left-4 right-4 flex items-center justify-between text-white text-[10.5px]">
                <span className="font-serif italic text-xs text-[#D4AF37]">
                  {brandStory.tagline}
                </span>
                <span className="frosted-glass-scrim px-2.5 py-0.5 rounded-full font-mono text-[9.5px] text-gray-200">
                  {brandStory.badge1}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Story Narrative & Standards */}
          <div className="lg:col-span-6 space-y-5">
            <div className="space-y-0.5">
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#8E8E93] font-semibold">
                Our Philosophy
              </p>
              <h2 className="font-heading font-extrabold text-section-fluid text-[#0F0F10] tracking-tight leading-tight">{brandStory.heading}</h2>
            </div>

            <div className="space-y-2.5 text-xs sm:text-[13px] text-[#4B5563] leading-relaxed font-normal">
              <p>{brandStory.paragraph1}</p>
              <p>{brandStory.paragraph2}</p>
            </div>

            <div className="frosted-glass-surface rounded-xl p-4 border border-white/90 space-y-2 text-xs">{[brandStory.badge1, brandStory.badge2].filter(Boolean).map(badge => <p key={badge}>{badge}</p>)}</div>
            <div className="pt-1">
              <button
                type="button"
                onClick={onLearnMoreClick}
                className="inline-flex items-center gap-1.5 text-xs font-heading font-semibold text-[#0F0F10] hover:text-[#997A2E] transition-colors cursor-pointer group hover-underline-minimal"
              >
                <span>Discover Our Botanical Standards</span>
                <ArrowRight size={13} weight="bold" className="text-[#0F0F10] group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
