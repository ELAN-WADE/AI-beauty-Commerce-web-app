import React from 'react';
import { ArrowLeft, Bell, Store, Users } from '../../common/SolidIcons';
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
  const { navigateTo, authUser } = useApp();
  const isCreator = kind === 'CREATOR';
  const rawName = authUser?.profile?.displayName || authUser?.email?.split('@')[0] || (isCreator ? 'CR' : 'DB');
  const initials = rawName
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('') || (isCreator ? 'CR' : 'DB');

  return (
    <header className="md:hidden sticky top-0 z-40 h-14 px-4 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] flex items-center justify-between select-none">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigateTo('home')}
          className="p-2 min-h-10 min-w-10 rounded-full hover:bg-[#F3F4F6] text-[#4B5563] cursor-pointer flex items-center justify-center"
          title="Return to storefront"
          aria-label="Return to storefront"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-1.5">
          <span className="font-heading font-black text-base text-[#0F0F10] tracking-tight">
            Delsla!™
          </span>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FBF5E8] text-[#997A2E]">
            {isCreator ? 'Creator' : 'Distributor'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenNotifications}
          aria-label="View notifications"
          className="relative w-9 h-9 rounded-full hover:bg-[#FAF9F6] flex items-center justify-center text-[#0F0F10] cursor-pointer"
        >
          <Bell size={16} />
        </button>

        <button
          onClick={onOpenMore}
          aria-label="Open menu"
          className="w-9 h-9 rounded-full bg-[#0F0F10] text-[#D4AF37] flex items-center justify-center text-xs font-mono font-bold cursor-pointer"
        >
          {initials}
        </button>
      </div>
    </header>
  );
};
