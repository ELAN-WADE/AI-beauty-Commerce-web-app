import React from 'react';
import {
  Search,
  Bell,
  ArrowLeft,
  Plus,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  Store,
  Users
} from '../../common/SolidIcons';
import { useApp } from '../../../context/AppContext';

export interface PartnerTopbarProps {
  kind: 'CREATOR' | 'DISTRIBUTOR';
  onQuickAction?: () => void;
  onOpenNotifications?: () => void;
  onSwitchWorkspace?: (newKind: 'CREATOR' | 'DISTRIBUTOR') => void;
}

export const PartnerTopbar: React.FC<PartnerTopbarProps> = ({
  kind,
  onQuickAction,
  onOpenNotifications,
  onSwitchWorkspace
}) => {
  const { navigateTo, loginAsDemoRole, authUser } = useApp();
  const isCreator = kind === 'CREATOR';
  const rawName = authUser?.profile?.displayName || authUser?.email?.split('@')[0] || (isCreator ? 'CR' : 'DB');
  const initials = rawName
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('') || (isCreator ? 'CR' : 'DB');

  return (
    <header className="h-16 px-6 bg-white border-b border-[#E5E7EB] flex items-center justify-between gap-4 select-none shrink-0">
      {/* Left: Quick search & Return to Storefront */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button
          onClick={() => navigateTo('home')}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E5E7EB] bg-[#FAF9F6] hover:bg-[#F3F4F6] text-xs font-semibold text-[#0F0F10] transition-colors cursor-pointer shrink-0"
          title="Return to the customer storefront"
        >
          <ArrowLeft size={14} className="text-[#6B7280]" />
          <span>Storefront</span>
        </button>

        {/* Workspace Switcher Demo Pill */}
        <div className="hidden lg:flex items-center gap-1 p-0.5 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] shrink-0 text-xs">
          <button
            onClick={() => {
              if (onSwitchWorkspace) onSwitchWorkspace('CREATOR');
              else navigateTo('creators');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              isCreator
                ? 'bg-[#0F0F10] text-[#D4AF37] shadow-xs'
                : 'text-[#6B7280] hover:text-[#0F0F10]'
            }`}
          >
            <Users size={12} />
            <span>Creator Studio</span>
          </button>
          <button
            onClick={() => {
              if (onSwitchWorkspace) onSwitchWorkspace('DISTRIBUTOR');
              else navigateTo('distributor-portal');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              !isCreator
                ? 'bg-[#0F0F10] text-[#D4AF37] shadow-xs'
                : 'text-[#6B7280] hover:text-[#0F0F10]'
            }`}
          >
            <Store size={12} />
            <span>Distributor Hub</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative flex-1 hidden sm:block">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
          />
          <input
            type="search"
            placeholder={
              isCreator
                ? 'Search routines, campaigns, formulations…'
                : 'Search orders, customers, inventory SKUs…'
            }
            className="w-full pl-9 pr-4 py-2 rounded-full border border-[#E5E7EB] bg-[#FAF9F6] text-xs focus:bg-white focus:outline-none focus:border-[#D4AF37] transition-all"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Quick Action Button */}
        <button
          onClick={onQuickAction}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-bold shadow-xs active:scale-[0.97] transition-all cursor-pointer"
        >
          <Plus size={14} className="text-[#D4AF37]" />
          <span>{isCreator ? 'Create Content' : 'New Restock'}</span>
        </button>

        {/* Notifications */}
        <button
          onClick={onOpenNotifications}
          aria-label="View notifications"
          className="relative w-9 h-9 rounded-full hover:bg-[#FAF9F6] text-[#0F0F10] flex items-center justify-center transition-colors cursor-pointer"
        >
          <Bell size={16} />
        </button>

        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full bg-[#0F0F10] text-[#D4AF37] flex items-center justify-center text-xs font-mono font-bold">
          {initials}
        </div>
      </div>
    </header>
  );
};
