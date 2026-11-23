'use client';

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  LayoutDashboard,
  PlusCircle,
  Megaphone,
  Wallet,
  Package,
  Layers,
  Truck,
  MoreHorizontal,
} from '../../common/SolidIcons';
import { DESLA_EASE_OUT } from '../../motion/DeslaMotion';

export interface PartnerMobileBottomNavProps {
  kind: 'CREATOR' | 'DISTRIBUTOR';
  activeRoute: string;
  onRouteChange: (routeId: string) => void;
  onOpenMenu?: () => void;
  badgeCounts?: Record<string, number>;
}

export interface PartnerTabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number | string; className?: string } | any>;
  isElevated?: boolean;
  isMenu?: boolean;
  badge?: number;
}

export const PartnerMobileBottomNav: React.FC<PartnerMobileBottomNavProps> = ({
  kind,
  activeRoute,
  onRouteChange,
  onOpenMenu,
  badgeCounts = {},
}) => {
  const prefersReduced = useReducedMotion();
  const isCreator = kind === 'CREATOR';

  const creatorTabs: PartnerTabItem[] = [
    { id: 'overview', label: 'Home', icon: LayoutDashboard },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
    {
      id: 'create',
      label: 'Create',
      icon: PlusCircle,
      isElevated: true,
    },
    { id: 'earnings', label: 'Earnings', icon: Wallet },
    { id: '__menu__', label: 'More', icon: MoreHorizontal, isMenu: true },
  ];

  const distributorTabs: PartnerTabItem[] = [
    { id: 'overview', label: 'Home', icon: LayoutDashboard },
    {
      id: 'orders',
      label: 'Orders',
      icon: Package,
      badge: badgeCounts.orders || 0,
    },
    {
      id: 'restock',
      label: 'Restock',
      icon: Truck,
      isElevated: true,
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Layers,
      badge: badgeCounts.lowStock || 0,
    },
    { id: '__menu__', label: 'More', icon: MoreHorizontal, isMenu: true },
  ];

  const tabs = isCreator ? creatorTabs : distributorTabs;
  const primaryIds = new Set(tabs.filter((t) => !t.isMenu).map((t) => t.id));

  return (
    <nav
      aria-label="Partner mobile navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FBF9F5]/95 backdrop-blur-xl border-t border-[#E7E1D6] px-2 pt-1.5 pb-[calc(0.35rem+env(safe-area-inset-bottom,0px))] select-none shadow-[0_-10px_28px_-14px_rgba(17,17,17,0.14)]"
    >
      <div className="flex items-end justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.isMenu
            ? !primaryIds.has(activeRoute)
            : activeRoute === tab.id;
          const hasBadge = typeof tab.badge === 'number' && tab.badge > 0;

          if (tab.isElevated) {
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => onRouteChange(tab.id)}
                className="relative -mt-4 flex flex-col items-center justify-center cursor-pointer group px-1"
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center shadow-[0_8px_20px_-6px_rgba(17,17,17,0.45)] active:scale-[0.94] transition-transform duration-150 border-2 ${
                    isActive
                      ? 'bg-[#111111] text-[#E6C77A] border-[#D4AF37]'
                      : 'bg-[#111111] text-[#E6C77A] border-[#FBF9F5]'
                  }`}
                >
                  <Icon size={20} className="text-[#E6C77A]" />
                </div>
                <span className="text-[9.5px] font-medium text-[#111111] mt-1 leading-none">
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => {
                if (tab.isMenu && onOpenMenu) {
                  onOpenMenu();
                } else {
                  onRouteChange(tab.isMenu ? 'settings' : tab.id);
                }
              }}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-transform duration-150 cursor-pointer min-w-[56px] active:scale-[0.95] ${
                isActive ? 'text-[#111111]' : 'text-[#767168]'
              }`}
            >
              <span className="relative flex items-center justify-center w-10 h-6 rounded-full">
                {isActive && (
                  <motion.span
                    layoutId={prefersReduced ? undefined : `partner-nav-pill-${kind}`}
                    transition={prefersReduced ? { duration: 0 } : { duration: 0.2, ease: DESLA_EASE_OUT }}
                    className="absolute inset-0 rounded-full bg-[#111111]/[0.07]"
                    aria-hidden="true"
                  />
                )}
                <Icon
                  size={19}
                  className={`relative z-10 ${isActive ? 'text-[#111111]' : 'text-[#767168]'}`}
                />
                {hasBadge && (
                  <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-rose-600 text-white text-[9px] font-mono font-semibold leading-none flex items-center justify-center">
                    {tab.badge! > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </span>
              <span
                className={`text-[10px] mt-1 leading-none ${
                  isActive ? 'font-semibold text-[#111111]' : 'font-medium text-[#767168]'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
