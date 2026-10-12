import React from 'react';
import {
  ArrowLeft,
  LayoutGrid,
  Package,
  Truck,
  Layers,
  Wallet,
  TrendingUp,
  MapPin,
  FileText,
  PhoneCall,
  Settings,
  Bell
} from 'lucide-react';

export interface DistributorSecondaryNavProps {
  activeRoute: string;
  onRouteChange: (routeId: string) => void;
  onOpenNotifications?: () => void;
  onSwitchWorkspace?: (newKind: 'CREATOR' | 'DISTRIBUTOR') => void;
  badgeCounts?: Record<string, number>;
}

export const DistributorSecondaryNav: React.FC<DistributorSecondaryNavProps> = ({
  activeRoute,
  onRouteChange,
  onOpenNotifications,
  onSwitchWorkspace,
  badgeCounts = {}
}) => {
  const destinations = [
    { id: 'orders', label: 'Hub Orders', icon: Package },
    { id: 'restock', label: 'Bulk Restock', icon: Truck },
    { id: 'inventory', label: 'Inventory Vault', icon: Layers },
    { id: 'earnings', label: 'Wholesale Margins', icon: Wallet },
    { id: 'sales', label: 'Sales & Velocity', icon: TrendingUp },
    { id: 'territory', label: 'Delivery Territory', icon: MapPin },
    { id: 'reports', label: 'Performance & SLA', icon: FileText },
    { id: 'support', label: 'Support & Concierge', icon: PhoneCall },
    { id: 'settings', label: 'Facility Settings', icon: Settings }
  ];

  const currentDestination = destinations.find((d) => d.id === activeRoute) || {
    id: activeRoute,
    label: activeRoute.charAt(0).toUpperCase() + activeRoute.slice(1),
    icon: LayoutGrid
  };

  return (
    <div key="distributor-secondary-nav-root" className="contents">
      {/* 1. Sleek Editorial Top Sub-Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 select-none">
        {/* Left: ← Distributor Hub / Section */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onRouteChange('overview')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-semibold text-[#0F0F10] transition-colors cursor-pointer group active:scale-[0.97]"
            title="Return to Distributor Hub Overview"
          >
            <ArrowLeft
              size={13}
              className="text-[#997A2E] group-hover:-translate-x-0.5 transition-transform"
            />
            <span>Distributor Hub</span>
          </button>

          <span className="text-[#D1D5DB] font-light text-sm">/</span>

          <span className="text-xs sm:text-sm font-bold text-[#0F0F10] tracking-tight">
            {currentDestination.label}
          </span>
        </div>

        {/* Right: Notifications */}
        <div className="flex items-center gap-2">
          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              className="relative w-8 h-8 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-[#0F0F10] flex items-center justify-center transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell size={14} className="text-[#4B5563]" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            </button>
          )}
        </div>
      </header>

      {/* 2. Detached Floating Capsule Rail */}
      <aside
        aria-label="Floating hub operations rail"
        className="hidden lg:flex fixed left-5 top-28 z-40 flex-col items-center gap-2 p-2 rounded-3xl bg-white border border-[#E5E7EB] shadow-sm"
      >
        {/* Hub Grid Home Icon */}
        <button
          onClick={() => onRouteChange('overview')}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer group relative ${
            activeRoute === 'overview'
              ? 'bg-[#0F0F10] text-[#D4AF37]'
              : 'text-[#6B7280] hover:text-[#0F0F10] hover:bg-[#FAF9F6]'
          }`}
          title="Distributor Hub Home"
        >
          <LayoutGrid size={16} />
          <span className="absolute left-full ml-3 px-2 py-1 bg-[#0F0F10] text-white text-[10px] font-bold rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            Distributor Hub Home
          </span>
        </button>

        {/* Workflow Destinations */}
        {destinations.map((dest) => {
          const Icon = dest.icon;
          const isActive = activeRoute === dest.id;
          return (
            <button
              key={dest.id}
              onClick={() => onRouteChange(dest.id)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer group relative ${
                isActive
                  ? 'bg-[#0F0F10] text-[#D4AF37] shadow-2xs'
                  : 'text-[#6B7280] hover:text-[#0F0F10] hover:bg-[#FAF9F6]'
              }`}
              title={dest.label}
            >
              <Icon size={16} />
              <span className="absolute left-full ml-3 px-2 py-1 bg-[#0F0F10] text-white text-[10px] font-bold rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                {dest.label}
              </span>
            </button>
          );
        })}
      </aside>

      {/* 3. Floating Bottom-Left "Creator Studio" Switch Button */}
      <div className="hidden lg:block fixed left-4 bottom-7 z-40">
        <button
          onClick={() => {
            if (onSwitchWorkspace) {
              onSwitchWorkspace('CREATOR');
            } else {
              onRouteChange('settings');
            }
          }}
          className="px-4 py-2 rounded-full bg-[#0F0F10] hover:bg-black text-white text-[11px] font-bold shadow-md cursor-pointer tracking-tight transition-all active:scale-95"
          title="Switch to Creator Studio"
        >
          Creator Studio
        </button>
      </div>
    </div>
  );
};
