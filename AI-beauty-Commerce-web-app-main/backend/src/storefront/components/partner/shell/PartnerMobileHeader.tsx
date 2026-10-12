import React from 'react';
import { ArrowLeft, Bell, Store, Users } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export interface PartnerMobileHeaderProps {
  kind: 'CREATOR' | 'DISTRIBUTOR';
  onOpenNotifications?: () => void;
  onOpenMore?: () => void;
}

export const PartnerMobileHeader: React.FC<PartnerMobileHeaderProps> = ({
  kind,
  onOpenNotifications,
  onOpenMore
}) => {
  const { navigateTo } = useApp();
  const isCreator = kind === 'CREATOR';

  return (
    <header className="md:hidden sticky top-0 z-40 h-14 px-4 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] flex items-center justify-between select-none">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigateTo('home')}
          className="p-1.5 rounded-full hover:bg-[#F3F4F6] text-[#4B5563] cursor-pointer"
          title="Return to storefront"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-1.5">
          <span className="font-heading font-black text-base text-[#0F0F10] tracking-tight">
            Delsla!™
          </span>
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FBF5E8] text-[#997A2E] border border-[#D4AF37]/30">
            {isCreator ? 'Creator' : 'Distributor'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenNotifications}
          aria-label="View notifications"
          className="relative w-8 h-8 rounded-full border border-[#E5E7EB] flex items-center justify-center text-[#4B5563] cursor-pointer"
        >
          <Bell size={15} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
        </button>

        <button
          onClick={onOpenMore}
          className="w-8 h-8 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] flex items-center justify-center text-[11px] font-mono font-bold text-[#0F0F10] cursor-pointer"
        >
          {isCreator ? 'AN' : 'AO'}
        </button>
      </div>
    </header>
  );
};
