import { ProgrammeTerms } from './ProgrammeTerms';
import React, { useState, useEffect, useMemo } from 'react';
import { LayoutGroup } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { PartnerAppShell } from './shell/PartnerAppShell';
import { partnerRoute } from '../../lib/portal-navigation';
import { CreatorOverview } from './creator/CreatorOverview';
import { CreatorContentEditor } from './creator/CreatorContentEditor';
import { CreatorContentLibrary } from './creator/CreatorContentLibrary';
import { CreatorCampaigns } from './creator/CreatorCampaigns';
import { CreatorPRRoom } from './creator/CreatorPRRoom';
import { CreatorStorefront } from './creator/CreatorStorefront';
import { CreatorReferralLinks } from './creator/CreatorReferralLinks';
import { CreatorEarnings } from './creator/CreatorEarnings';
import { CreatorNotifications } from './creator/CreatorNotifications';
import { CreatorResources } from './creator/CreatorResources';
import { CreatorSupport } from './creator/CreatorSupport';
import { CreatorSettings } from './creator/CreatorSettings';
import { DistributorOverview } from './distributor/DistributorOverview';
import { DistributorOrders } from './distributor/DistributorOrders';
import { DistributorInventory } from './distributor/DistributorInventory';
import { DistributorRestock } from './distributor/DistributorRestock';
import { DistributorSales } from './distributor/DistributorSales';
import { DistributorEarnings } from './distributor/DistributorEarnings';
import { DistributorTerritory } from './distributor/DistributorTerritory';
import { DistributorReports } from './distributor/DistributorReports';
import { DistributorSupport } from './distributor/DistributorSupport';
import { DistributorSettings } from './distributor/DistributorSettings';

export interface PartnerPortalProps {
  kind: 'CREATOR' | 'DISTRIBUTOR';
}

export const PartnerPortal: React.FC<PartnerPortalProps> = ({ kind: initialKind }) => {
  const currentKind = initialKind;
  const { orders, inventoryItems, selectedCity } = useApp();

  const liveBadges = useMemo(() => {
    const cityKey = (selectedCity || 'Lagos').toLowerCase();
    const pendingOrders = orders.filter((o) =>
      ['PENDING', 'PAID', 'PACKING', 'READY_PICKUP'].includes(String(o.status || '').toUpperCase())
    ).length;
    const lowStock = inventoryItems.filter((inv) => {
      const units = cityKey.includes('abuja')
        ? inv.abujaHub
        : cityKey.includes('port')
          ? inv.phHub
          : cityKey.includes('kano')
            ? inv.kanoHub
            : inv.lagosHub;
      return units <= (inv.lowStockThreshold || 15);
    }).length;
    return {
      orders: pendingOrders,
      lowStock,
      notifications: 0,
    };
  }, [orders, inventoryItems, selectedCity]);

  const [activeRoute, setActiveRoute] = useState<string>(() => partnerRoute(initialKind, typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('workspace') : null));
  const changeRoute = (route: string) => {
    route = partnerRoute(currentKind, route);
    setActiveRoute(route);
    const url = new URL(window.location.href); url.searchParams.set('workspace', route);
    window.history.pushState({}, '', url);
  };
  useEffect(() => {
    const restore = () => setActiveRoute(partnerRoute(currentKind, new URLSearchParams(window.location.search).get('workspace')));
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, [currentKind]);
  useEffect(() => { setActiveRoute(partnerRoute(currentKind, new URLSearchParams(window.location.search).get('workspace'))); }, [currentKind]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const handleQuickAction = () => {
    if (currentKind === 'CREATOR') {
      changeRoute('create');
    } else {
      changeRoute('restock');
    }
  };

  const renderActiveScreen = () => {
    if (currentKind === 'CREATOR') {
      switch (activeRoute) {
        case 'overview':
          return (
            <CreatorOverview
              onNavigate={changeRoute}
              onOpenCreate={() => changeRoute('create')}
            />
          );
        case 'create':
          return (
            <CreatorContentEditor
              onPublishSuccess={() => changeRoute('content')}
              onCancel={() => changeRoute('overview')}
            />
          );
        case 'content':
          return (
            <CreatorContentLibrary
              onOpenCreate={() => changeRoute('create')}
            />
          );
        case 'campaigns':
          return <CreatorCampaigns />;
        case 'pr-room':
          return (
            <CreatorPRRoom
              onOpenCreateWithBox={() => changeRoute('create')}
            />
          );
        case 'storefront':
          return <CreatorStorefront />;
        case 'links':
          return <CreatorReferralLinks />;
        case 'earnings':
          return <CreatorEarnings />;
        case 'notifications':
          return <CreatorNotifications />;
        case 'resources':
          return <CreatorResources />;
        case 'support':
          return <CreatorSupport />;
        case 'settings':
          return <CreatorSettings />;
        default:
          return (
            <CreatorOverview
              onNavigate={changeRoute}
              onOpenCreate={() => changeRoute('create')}
            />
          );
      }
    } else {
      switch (activeRoute) {
        case 'overview':
          return (
            <DistributorOverview
              onNavigate={changeRoute}
              onOpenOrder={(orderId) => {
                setSelectedOrderId(orderId);
                changeRoute('orders');
              }}
              onRestockItem={() => changeRoute('restock')}
            />
          );
        case 'orders':
          return <DistributorOrders initialSelectedOrderId={selectedOrderId} />;
        case 'inventory':
          return (
            <DistributorInventory
              onRestockItem={() => changeRoute('restock')}
            />
          );
        case 'restock':
          return <DistributorRestock />;
        case 'sales':
          return <DistributorSales />;
        case 'earnings':
          return <DistributorEarnings />;
        case 'territory':
          return <DistributorTerritory />;
        case 'reports':
          return <DistributorReports />;
        case 'support':
          return <DistributorSupport />;
        case 'settings':
          return <DistributorSettings />;
        default:
          return (
            <DistributorOverview
              onNavigate={changeRoute}
              onOpenOrder={(orderId) => {
                setSelectedOrderId(orderId);
                changeRoute('orders');
              }}
              onRestockItem={() => changeRoute('restock')}
            />
          );
      }
    }
  };

  const showTermsFooter = ['overview', 'resources', 'settings'].includes(activeRoute);

  return (
    <PartnerAppShell
      kind={currentKind}
      activeRoute={activeRoute}
      onRouteChange={changeRoute}
      onQuickAction={handleQuickAction}
      badgeCounts={liveBadges}
    >
      <LayoutGroup id="partner-portal-layout">
        {renderActiveScreen()}
        {showTermsFooter && (
          <div className="mx-auto max-w-7xl pt-4 sm:p-6">
            <ProgrammeTerms kind={currentKind} />
          </div>
        )}
      </LayoutGroup>
    </PartnerAppShell>
  );
};
