import React, { useState } from 'react';
import {
  Megaphone,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Download,
  AlertCircle
} from 'lucide-react';
import { FilterTabs } from '../shared/FilterTabs';
import { ActionDrawer } from '../shared/ActionDrawer';

export const CreatorCampaigns: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'completed'>('available');
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);

  const campaigns = [
    {
      id: 'camp-1',
      title: 'Glow Season 2026: The Melanin Radiance Initiative',
      category: 'Seasonal Skincare Campaign',
      commissionRate: '15% Commission',
      bonus: '+ ₦25,000 Milestone Bonus',
      deadline: '12 Days Left',
      eligibility: 'Eligible (Level 3+)',
      deliverables: ['1 High-Resolution Instagram Reel (9:16)', '1 Shoppable Desla Routine published'],
      products: ['Radiant Glow Oil 100ml', 'Gentle Amino Cleanser', 'Sun Defense SPF50+'],
      heroImage: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80',
      description: 'Highlight real skin texture, morning hydration regimens, and clinical barrier restoration. Discourage excessive skin bleaching claims; emphasize radiant healthy nourishment.'
    },
    {
      id: 'camp-2',
      title: 'Harmattan Defense: Maximum Barrier Hydration',
      category: 'Seasonal Climate Campaign',
      commissionRate: '12% Commission',
      bonus: '+ ₦15,000 Bonus',
      deadline: '24 Days Left',
      eligibility: 'Eligible',
      deliverables: ['2 TikTok Application Videos', '1 Skin Article Guide'],
      products: ['Clinical Barrier Cream', 'Hydrating Botanical Mist'],
      heroImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
      description: 'Educate followers on managing extreme harmattan dryness across Northern and Central Nigeria through clinical occlusives and ceramide layering.'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-2 border-b border-[#E5E7EB]">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
          Opportunities &amp; Brand Collaborations
        </span>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10]">
          Creator Campaigns
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
          Join verified brand briefs, access boosted commission rates, and earn milestone bonuses.
        </p>
      </div>

      <FilterTabs
        tabs={[
          { id: 'available', label: 'Available Opportunities', count: 2 },
          { id: 'active', label: 'My Active Briefs', count: 1 },
          { id: 'completed', label: 'Past Completed', count: 4 }
        ]}
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as typeof activeTab)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {campaigns.map((camp) => (
          <article
            key={camp.id}
            className="rounded-3xl border border-[#E5E7EB] bg-white overflow-hidden shadow-xs hover:border-[#D4AF37] hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="relative h-52 w-full bg-[#FAF9F6] overflow-hidden">
                <img
                  src={camp.heroImage}
                  alt={camp.title}
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 bg-[#0F0F10]/80 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-mono font-bold">
                  {camp.category}
                </div>
                <div className="absolute top-3 right-3 bg-rose-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1">
                  <Clock size={11} />
                  <span>{camp.deadline}</span>
                </div>
              </div>

              <div className="p-6 space-y-3">
                <h2 className="font-heading font-extrabold text-xl text-[#0F0F10]">
                  {camp.title}
                </h2>
                <p className="text-xs text-[#6B7280] leading-relaxed line-clamp-2">
                  {camp.description}
                </p>

                <div className="p-3.5 rounded-2xl bg-[#FBF5E8] border border-[#D4AF37]/30 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-[#997A2E] uppercase block">
                      Reward Rate
                    </span>
                    <span className="font-extrabold text-emerald-800 text-sm">
                      {camp.commissionRate}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-[#997A2E] uppercase block">
                      Milestone Reward
                    </span>
                    <span className="font-bold text-[#0F0F10]">{camp.bonus}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0">
              <button
                onClick={() => setSelectedCampaign(camp)}
                className="w-full py-3 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-bold flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer"
              >
                <span>Read Full Brief &amp; Apply</span>
                <ArrowRight size={14} className="text-[#D4AF37]" />
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Campaign Brief Drawer */}
      <ActionDrawer
        isOpen={Boolean(selectedCampaign)}
        onClose={() => setSelectedCampaign(null)}
        title={selectedCampaign?.title || 'Campaign Brief'}
        subtitle={selectedCampaign?.category}
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => {
                alert('Application submitted! Our clinical team will review within 24h.');
                setSelectedCampaign(null);
              }}
              className="flex-1 py-3 rounded-full bg-[#0F0F10] text-[#D4AF37] font-bold text-xs shadow-md cursor-pointer hover:bg-[#27272A]"
            >
              Apply to Campaign
            </button>
          </div>
        }
      >
        {selectedCampaign && (
          <div className="space-y-5 text-xs">
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase text-[#997A2E]">
                Campaign Summary
              </span>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                {selectedCampaign.description}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-[#0F0F10]">Deliverables Required</h4>
              <ul className="space-y-1.5">
                {selectedCampaign.deliverables.map((d: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-[#4B5563]">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-[#0F0F10]">Approved Products</h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedCampaign.products.map((p: string, i: number) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-full bg-white border border-[#E5E7EB] text-xs font-medium text-[#0F0F10]"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </ActionDrawer>
    </div>
  );
};
