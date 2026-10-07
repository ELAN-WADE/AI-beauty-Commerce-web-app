import React, { useState } from 'react';
import {
  Gift,
  Truck,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  PackageCheck,
  AlertCircle
} from 'lucide-react';
import { FilterTabs } from '../shared/FilterTabs';
import { StatusBadge } from '../shared/StatusBadge';

export interface CreatorPRRoomProps {
  onOpenCreateWithBox?: (boxTitle: string) => void;
}

export const CreatorPRRoom: React.FC<CreatorPRRoomProps> = ({
  onOpenCreateWithBox
}) => {
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'delivered'>('available');

  const prBoxes = [
    {
      id: 'pr-1',
      title: 'Radiant Glow Clinical Collection',
      retailValue: '₦64,000',
      status: 'eligible' as const,
      openSpots: '5 spots remaining',
      deliverables: '1 Instagram Reel + 2 Stories',
      items: ['Radiant Glow Oil (100ml)', 'Gentle Amino Cleanser', 'Barrier Essence Mist'],
      thumbnail: 'https://images.unsplash.com/photo-1608248597359-0026e6328325?auto=format&fit=crop&w=400&q=80',
      description: 'Full-sized luxury bottle package formulated for deep melanin illumination.'
    },
    {
      id: 'pr-2',
      title: 'Melanin Barrier & UV Defense Kit',
      retailValue: '₦48,500',
      status: 'eligible' as const,
      openSpots: '8 spots remaining',
      deliverables: '1 Shoppable Routine + 1 TikTok',
      items: ['Sun Defense SPF50+', 'Ceramide Hydration Cream'],
      thumbnail: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=400&q=80',
      description: 'Zero white cast clinical UV defense set.'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-2 border-b border-[#E5E7EB]">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
          VIP Sampling &amp; Press Packaging
        </span>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10]">
          Creator PR Room
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
          Request complimentary formulation boxes shipped to your home, test in real life, and create honest regimens.
        </p>
      </div>

      <FilterTabs
        tabs={[
          { id: 'available', label: 'Available PR Packages', count: 2 },
          { id: 'active', label: 'Dispatched & In Transit', count: 1 },
          { id: 'delivered', label: 'Delivered & Past', count: 6 }
        ]}
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as typeof activeTab)}
      />

      {/* Dispatched Box Alert Banner (Active delivery) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
            <Truck size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs sm:text-sm text-[#0F0F10]">
                Hydration Essentials PR Box — Out with Courier
              </h3>
              <StatusBadge status="in-transit" />
            </div>
            <p className="text-[11px] text-[#6B7280] mt-0.5">
              Gokada Delivery #GOK-8104 • Estimated arrival in Lekki Phase 1 today by 3:00 PM.
            </p>
          </div>
        </div>

        <button
          onClick={() => alert('Courier contact: +234 812 345 6789')}
          className="px-4 py-2 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-semibold text-[#0F0F10] shrink-0 cursor-pointer"
        >
          Track Courier
        </button>
      </div>

      {/* Available Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {prBoxes.map((box) => (
          <article
            key={box.id}
            className="rounded-3xl border border-[#E5E7EB] bg-white overflow-hidden shadow-xs hover:border-[#D4AF37] hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="relative h-48 w-full bg-[#FAF9F6] overflow-hidden">
                <img
                  src={box.thumbnail}
                  alt={box.title}
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 bg-[#0F0F10]/80 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-mono font-bold">
                  {box.retailValue} Value (Free)
                </div>
                <div className="absolute top-3 right-3 bg-emerald-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold">
                  Eligible ✓
                </div>
              </div>

              <div className="p-6 space-y-3">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D97706]">
                    {box.openSpots}
                  </span>
                  <h2 className="font-heading font-extrabold text-xl text-[#0F0F10] mt-0.5">
                    {box.title}
                  </h2>
                </div>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  {box.description}
                </p>

                <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#9CA3AF] uppercase">
                      Deliverables:
                    </span>
                    <span className="font-bold text-[#0F0F10]">{box.deliverables}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#9CA3AF] uppercase">
                      Included Items:
                    </span>
                    <span className="font-medium text-[#4B5563] truncate max-w-[200px]">
                      {box.items.join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0">
              <button
                onClick={() => {
                  alert(`Request submitted for ${box.title}! Dispatch will contact you.`);
                }}
                className="w-full py-3 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-bold flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer"
              >
                <span>Request PR Package to Address</span>
                <ArrowRight size={14} className="text-[#D4AF37]" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
