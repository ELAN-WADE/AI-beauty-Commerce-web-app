import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { PartnerProgrammeSelector } from './PartnerProgrammeSelector';
import { usePartnerRecords } from '../../../lib/use-partner-records';
import { ActionDrawer } from '../shared/ActionDrawer';
import { BrandLogo } from '../../common/BrandLogo';
import { useApp } from '../../../context/AppContext';
import {
  ArrowLeft,
  BarChart2,
  Bell,
  BookOpen,
  ExternalLink,
  Gift,
  HelpCircle,
  Layers,
  LayoutDashboard,
  Link2,
  MapPin,
  Megaphone,
  Menu,
  Package,
  PlusCircle,
  Settings,
  ShoppingBag,
  TrendingUp,
  Truck,
  Video,
  Wallet,
  X
} from '../../common/SolidIcons';

export interface PartnerAppShellProps {
  kind: 'CREATOR' | 'DISTRIBUTOR';
  activeRoute: string;
  onRouteChange: (routeId: string) => void;
  children: React.ReactNode;
  onQuickAction?: () => void;
  badgeCounts?: Record<string, number>;
  onSwitchWorkspace?: (newKind: 'CREATOR' | 'DISTRIBUTOR') => void;
}

interface DrawerNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number | string; className?: string } | any>;
  badge?: number;
}

export const PartnerAppShell: React.FC<PartnerAppShellProps> = ({
  kind,
  activeRoute,
  onRouteChange,
  children,
  badgeCounts = {}
}) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { navigateTo } = useApp();
  const { records } = usePartnerRecords(kind);
  const shouldReduceMotion = useReducedMotion();

  const isCreator = kind === 'CREATOR';
  const isOverview = activeRoute === 'overview';

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  const notificationsList = records
    .filter((record) => record.kind === 'ANNOUNCEMENT' && record.status === 'PUBLISHED')
    .map((record) => ({
      id: record.id,
      title: record.title,
      desc: record.body,
      time: new Date(record.updatedAt).toLocaleString(),
      unread: false
    }));

  const creatorNavItems: DrawerNavItem[] = [
    { id: 'overview', label: 'Creator Dashboard', icon: LayoutDashboard },
    { id: 'create', label: 'Creator Studio', icon: PlusCircle },
    { id: 'content', label: 'My Content', icon: Video },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
    { id: 'pr-room', label: 'PR Room', icon: Gift },
    { id: 'storefront', label: 'Storefront', icon: ShoppingBag },
    { id: 'links', label: 'Links & Promo', icon: Link2 },
    { id: 'earnings', label: 'Earnings', icon: Wallet },
    { id: 'notifications', label: 'Post & Telemetry', icon: Bell, badge: badgeCounts.notifications },
    { id: 'resources', label: 'Resources', icon: BookOpen },
    { id: 'support', label: 'Support', icon: HelpCircle },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const distributorNavItems: DrawerNavItem[] = [
    { id: 'overview', label: 'Distributor Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Hub Orders', icon: Package, badge: badgeCounts.orders },
    { id: 'restock', label: 'Bulk Restock', icon: Truck },
    { id: 'inventory', label: 'Inventory Vault', icon: Layers, badge: badgeCounts.lowStock },
    { id: 'sales', label: 'Sales & Velocity', icon: TrendingUp },
    { id: 'earnings', label: 'Wholesale Margins', icon: Wallet },
    { id: 'territory', label: 'Delivery Territory', icon: MapPin },
    { id: 'reports', label: 'Performance & SLA', icon: BarChart2 },
    { id: 'support', label: 'Support', icon: HelpCircle },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const navItems = isCreator ? creatorNavItems : distributorNavItems;

  const handleNavigate = (routeId: string) => {
    setDrawerOpen(false);
    onRouteChange(routeId);
  };

  return (
    <div className="min-h-[100dvh] bg-[#FFFFFF] text-[#0F0F10] flex flex-col antialiased font-body overflow-x-hidden selection:bg-[#0F0F10]/10 selection:text-[#0F0F10]">
      {/* Compact Branded Logo + Hamburger Header */}
      <header className="sticky top-0 z-40 h-14 px-4 sm:px-6 lg:px-8 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] flex items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-2">
          <BrandLogo
            variant="dark"
            size="sm"
            onClick={() => onRouteChange('overview')}
          />
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={drawerOpen}
            aria-controls="partner-navigation-drawer"
            className="min-h-11 min-w-11 rounded-lg flex items-center justify-center text-[#0F0F10] hover:bg-[#FAF9F6] active:scale-[0.97] transition-all cursor-pointer touch-manipulation"
          >
            <Menu size={20} />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {!isOverview && (
            <button
              type="button"
              onClick={() => onRouteChange('overview')}
              className="min-h-11 px-3 rounded-lg text-xs font-medium text-[#4B5563] hover:text-[#0F0F10] hover:bg-[#FAF9F6] flex items-center gap-1.5 transition-colors cursor-pointer touch-manipulation"
            >
              <ArrowLeft size={14} />
              <span>Dashboard</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            aria-label="Notifications"
            className="relative min-h-11 min-w-11 rounded-lg hover:bg-[#FAF9F6] text-[#0F0F10] flex items-center justify-center transition-colors cursor-pointer touch-manipulation"
          >
            <Bell size={18} />
            {(badgeCounts.notifications ?? 0) > 0 && (
              <span className="sr-only">Unread notifications</span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 w-full mx-auto px-4 py-5 sm:p-6 lg:px-8 lg:py-8 max-w-6xl">
        {children}
      </main>

      {/* Minimalist Slide-Out Hamburger Navigation Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 flex" id="partner-navigation-drawer" role="dialog" aria-modal="true" aria-label="Workspace navigation">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black/35 backdrop-blur-[1px]"
            />

            <motion.aside
              initial={shouldReduceMotion ? false : { x: '-100%' }}
              animate={{ x: 0 }}
              exit={shouldReduceMotion ? undefined : { x: '-100%' }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.28, ease: [0.32, 0.72, 0, 1] }}
              className="relative z-10 w-80 max-w-[85vw] h-[100dvh] bg-white border-r border-[#E5E7EB] flex flex-col justify-between shadow-2xl"
            >
              <div className="h-14 px-4 border-b border-[#E5E7EB] flex items-center justify-between shrink-0">
                <BrandLogo
                  variant="dark"
                  size="sm"
                  onClick={() => handleNavigate('overview')}
                />
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close navigation menu"
                  className="min-h-11 min-w-11 rounded-lg flex items-center justify-center text-[#4B5563] hover:text-[#0F0F10] hover:bg-[#FAF9F6] transition-colors cursor-pointer touch-manipulation"
                >
                  <X size={18} />
                </button>
              </div>

              <nav aria-label={isCreator ? 'Creator destinations' : 'Distributor destinations'} className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeRoute === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavigate(item.id)}
                      className={`w-full min-h-11 px-3 rounded-xl flex items-center justify-between text-sm transition-colors cursor-pointer touch-manipulation ${
                        isActive
                          ? 'bg-[#0F0F10] text-white font-medium'
                          : 'text-[#4B5563] hover:bg-[#FAF9F6] hover:text-[#0F0F10] font-normal'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon size={17} className={isActive ? 'text-white' : 'text-[#6B7280]'} />
                        <span>{item.label}</span>
                      </span>
                      {typeof item.badge === 'number' && item.badge > 0 && (
                        <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${isActive ? 'bg-white/15 text-white' : 'bg-[#FAF9F6] text-[#0F0F10]'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-[#E5E7EB] space-y-3 bg-[#FAF9F6]/60 shrink-0">
                <PartnerProgrammeSelector kind={kind} />
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    navigateTo('home');
                  }}
                  className="w-full min-h-11 px-3 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-medium text-[#0F0F10] flex items-center justify-between transition-colors cursor-pointer touch-manipulation"
                >
                  <span>Return to Storefront</span>
                  <ExternalLink size={14} className="text-[#6B7280]" />
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Shared Activity & Notifications Drawer */}
      <ActionDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title="Activity & Notifications"
        subtitle={`${isCreator ? 'Creator Studio' : 'Distributor Hub'} Updates`}
        width="md"
      >
        <div className="divide-y divide-[#E5E7EB]">
          {notificationsList.length === 0 && (
            <button
              type="button"
              className="text-sm underline underline-offset-4 text-[#0F0F10] py-2 cursor-pointer"
              onClick={() => {
                setNotificationsOpen(false);
                onRouteChange(isCreator ? 'notifications' : 'orders');
              }}
            >
              Open live workspace activity
            </button>
          )}
          {notificationsList.map((n) => (
            <div key={n.id} className="py-3.5 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-xs font-medium text-[#0F0F10]">{n.title}</h4>
                <span className="text-[11px] text-[#6B7280] font-mono shrink-0">{n.time}</span>
              </div>
              <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">{n.desc}</p>
            </div>
          ))}
        </div>
      </ActionDrawer>
    </div>
  );
};
