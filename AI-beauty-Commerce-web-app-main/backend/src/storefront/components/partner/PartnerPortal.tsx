import { scheduleBackgroundWarmup } from '../../lib/background-warmup';
import React, { useState, useEffect } from 'react';
import { PartnerAppShell } from './shell/PartnerAppShell';
import { partnerRoute } from '../../lib/portal-navigation';

// Creator Studio Screens
const loadCreatorOverview = () => import('./creator/CreatorOverview');
const CreatorOverview = React.lazy(() => loadCreatorOverview().then(module => ({ default: module.CreatorOverview })));
const loadCreatorContentEditor = () => import('./creator/CreatorContentEditor');
const CreatorContentEditor = React.lazy(() => loadCreatorContentEditor().then(module => ({ default: module.CreatorContentEditor })));
const loadCreatorContentLibrary = () => import('./creator/CreatorContentLibrary');
const CreatorContentLibrary = React.lazy(() => loadCreatorContentLibrary().then(module => ({ default: module.CreatorContentLibrary })));
const loadCreatorCampaigns = () => import('./creator/CreatorCampaigns');
const CreatorCampaigns = React.lazy(() => loadCreatorCampaigns().then(module => ({ default: module.CreatorCampaigns })));
const loadCreatorPRRoom = () => import('./creator/CreatorPRRoom');
const CreatorPRRoom = React.lazy(() => loadCreatorPRRoom().then(module => ({ default: module.CreatorPRRoom })));
const loadCreatorStorefront = () => import('./creator/CreatorStorefront');
const CreatorStorefront = React.lazy(() => loadCreatorStorefront().then(module => ({ default: module.CreatorStorefront })));
const loadCreatorReferralLinks = () => import('./creator/CreatorReferralLinks');
const CreatorReferralLinks = React.lazy(() => loadCreatorReferralLinks().then(module => ({ default: module.CreatorReferralLinks })));
const loadCreatorEarnings = () => import('./creator/CreatorEarnings');
const CreatorEarnings = React.lazy(() => loadCreatorEarnings().then(module => ({ default: module.CreatorEarnings })));
const loadCreatorNotifications = () => import('./creator/CreatorNotifications');
const CreatorNotifications = React.lazy(() => loadCreatorNotifications().then(module => ({ default: module.CreatorNotifications })));
const loadCreatorResources = () => import('./creator/CreatorResources');
const CreatorResources = React.lazy(() => loadCreatorResources().then(module => ({ default: module.CreatorResources })));
const loadCreatorSupport = () => import('./creator/CreatorSupport');
const CreatorSupport = React.lazy(() => loadCreatorSupport().then(module => ({ default: module.CreatorSupport })));
const loadCreatorSettings = () => import('./creator/CreatorSettings');
const CreatorSettings = React.lazy(() => loadCreatorSettings().then(module => ({ default: module.CreatorSettings })));

// Distributor Hub Screens
const loadDistributorOverview = () => import('./distributor/DistributorOverview');
const DistributorOverview = React.lazy(() => loadDistributorOverview().then(module => ({ default: module.DistributorOverview })));
const loadDistributorOrders = () => import('./distributor/DistributorOrders');
const DistributorOrders = React.lazy(() => loadDistributorOrders().then(module => ({ default: module.DistributorOrders })));
const loadDistributorInventory = () => import('./distributor/DistributorInventory');
const DistributorInventory = React.lazy(() => loadDistributorInventory().then(module => ({ default: module.DistributorInventory })));
const loadDistributorRestock = () => import('./distributor/DistributorRestock');
const DistributorRestock = React.lazy(() => loadDistributorRestock().then(module => ({ default: module.DistributorRestock })));
const loadDistributorSales = () => import('./distributor/DistributorSales');
const DistributorSales = React.lazy(() => loadDistributorSales().then(module => ({ default: module.DistributorSales })));
const loadDistributorEarnings = () => import('./distributor/DistributorEarnings');
const DistributorEarnings = React.lazy(() => loadDistributorEarnings().then(module => ({ default: module.DistributorEarnings })));
const loadDistributorTerritory = () => import('./distributor/DistributorTerritory');
const DistributorTerritory = React.lazy(() => loadDistributorTerritory().then(module => ({ default: module.DistributorTerritory })));
const loadDistributorReports = () => import('./distributor/DistributorReports');
const DistributorReports = React.lazy(() => loadDistributorReports().then(module => ({ default: module.DistributorReports })));
const loadDistributorSupport = () => import('./distributor/DistributorSupport');
const DistributorSupport = React.lazy(() => loadDistributorSupport().then(module => ({ default: module.DistributorSupport })));
const loadDistributorSettings = () => import('./distributor/DistributorSettings');
const DistributorSettings = React.lazy(() => loadDistributorSettings().then(module => ({ default: module.DistributorSettings })));

export interface PartnerPortalProps {
  kind: 'CREATOR' | 'DISTRIBUTOR';
}

export const PartnerPortal: React.FC<PartnerPortalProps> = ({ kind: initialKind }) => {
  const currentKind = initialKind;
  useEffect(() => scheduleBackgroundWarmup(initialKind === 'CREATOR' ? [loadCreatorOverview,loadCreatorContentEditor,loadCreatorContentLibrary,loadCreatorCampaigns,loadCreatorPRRoom,loadCreatorStorefront,loadCreatorReferralLinks,loadCreatorEarnings,loadCreatorNotifications,loadCreatorResources,loadCreatorSupport,loadCreatorSettings] : [loadDistributorOverview,loadDistributorOrders,loadDistributorInventory,loadDistributorRestock,loadDistributorSales,loadDistributorEarnings,loadDistributorTerritory,loadDistributorReports,loadDistributorSupport,loadDistributorSettings]), [initialKind]);

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
      <React.Suspense fallback={<div role="status" className="min-h-[40vh] flex items-center justify-center text-sm">Loading workspace…</div>}>
        {renderActiveScreen()}
      </React.Suspense>
    </PartnerAppShell>
  );
};
