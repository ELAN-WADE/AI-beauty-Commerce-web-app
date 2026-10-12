import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Megaphone,
  Wallet,
  User,
  Package,
  Layers,
  Truck,
  MoreHorizontal
} from 'lucide-react';

export interface PartnerMobileBottomNavProps {
  kind: 'CREATOR' | 'DISTRIBUTOR';
  activeRoute: string;
  onRouteChange: (routeId: string) => void;
  badgeCounts?: Record<string, number>;
}

export interface PartnerTabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  isElevated?: boolean;
  badge?: number;
}

export const PartnerMobileBottomNav: React.FC<PartnerMobileBottomNavProps> = ({
  kind,
  activeRoute,
  onRouteChange,
  badgeCounts = {}
}) => {
  const isCreator = kind === 'CREATOR';

  const creatorTabs: PartnerTabItem[] = [
    { id: 'overview', label: 'Home', icon: LayoutDashboard },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
    {
      id: 'create',
      label: 'CREATE',
      icon: PlusCircle,
      isElevated: true
    },
    { id: 'earnings', label: 'Earnings', icon: Wallet },
    { id: 'settings', label: 'Profile', icon: User }
  ];

  const distributorTabs: PartnerTabItem[] = [
    { id: 'overview', label: 'Home', icon: LayoutDashboard },
    {
      id: 'orders',
      label: 'Orders',
      icon: Package,
      badge: badgeCounts.orders || 7
    },
    {
      id: 'restock',
      label: 'RESTOCK',
      icon: Truck,
      isElevated: true
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Layers,
      badge: badgeCounts.lowStock || 4
    },
    { id: 'settings', label: 'More', icon: MoreHorizontal }
  ];

  const tabs = isCreator ? creatorTabs : distributorTabs;

  return (
    <nav
      aria-label="Partner mobile navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] px-2 py-1.5 pb-safe select-none shadow-lg"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeRoute === tab.id;

          if (tab.isElevated) {
            return (
              <button
                key={tab.id}
                onClick={() => onRouteChange(tab.id)}
                className="relative -top-3.5 flex flex-col items-center justify-center cursor-pointer group"
                aria-label={tab.label}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md active:scale-[0.94] transition-transform duration-160 border-2 ${
                    isActive
                      ? 'bg-[#0F0F10] text-[#D4AF37] border-[#D4AF37]'
                      : 'bg-[#0F0F10] text-white border-white'
                  }`}
                >
                  <Icon size={22} className="text-[#D4AF37]" />
                </div>
                <span className="text-[9.5px] font-mono font-extrabold uppercase tracking-wider text-[#0F0F10] mt-0.5">
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onRouteChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-160 cursor-pointer min-w-14 active:scale-[0.95] ${
                isActive ? 'text-[#0F0F10]' : 'text-[#6B7280]'
              }`}
            >
              <div className="relative">
                <Icon
                  size={20}
                  className={isActive ? 'text-[#0F0F10] stroke-[2.3]' : 'text-[#9CA3AF]'}
                />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 px-1.2 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-mono font-bold leading-none">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-1 font-medium ${
                  isActive ? 'font-bold text-[#0F0F10]' : 'text-[#6B7280]'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-3 h-0.5 rounded-full bg-[#D4AF37]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
