import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ProductImage } from '../common/ProductImage';

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
  onDistributorPortalClick
}) => {
  const portals = [
    {
      id: 'portal-client',
      title: 'Client Sanctuary',
      eyebrow: 'Personalized Care',
      desc: `Personalized skin consultation notes, bespoke regimen archives, and concierge dispatch in ${selectedCity}.`,
      image: '/connect_customer_lush.jpg',
      action: onClientPortalClick,
      actionText: 'Client Account'
    },
    {
      id: 'portal-creator',
      title: 'Creator Collective',
      eyebrow: 'Affiliate Studio',
      desc: 'Collaborate with our Lagos formulation labs, test pre-release preparations, and earn creator commissions.',
      image: '/connect_creator.jpg',
      action: () => window.location.assign('/partners?programme=creative'),
      actionText: 'Join Creator Studio'
    },
    {
      id: 'portal-distributor',
      title: 'Distribution Network',
      eyebrow: 'Commercial Dispensaries',
      desc: 'Dispensary bulk allocations, wholesale margins, and authorized regional stockist dispatch.',
      image: '/connect_distributor.jpg',
      action: () => window.location.assign('/partners?programme=trade'),
      actionText: 'Join Distributor Hub'
    }
  ];

  return (
    <section
      aria-label="Connect with Desla"
      className="py-12 sm:py-16 bg-white border-b border-[#E5E7EB]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-7 sm:mb-9 max-w-xl">
          <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#0F0F10] tracking-tight">
            Connect with Desla!™
          </h2>
          <p className="text-xs sm:text-[13px] text-[#6B7280] mt-1 font-normal leading-relaxed">
            Specialized access gateways for skincare clients, beauty educators, and certified commercial partners.
          </p>
        </div>

        {/* 3 Sleek Editorial Visual Gateway Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {portals.map((portal) => (
            <article
              key={portal.id}
              role="button"
              tabIndex={0}
              onClick={portal.action}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  portal.action();
                }
              }}
              className="group cursor-pointer p-4 sm:p-5 rounded-2xl frosted-glass-surface border border-white/80 space-y-3.5 focus-visible:outline-none micro-press shadow-2xs hover:border-[#0F0F10]/25 transition-all"
            >
              {/* Clean Image Frame */}
              <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-[#FAF9F6] border border-[#E5E7EB]/80">
                <ProductImage
                  src={portal.image}
                  alt={portal.title}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="w-full h-full object-cover image-subtle-zoom"
                />
              </div>

              {/* Text Layer with Concise Body Text */}
              <div className="space-y-1">
                <p className="text-[9.5px] font-mono uppercase tracking-wider text-[#8E8E93] font-semibold">
                  {portal.eyebrow}
                </p>
                <h3 className="font-heading font-bold text-base text-[#0F0F10] group-hover:text-[#997A2E] transition-colors">
                  {portal.title}
                </h3>
                <p className="text-xs text-[#6B7280] leading-relaxed font-normal pt-0.5">
                  {portal.desc}
                </p>
                <div className="pt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F0F10] group-hover:text-[#997A2E] hover-underline-minimal">
                  <span>{portal.actionText}</span>
                  <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
