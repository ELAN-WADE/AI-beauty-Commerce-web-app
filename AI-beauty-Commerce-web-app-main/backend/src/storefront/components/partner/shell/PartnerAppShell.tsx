import React, { useState } from 'react';
import { PartnerMobileBottomNav } from './PartnerMobileBottomNav';
import { CreatorSecondaryNav } from '../creator/CreatorSecondaryNav';
import { DistributorSecondaryNav } from '../distributor/DistributorSecondaryNav';
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
  badgeCounts = {},
  onSwitchWorkspace
}) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const isCreator = kind === 'CREATOR';
  const isOverview = activeRoute === 'overview';

  const notificationsList = isCreator ? [
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
    <div className="min-h-screen bg-[#FFFFFF] text-[#0F0F10] flex flex-col md:flex-row antialiased font-body overflow-x-hidden selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Navigation & Header Strategy:
            - Overview: No topbar or sidebar; direct full-bleed editorial navigation workspace launchpad.
            - Child screens (Creator): CreatorSecondaryNav (sticky top sub-header + floating capsule rail).
            - Child screens (Distributor): DistributorSecondaryNav (sticky top sub-header + floating capsule rail).
        */}
        {!isOverview && (
          isCreator ? (
            <CreatorSecondaryNav
              key="creator-secondary-nav"
              activeRoute={activeRoute}
              onRouteChange={onRouteChange}
              onOpenNotifications={() => setNotificationsOpen(true)}
              onSwitchWorkspace={onSwitchWorkspace}
              badgeCounts={badgeCounts}
            />
          ) : (
            <DistributorSecondaryNav
              key="distributor-secondary-nav"
              activeRoute={activeRoute}
              onRouteChange={onRouteChange}
              onOpenNotifications={() => setNotificationsOpen(true)}
              onSwitchWorkspace={onSwitchWorkspace}
              badgeCounts={badgeCounts}
            />
          )
        )}

        {/* Main Content Viewport */}
        <main
          className={`flex-1 w-full mx-auto pb-24 md:pb-12 ${
            isOverview
              ? 'p-4 sm:p-6 lg:p-10 max-w-7xl'
              : 'p-4 sm:p-6 lg:p-8 max-w-7xl lg:pl-24'
          }`}
        >
          {children}
        </main>

        {/* Mobile Bottom Navigation (Shown on child routes) */}
        {!isOverview && (
          <PartnerMobileBottomNav
            kind={kind}
            activeRoute={activeRoute}
            onRouteChange={onRouteChange}
            badgeCounts={badgeCounts}
          />
        )}
      </div>

      {/* Shared Activity & Notifications Drawer */}
      <ActionDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title="Activity & Notifications"
        subtitle={`${isCreator ? 'Creator Studio' : 'Distributor Hub'} Updates`}
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
