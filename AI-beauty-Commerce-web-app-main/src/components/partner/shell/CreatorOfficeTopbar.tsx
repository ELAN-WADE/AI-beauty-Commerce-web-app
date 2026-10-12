import React, { useState } from 'react';
import {
  Search,
  Bell,
  ArrowLeft,
  ChevronDown,
  Store,
  Users,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export interface CreatorOfficeTopbarProps {
  onOpenNotifications?: () => void;
  onSwitchWorkspace?: (newKind: 'CREATOR' | 'DISTRIBUTOR') => void;
  badgeCounts?: Record<string, number>;
}

export const CreatorOfficeTopbar: React.FC<CreatorOfficeTopbarProps> = ({
  onOpenNotifications,
  onSwitchWorkspace,
  badgeCounts = {}
}) => {
  const { navigateTo, loginAsDemoRole } = useApp();
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);

  return (
    <header className="h-16 px-4 sm:px-6 lg:px-8 bg-white/90 backdrop-blur-md border-b border-[#E5E7EB] flex items-center justify-between gap-4 select-none sticky top-0 z-40">
      {/* Left: Brand & Workspace Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#0F0F10] text-[#D4AF37] flex items-center justify-center font-heading font-black text-lg shadow-xs">
            D
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-black text-base text-[#0F0F10] tracking-tight">
                Delsla!™
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
                Office
              </span>
            </div>
            <p className="text-[10px] text-[#6B7280] font-medium hidden sm:block">
              Creator Editorial Workspace
            </p>
          </div>
        </div>
      </div>

      {/* Center: Search Field */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
          />
          <input
            type="search"
            placeholder="Search routines, campaigns, formulations, earnings…"
            className="w-full pl-9 pr-4 py-2 rounded-full border border-[#E5E7EB] bg-[#FAF9F6] text-xs focus:bg-white focus:outline-none focus:border-[#D4AF37] transition-all"
          />
        </div>
      </div>

      {/* Right: Account Utilities & Intentional Workspace Switching */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Subtle Storefront View Link */}
        <button
          onClick={() => navigateTo('home')}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E5E7EB] bg-[#FAF9F6] hover:bg-[#F3EEE3] text-xs font-semibold text-[#4B5563] hover:text-[#0F0F10] transition-colors cursor-pointer"
          title="Switch to customer storefront"
        >
          <span>Storefront</span>
          <ExternalLink size={11} className="text-[#9CA3AF]" />
        </button>

        {/* Intentional Workspace Switcher Dropdown (No cluttered header pills) */}
        <div className="relative">
          <button
            onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-bold text-[#0F0F10] transition-colors cursor-pointer"
            title="Switch Workspace"
          >
            <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
            <span className="hidden sm:inline">Creator Studio</span>
            <ChevronDown size={13} className="text-[#6B7280]" />
          </button>

          {workspaceMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setWorkspaceMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-[#E5E7EB] shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-[#E5E7EB] mb-1">
                  <span className="text-[10px] font-mono text-[#9CA3AF] uppercase block">
                    Active Workspace
                  </span>
                  <p className="text-xs font-bold text-[#0F0F10]">Delsla Creator Office</p>
                </div>

                <button
                  onClick={() => {
                    setWorkspaceMenuOpen(false);
                    loginAsDemoRole('CREATOR');
                    if (onSwitchWorkspace) onSwitchWorkspace('CREATOR');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#0F0F10] bg-[#FAF9F6] flex items-center gap-2 cursor-pointer"
                >
                  <Users size={14} className="text-[#D4AF37]" />
                  <div className="flex-1">
                    <span className="block font-bold">Creator Studio</span>
                    <span className="text-[10px] text-[#6B7280]">Content & Affiliate Office</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setWorkspaceMenuOpen(false);
                    loginAsDemoRole('DISTRIBUTOR');
                    if (onSwitchWorkspace) onSwitchWorkspace('DISTRIBUTOR');
                    else navigateTo('distributor-portal');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#4B5563] hover:text-[#0F0F10] hover:bg-[#FAF9F6] flex items-center gap-2 cursor-pointer mt-0.5"
                >
                  <Store size={14} className="text-[#6B7280]" />
                  <div className="flex-1">
                    <span className="block font-bold">Distributor Hub</span>
                    <span className="text-[10px] text-[#6B7280]">Inventory & Regional Logistics</span>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Notifications Bell Button */}
        {onOpenNotifications && (
          <button
            onClick={onOpenNotifications}
            className="relative w-9 h-9 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-[#0F0F10] flex items-center justify-center transition-colors cursor-pointer"
            title="Activity & Notifications"
          >
            <Bell size={15} />
            {badgeCounts.notifications ? (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#D4AF37] border-2 border-white" />
            ) : null}
          </button>
        )}

        {/* Creator User Pill */}
        <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-[#E5E7EB]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0F0F10] to-[#27272A] text-[#D4AF37] font-bold text-xs flex items-center justify-center border border-[#D4AF37]/30">
            A
          </div>
          <div className="leading-tight">
            <span className="text-xs font-bold text-[#0F0F10] block">Amara</span>
            <span className="text-[10px] font-mono text-[#997A2E] font-medium block">Luminary</span>
          </div>
        </div>
      </div>
    </header>
  );
};
