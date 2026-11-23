'use client';

import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowRight } from '@phosphor-icons/react';
import { DepthCard } from '../ui/DepthCard';

interface CreatorCommunitySectionProps {
  selectedCity: string;
  onClientPortalClick: () => void;
  onCreatorPortalClick: () => void;
  onDistributorPortalClick: () => void;
}

export const CreatorCommunitySection: React.FC<CreatorCommunitySectionProps> = ({
  selectedCity,
  onClientPortalClick,
  onCreatorPortalClick,
  onDistributorPortalClick,
}) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
  });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setActiveSlide(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  const portals = [
    {
      id: 'portal-client',
      title: 'Client Sanctuary',
      eyebrow: 'Personalized Care',
      desc: `Personalized skin consultation notes, bespoke regimen archives, and concierge dispatch in ${selectedCity}.`,
      image: '/connect_customer_lush.jpg',
      action: onClientPortalClick,
      actionText: 'Client Account',
    },
    {
      id: 'portal-creator',
      title: 'Creator Collective',
      eyebrow: 'Affiliate Studio',
      desc: 'Collaborate with our Lagos formulation labs, test pre-release preparations, and earn creator commissions.',
      image: '/connect_creator.jpg',
      action: onCreatorPortalClick,
      actionText: 'Join Creator Studio',
    },
    {
      id: 'portal-distributor',
      title: 'Distribution Network',
      eyebrow: 'Commercial Dispensaries',
      desc: 'Dispensary bulk allocations, wholesale margins, and authorized regional stockist dispatch.',
      image: '/connect_distributor.jpg',
      action: onDistributorPortalClick,
      actionText: 'Join Distributor Hub',
    },
  ];

  return (
    <section
      aria-label="Connect with Desla"
      className="py-9 sm:py-16 bg-white border-b border-[#E5E7EB]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-5 sm:mb-9 max-w-xl">
          <h2 className="font-heading font-semibold text-xl sm:text-2xl text-[#0F0F10] tracking-tight">
            Connect with Desla!™
          </h2>
          <p className="text-[13px] sm:text-sm text-[#6B7280] mt-1 font-normal leading-relaxed">
            Specialized access gateways for skincare clients, beauty educators, and certified commercial partners.
          </p>
        </div>

        {/* Mobile (< 768px): Compact Embla 84vw Edge-Peeking Gateway Deck (saves ~650px vertical scroll) */}
        <div className="md:hidden -mx-4">
          <div
            ref={emblaRef}
            className="overflow-hidden px-4"
            style={{ touchAction: 'pan-y pinch-zoom' }}
          >
            <div className="flex gap-3">
              {portals.map((portal) => (
                <button
                  key={portal.id}
                  type="button"
                  onClick={portal.action}
                  className="relative flex-[0_0_84vw] max-w-[330px] h-[240px] rounded-2xl overflow-hidden bg-[#18171B] text-left shrink-0 active:scale-[0.985] transition-transform duration-150 cursor-pointer shadow-[0_14px_30px_-16px_rgba(17,17,17,0.35)]"
                >
                  <img
                    src={portal.image}
                    alt={portal.title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/35 to-black/10" />
                  <div className="relative z-10 h-full p-4 flex flex-col justify-between">
                    <span className="self-start px-2.5 py-1 rounded-full bg-[#1C1712]/45 backdrop-blur-md border border-white/20 text-[9.5px] font-mono uppercase tracking-[0.16em] text-[#E6C77A]">
                      {portal.eyebrow}
                    </span>
                    <div className="space-y-1.5">
                      <h3 className="font-heading font-semibold text-lg text-white leading-tight">
                        {portal.title}
                      </h3>
                      <p className="text-[11.5px] text-white/85 line-clamp-2 leading-relaxed">
                        {portal.desc}
                      </p>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E6C77A] pt-1">
                        <span>{portal.actionText}</span>
                        <ArrowRight size={12} weight="bold" aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-3.5 px-4">
            {portals.map((portal, idx) => (
              <button
                key={portal.id}
                type="button"
                onClick={() => emblaApi?.scrollTo(idx)}
                aria-label={`View ${portal.title}`}
                className={`h-1.5 rounded-full transition-[width,background-color] duration-200 cursor-pointer ${
                  activeSlide === idx ? 'w-5 bg-[#111111]' : 'w-1.5 bg-[#D4CEC3]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Desktop (>= 768px): 3 Selective Depth Card Visual Gateways preserved untouched */}
        <div className="hidden md:grid md:grid-cols-3 gap-5 sm:gap-6">
          {portals.map((portal) => (
            <DepthCard
              key={portal.id}
              image={portal.image}
              eyebrow={portal.eyebrow}
              title={portal.title}
              description={portal.desc}
              onClick={portal.action}
              maxRotation={8}
              maxTranslation={12}
              borderRadius="12px"
              spotlight={false}
              disableOnMobile
              respectReducedMotion
              className="w-full h-[320px] sm:h-[360px]"
              footer={
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37]">
                  <span>{portal.actionText}</span>
                  <ArrowRight size={12} weight="bold" aria-hidden="true" />
                </span>
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
};
