import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Video,
  Megaphone,
  Gift,
  ShoppingBag,
  Link2,
  Wallet,
  Bell,
  BookOpen,
  HelpCircle,
  Settings,
  Package,
  Layers,
  Truck,
  TrendingUp,
  MapPin,
  BarChart2,
  ChevronLeft
} from 'lucide-react';

export type CreatorRouteId =
  | 'overview'
  | 'create'
  | 'content'
  | 'campaigns'
  | 'pr-room'
  | 'storefront'
  | 'links'
  | 'earnings'
  | 'notifications'
  | 'resources'
  | 'support'
  | 'settings';

export type DistributorRouteId =
  | 'overview'
  | 'orders'
  | 'inventory'
  | 'restock'
  | 'sales'
  | 'earnings'
  | 'territory'
  | 'reports'
  | 'support'
  | 'settings';

export interface PartnerSidebarProps {
  kind: 'CREATOR' | 'DISTRIBUTOR';
  activeRoute: string;
  onRouteChange: (routeId: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  badgeCounts?: Record<string, number>;
}

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  isPrimaryAction?: boolean;
  badge?: number;
}

export const PartnerSidebar: React.FC<PartnerSidebarProps> = ({
  kind,
  activeRoute,
  onRouteChange,
  collapsed = false,
  badgeCounts = {}
}) => {
  const isCreator = kind === 'CREATOR';

  const creatorPrimaryNav: SidebarNavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'create', label: 'Create', icon: PlusCircle, isPrimaryAction: true },
    { id: 'content', label: 'My Content', icon: Video },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
    { id: 'pr-room', label: 'PR Room', icon: Gift },
    { id: 'storefront', label: 'Storefront', icon: ShoppingBag },
    { id: 'links', label: 'Links & Promo', icon: Link2 },
    { id: 'earnings', label: 'Earnings', icon: Wallet }
  ];

  const creatorUtilityNav: SidebarNavItem[] = [
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: badgeCounts.notifications || 3 },
    { id: 'resources', label: 'Resources', icon: BookOpen },
    { id: 'support', label: 'Support', icon: HelpCircle },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const distributorPrimaryNav: SidebarNavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: Package, badge: badgeCounts.orders || 7 },
    { id: 'inventory', label: 'Inventory', icon: Layers, badge: badgeCounts.lowStock || 4 },
    { id: 'restock', label: 'Restock', icon: Truck, isPrimaryAction: true },
    { id: 'sales', label: 'Sales', icon: TrendingUp },
    { id: 'earnings', label: 'Earnings', icon: Wallet },
    { id: 'territory', label: 'Territory', icon: MapPin }
  ];

  const distributorUtilityNav: SidebarNavItem[] = [
    { id: 'reports', label: 'Reports', icon: BarChart2 },
    { id: 'support', label: 'Support', icon: HelpCircle },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const primaryNav = isCreator ? creatorPrimaryNav : distributorPrimaryNav;
  const utilityNav = isCreator ? creatorUtilityNav : distributorUtilityNav;

  return (
    <aside
      className={`hidden md:flex flex-col justify-between bg-white border-r border-[#E5E7EB] transition-all duration-200 select-none ${
        collapsed ? 'w-20' : 'w-60 lg:w-64'
      }`}
    >
      {/* Brand & Workspace Identity */}
      <div className="p-5 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#0F0F10] text-[#D4AF37] flex items-center justify-center font-heading font-black text-lg shadow-xs">
            D
          </div>
          {!collapsed && (
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-bold text-base text-[#0F0F10] tracking-tight">
                  Delsla!™
                </span>
                <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider px-2 py-0.2 rounded-full bg-[#FBF5E8] text-[#997A2E] border border-[#D4AF37]/30">
                  {isCreator ? 'Creator' : 'Distributor'}
                </span>
              </div>
              <p className="text-[10px] text-[#6B7280] font-medium tracking-tight mt-0.5">
                {isCreator ? 'Create • Influence • Earn' : 'Stock • Fulfil • Grow'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          {!collapsed && (
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#9CA3AF] px-3 mb-2 block">
              Workspace
            </span>
          )}
          <nav className="space-y-1">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeRoute === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onRouteChange(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-160 cursor-pointer ${
                    isActive
                      ? 'bg-[#0F0F10] text-white shadow-xs'
                      : 'text-[#4B5563] hover:text-[#0F0F10] hover:bg-[#FAF9F6]'
                  }`}
                >
                  <Icon
                    size={17}
                    className={isActive ? 'text-[#D4AF37]' : 'text-[#6B7280]'}
                  />
                  {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                  {!collapsed && item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-[#D4AF37] text-[#0F0F10]'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Utility Navigation */}
        <div className="pt-2 border-t border-[#E5E7EB]/70">
          {!collapsed && (
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#9CA3AF] px-3 mb-2 block">
              Support &amp; Controls
            </span>
          )}
          <nav className="space-y-1">
            {utilityNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeRoute === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onRouteChange(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-160 cursor-pointer ${
                    isActive
                      ? 'bg-[#0F0F10] text-white shadow-xs'
                      : 'text-[#6B7280] hover:text-[#0F0F10] hover:bg-[#FAF9F6]'
                  }`}
                >
                  <Icon
                    size={16}
                    className={isActive ? 'text-[#D4AF37]' : 'text-[#9CA3AF]'}
                  />
                  {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                  {!collapsed && item.badge !== undefined && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Profile / Collapse */}
      <div className="p-3 border-t border-[#E5E7EB] bg-[#FAF9F6]/60">
        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#E5E7EB] flex items-center justify-center text-xs font-bold font-mono text-[#0F0F10] shrink-0 border border-white shadow-2xs">
              {isCreator ? 'AN' : 'AO'}
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-[#0F0F10] truncate">
                  {isCreator ? 'Amara Nnadi' : 'Adewale Okafor'}
                </p>
                <p className="text-[10px] text-[#6B7280] truncate font-mono">
                  {isCreator ? 'Level 3 Luminary' : 'Lagos Central Hub'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
