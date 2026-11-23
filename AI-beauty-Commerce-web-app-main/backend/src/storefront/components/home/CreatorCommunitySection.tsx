import React from 'react';
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
      className="py-12 sm:py-16 bg-white border-b border-[#E5E7EB]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-7 sm:mb-9 max-w-xl">
          <h2 className="font-heading font-semibold text-xl sm:text-2xl text-[#0F0F10] tracking-tight">
            Connect with Desla!™
          </h2>
          <p className="text-[13px] sm:text-sm text-[#6B7280] mt-1 font-normal leading-relaxed">
            Specialized access gateways for skincare clients, beauty educators, and certified commercial partners.
          </p>
        </div>

        {/* 3 Selective Depth Card Visual Gateways */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
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
