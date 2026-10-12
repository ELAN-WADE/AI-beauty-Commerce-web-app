import React from 'react';
import {
  EditorialNavigationTile,
  EditorialTileData
} from '../creator/EditorialNavigationTile';

export type DistributorCategoryFilter = 'all' | 'fulfillment' | 'wholesale' | 'territory';
export type DistributorLayoutMode = 'matrix' | 'bento';

export interface DistributorEditorialGridProps {
  onNavigate: (routeId: string) => void;
  onOpenAnalytics?: () => void;
  activeFilter?: DistributorCategoryFilter;
  layoutMode?: DistributorLayoutMode;
}

export const defaultDistributorTiles: EditorialTileData[] = [
  {
    id: 'tile-orders',
    route: 'orders',
    index: '01',
    category: 'Fulfillment Desk',
    title: 'Hub Orders & Dispatch',
    description: 'Process retail pick-ups, package same-day deliveries, and hand off consignments to city couriers.',
    image: '/tile_dist_orders.jpg',
    badge: '7 PENDING',
    badgeVariant: 'gold',
    desktopSpan: 'col-span-1',
    minHeight: 'min-h-[160px] sm:min-h-[175px] lg:min-h-[185px]',
    visualTone: 'champagne',
    accessibilityLabel: 'Open hub orders and same-day dispatch queue'
  },
  {
    id: 'tile-restock',
    route: 'restock',
    index: '02',
    category: 'Central Lab',
    title: 'Factory Bulk Restock',
    description: 'Order formulation pallets direct from the central lab with verified wholesale bulk margins.',
    image: '/tile_dist_restock.jpg',
    badge: 'TIER 1 WHOLESALE',
    badgeVariant: 'gold',
    desktopSpan: 'col-span-1',
    minHeight: 'min-h-[160px] sm:min-h-[175px] lg:min-h-[185px]',
    visualTone: 'amber',
    accessibilityLabel: 'Order wholesale formulation pallets from central lab'
  },
  {
    id: 'tile-inventory',
    route: 'inventory',
    index: '03',
    category: 'Warehouse Storage',
    title: 'Hub Inventory Vault',
    description: 'Monitor live SKU inventory health, safety thresholds, and batch expiry across Lagos warehouses.',
    image: '/tile_dist_inventory.jpg',
    badge: '86% HEALTH',
    desktopSpan: 'col-span-1',
    minHeight: 'min-h-[160px] sm:min-h-[175px] lg:min-h-[185px]',
    visualTone: 'rose',
    accessibilityLabel: 'Inspect SKU inventory levels and safety reorder marks'
  },
  {
    id: 'tile-earnings',
    route: 'earnings',
    index: '04',
    category: 'Commercial Margin',
    title: 'Wholesale Margins',
    description: 'Track cleared partner margins, bulk retail payouts, and direct Nigerian NUBAN bank settlements.',
    image: '/tile_dist_earnings.jpg',
    badge: '₦320.4K CLEARED',
    badgeVariant: 'gold',
    desktopSpan: 'col-span-1',
    minHeight: 'min-h-[160px] sm:min-h-[175px] lg:min-h-[185px]',
    visualTone: 'champagne',
    accessibilityLabel: 'Review wholesale margin ledgers and partner bank settlements'
  },
  {
    id: 'tile-sales',
    route: 'sales',
    index: '05',
    category: 'Revenue Run-Rate',
    title: 'Sales & Velocity',
    description: 'Analyze territory GMV run rates, peak shopping hours, and best-selling skincare formulations.',
    image: '/tile_dist_sales.jpg',
    badge: '+18.2% VELOCITY',
    badgeVariant: 'subtle',
    desktopSpan: 'col-span-1',
    minHeight: 'min-h-[160px] sm:min-h-[175px] lg:min-h-[185px]',
    visualTone: 'amber',
    accessibilityLabel: 'Analyze regional sales run-rate and formulation demand'
  },
  {
    id: 'tile-territory',
    route: 'territory',
    index: '06',
    category: 'Geographic Radius',
    title: 'Delivery Territory',
    description: 'Configure delivery zones, dispatch rider radiuses, and same-day delivery hubs across West Africa.',
    image: '/tile_dist_territory.jpg',
    badge: '12 ACTIVE HUBS',
    badgeVariant: 'subtle',
    desktopSpan: 'col-span-1',
    minHeight: 'min-h-[160px] sm:min-h-[175px] lg:min-h-[185px]',
    visualTone: 'rose',
    accessibilityLabel: 'Manage delivery zones and assigned dispatch couriers'
  },
  {
    id: 'tile-reports',
    route: 'reports',
    index: '07',
    category: 'Fulfillment Metrics',
    title: 'Performance & SLA',
    description: 'Audit turnaround delivery times, courier reliability scores, and client satisfaction metrics.',
    image: '/tile_dist_sla.jpg',
    badge: '98.4% ON-TIME',
    badgeVariant: 'subtle',
    desktopSpan: 'col-span-1',
    minHeight: 'min-h-[160px] sm:min-h-[175px] lg:min-h-[185px]',
    visualTone: 'champagne',
    accessibilityLabel: 'Inspect fulfillment turnaround times and SLA scorecards'
  },
  {
    id: 'tile-support',
    route: 'support',
    index: '08',
    category: 'Direct Lab Line',
    title: 'Support & Concierge',
    description: 'Connect directly to headquarters logistics dispatch, formula QA analysts, and priority courier line.',
    image: '/tile_dist_support.jpg',
    badge: 'PRIORITY LINE',
    badgeVariant: 'gold',
    desktopSpan: 'col-span-1',
    minHeight: 'min-h-[160px] sm:min-h-[175px] lg:min-h-[185px]',
    visualTone: 'emerald',
    accessibilityLabel: 'Contact direct lab logistics support and formulation QA'
  },
  {
    id: 'tile-settings',
    route: 'settings',
    index: '09',
    category: 'Facility Operations',
    title: 'Hub Facility Settings',
    description: 'Manage warehouse address credentials, operational shift hours, and staff permission dossiers.',
    image: '/tile_dist_settings.jpg',
    badge: 'LAGOS CENTRAL',
    badgeVariant: 'subtle',
    desktopSpan: 'col-span-1',
    minHeight: 'min-h-[160px] sm:min-h-[175px] lg:min-h-[185px]',
    visualTone: 'noir',
    accessibilityLabel: 'Configure warehouse location, shift hours, and dispatch personnel'
  }
];

export const DistributorEditorialGrid: React.FC<DistributorEditorialGridProps> = ({
  onNavigate,
  onOpenAnalytics,
  activeFilter = 'all',
  layoutMode = 'matrix'
}) => {
  const handleTileClick = (route: string) => {
    if (route === 'sales' && onOpenAnalytics) {
      onOpenAnalytics();
    } else {
      onNavigate(route);
    }
  };

  const filteredTiles = defaultDistributorTiles.filter((tile) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'fulfillment') {
      return ['tile-orders', 'tile-inventory', 'tile-reports'].includes(tile.id);
    }
    if (activeFilter === 'wholesale') {
      return ['tile-restock', 'tile-earnings', 'tile-sales'].includes(tile.id);
    }
    if (activeFilter === 'territory') {
      return ['tile-territory', 'tile-support', 'tile-settings'].includes(tile.id);
    }
    return true;
  });

  const getBentoSpan = (tileId: string) => {
    switch (tileId) {
      case 'tile-orders':
        return 'col-span-1 sm:col-span-2 lg:col-span-2';
      case 'tile-earnings':
        return 'col-span-1 sm:col-span-2 lg:col-span-2';
      case 'tile-settings':
        return 'col-span-1 sm:col-span-2 lg:col-span-2';
      default:
        return 'col-span-1 sm:col-span-1 lg:col-span-1';
    }
  };

  const isBento = layoutMode === 'bento' && activeFilter === 'all';

  return (
    <section aria-label="Distributor Hub Navigation Grid" className="w-full">
      <div
        className={`grid gap-3.5 sm:gap-4 lg:gap-4.5 auto-rows-fr transition-all duration-300 ${
          isBento
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {filteredTiles.map((tile, idx) => {
          const tileWithBentoSpan = isBento
            ? { ...tile, desktopSpan: getBentoSpan(tile.id) }
            : tile;

          return (
            <EditorialNavigationTile
              key={tile.id}
              tile={tileWithBentoSpan}
              onNavigate={handleTileClick}
              priority={idx < 3}
            />
          );
        })}
      </div>
    </section>
  );
};
