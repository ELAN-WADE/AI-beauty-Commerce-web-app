import React, { useState } from 'react';
import { PartnerSidebar } from './PartnerSidebar';
import { PartnerTopbar } from './PartnerTopbar';
import { PartnerMobileHeader } from './PartnerMobileHeader';
import { PartnerMobileBottomNav } from './PartnerMobileBottomNav';
import { ActionDrawer } from '../shared/ActionDrawer';

export interface PartnerAppShellProps {
  kind: 'CREATOR' | 'DISTRIBUTOR';
  activeRoute: string;
  onRouteChange: (routeId: string) => void;
  children: React.ReactNode;
  onQuickAction?: () => void;
  badgeCounts?: Record<string, number>;
  onSwitchWorkspace?: (newKind: 'CREATOR' | 'DISTRIBUTOR') => void;
}

export const PartnerAppShell: React.FC<PartnerAppShellProps> = ({
  kind,
  activeRoute,
  onRouteChange,
  children,
  onQuickAction,
  badgeCounts = {},
  onSwitchWorkspace
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const notificationsList = kind === 'CREATOR' ? [
    { id: '1', title: 'New Campaign Invitation', desc: 'Glow Season 2026 has opened for VIP application.', time: '2h ago', unread: true },
    { id: '2', title: 'PR Package Approved', desc: 'Your Radiant Glow Collection PR box is being packed.', time: '5h ago', unread: true },
    { id: '3', title: 'Commission Cleared', desc: '₦18,400 from client order ORD-LAG-7819 moved to available balance.', time: '1d ago', unread: false },
    { id: '4', title: 'New Formulation Launched', desc: 'Clinical Barrier Cream SPF50+ now available to tag in routines.', time: '2d ago', unread: false }
  ] : [
    { id: '1', title: '7 New Pickup Orders', desc: 'Clients have chosen your hub for same-day delivery today.', time: '15m ago', unread: true },
    { id: '2', title: 'Low Stock Alert', desc: 'Radiant Glow Oil has reached 8 remaining units (threshold: 20).', time: '1h ago', unread: true },
    { id: '3', title: 'Wholesale Restock Dispatched', desc: 'Central Lab batch #LAB-409 is in transit to Lagos Central.', time: '4h ago', unread: false },
    { id: '4', title: 'Settlement Cleared', desc: '₦320,450 wholesale margin transferred to your bank account.', time: '1d ago', unread: false }
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0F0F10] flex flex-col md:flex-row antialiased font-body overflow-x-hidden">
      {/* Desktop Sidebar */}
      <PartnerSidebar
        kind={kind}
        activeRoute={activeRoute}
        onRouteChange={onRouteChange}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        badgeCounts={badgeCounts}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Desktop Topbar */}
        <div className="hidden md:block">
          <PartnerTopbar
            kind={kind}
            onQuickAction={onQuickAction}
            onOpenNotifications={() => setNotificationsOpen(true)}
            onSwitchWorkspace={onSwitchWorkspace}
          />
        </div>

        {/* Mobile Header */}
        <PartnerMobileHeader
          kind={kind}
          onOpenNotifications={() => setNotificationsOpen(true)}
          onOpenMore={() => onRouteChange('settings')}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <PartnerMobileBottomNav
          kind={kind}
          activeRoute={activeRoute}
          onRouteChange={onRouteChange}
          badgeCounts={badgeCounts}
        />
      </div>

      {/* Shared Notifications Drawer */}
      <ActionDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title="Activity & Notifications"
        subtitle={`${kind === 'CREATOR' ? 'Creator Studio' : 'Distributor Hub'} Updates`}
        width="md"
      >
        <div className="divide-y divide-[#E5E7EB]">
          {notificationsList.map((n) => (
            <div key={n.id} className="py-3.5 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-xs font-bold text-[#0F0F10] flex items-center gap-1.5">
                  {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0" />}
                  <span>{n.title}</span>
                </h4>
                <span className="text-[10px] text-[#9CA3AF] font-mono shrink-0">{n.time}</span>
              </div>
              <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">{n.desc}</p>
            </div>
          ))}
        </div>
      </ActionDrawer>
    </div>
  );
};
