import React, { useState, useEffect } from 'react';
import { LayoutGroup } from 'framer-motion';
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

  return (
    <PartnerAppShell
      kind={currentKind}
      activeRoute={activeRoute}
      onRouteChange={changeRoute}
      onQuickAction={handleQuickAction}
      badgeCounts={{
        orders: 0,
        lowStock: 0,
        notifications: 0
      }}
    >
      <LayoutGroup id="partner-portal-layout">
        {renderActiveScreen()}
      </LayoutGroup>
    </PartnerAppShell>
  );
};
