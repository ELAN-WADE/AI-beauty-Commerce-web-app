import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PartnerAppShell } from './shell/PartnerAppShell';

// Creator Studio Screens
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

// Distributor Hub Screens
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
  const { navigateTo, loginAsDemoRole } = useApp();
  const [currentKind, setCurrentKind] = useState<'CREATOR' | 'DISTRIBUTOR'>(initialKind);
  const [activeRoute, setActiveRoute] = useState<string>('overview');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const handleSwitchWorkspace = (newKind: 'CREATOR' | 'DISTRIBUTOR') => {
    setCurrentKind(newKind);
    setActiveRoute('overview');
    loginAsDemoRole(newKind);
  };

  const handleQuickAction = () => {
    if (currentKind === 'CREATOR') {
      setActiveRoute('create');
    } else {
      setActiveRoute('restock');
    }
  };

  const renderActiveScreen = () => {
    if (currentKind === 'CREATOR') {
      switch (activeRoute) {
        case 'overview':
          return (
            <CreatorOverview
              onNavigate={(routeId) => setActiveRoute(routeId)}
              onOpenCreate={() => setActiveRoute('create')}
            />
          );
        case 'create':
          return (
            <CreatorContentEditor
              onPublishSuccess={() => setActiveRoute('content')}
              onCancel={() => setActiveRoute('overview')}
            />
          );
        case 'content':
          return (
            <CreatorContentLibrary
              onOpenCreate={() => setActiveRoute('create')}
            />
          );
        case 'campaigns':
          return <CreatorCampaigns />;
        case 'pr-room':
          return (
            <CreatorPRRoom
              onOpenCreateWithBox={() => setActiveRoute('create')}
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
              onNavigate={(routeId) => setActiveRoute(routeId)}
              onOpenCreate={() => setActiveRoute('create')}
            />
          );
      }
    } else {
      switch (activeRoute) {
        case 'overview':
          return (
            <DistributorOverview
              onNavigate={(routeId) => setActiveRoute(routeId)}
              onOpenOrder={(orderId) => {
                setSelectedOrderId(orderId);
                setActiveRoute('orders');
              }}
              onRestockItem={() => setActiveRoute('restock')}
            />
          );
        case 'orders':
          return <DistributorOrders initialSelectedOrderId={selectedOrderId} />;
        case 'inventory':
          return (
            <DistributorInventory
              onRestockItem={() => setActiveRoute('restock')}
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
              onNavigate={(routeId) => setActiveRoute(routeId)}
              onOpenOrder={(orderId) => {
                setSelectedOrderId(orderId);
                setActiveRoute('orders');
              }}
              onRestockItem={() => setActiveRoute('restock')}
            />
          );
      }
    }
  };

  return (
    <PartnerAppShell
      kind={currentKind}
      activeRoute={activeRoute}
      onRouteChange={setActiveRoute}
      onQuickAction={handleQuickAction}
      onSwitchWorkspace={handleSwitchWorkspace}
      badgeCounts={{
        orders: 7,
        lowStock: 4,
        notifications: 3
      }}
    >
      {renderActiveScreen()}
    </PartnerAppShell>
  );
};
