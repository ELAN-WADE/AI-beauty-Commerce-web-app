import React from 'react';
import {
  EditorialNavigationTile,
  EditorialTileData
} from './EditorialNavigationTile';

export type EditorialCategoryFilter = 'all' | 'production' | 'collaborations' | 'commerce';
export type EditorialLayoutMode = 'matrix' | 'bento';

export interface EditorialNavigationGridProps {
  onNavigate: (routeId: string) => void;
  onOpenAnalytics?: () => void;
  activeFilter?: EditorialCategoryFilter;
  layoutMode?: EditorialLayoutMode;
  customTiles?: EditorialTileData[];
}

export const defaultCreatorTiles: EditorialTileData[] = [
  {
    id: 'tile-create',
    route: 'create',
    index: '01',
    category: 'Production Lab',
    title: 'Create Studio',
    description: 'Conceive beauty routines, film short-form reels, and architect clinical product regimens.',
    image: '/tile_create_studio.jpg',
    badge: 'LIVE',
    badgeVariant: 'gold',
    desktopSpan: 'col-span-1',
    minHeight: 'min-h-[160px] sm:min-h-[175px] lg:min-h-[185px]',
    visualTone: 'champagne',
    accessibilityLabel: 'Open Create Studio workspace to author routines and videos'
  },
  {
    id: 'tile-campaigns',
    route: 'campaigns',
    index: '02',
    category: 'Collaborations',
    title: 'Brand Campaigns',
    description: 'Partner on seasonal brand briefs, elevate awareness, and unlock high-impact milestone bonuses.',
    image: '/tile_campaigns.jpg',
    badge: '2 BRIEFS',
    badgeVariant: 'gold',
    desktopSpan: 'col-span-1',
    minHeight: 'min-h-[160px] sm:min-h-[175px] lg:min-h-[185px]',
    visualTone: 'amber',
    accessibilityLabel: 'Explore available brand campaigns and collaborative briefs'
  },
  {
    id: 'tile-content',
    route: 'content',
    index: '03',
    category: 'Media Library',
    title: 'My Content',
    description: 'Curate published reels, routine guides, active drafts, and review statuses.',
    image: '/tile_content.jpg',
    badge: '42 ITEMS',
    desktopSpan: 'col-span-1',
    minHeight: 'min-h-[160px] sm:min-h-[175px] lg:min-h-[185px]',
    visualTone: 'rose',
    accessibilityLabel: 'Manage your published and draft creator content library'
  },
  {
    id: 'tile-pr-room',
    route: 'pr-room',
    index: '04',
    category: 'VIP Allocations',
    title: 'PR Room',
    description: 'Claim complimentary pre-release formulas and track real-time doorstep delivery.',
    image: '/tile_pr_room.jpg',
    badge: 'ELIGIBLE',
    badgeVariant: 'gold',
    desktopSpan: 'col-span-1',
    minHeight: 'min-h-[160px] sm:min-h-[175px] lg:min-h-[185px]',
    visualTone: 'champagne',
    accessibilityLabel: 'Access complimentary PR package allocations and courier tracking'
  },
  {
    id: 'tile-earnings',
    route: 'earnings',
    index: '05',
    category: 'Commission Ledger',
    title: 'Earnings & Vault',
    description: 'Review verified commission ledgers, cleared bank balances, and transparent client attribution.',
    image: '/tile_earnings.jpg',
    badge: '₦84.6K',
    badgeVariant: 'gold',
    desktopSpan: 'col-span-1',
    minHeight: 'min-h-[160px] sm:min-h-[175px] lg:min-h-[185px]',
    visualTone: 'champagne',
    accessibilityLabel: 'Inspect affiliate earnings, commission ledgers, and payout withdrawals'
  },
  {
    id: 'tile-analytics',
    route: 'analytics',
    index: '06',
    category: 'Real-Time Pulse',
    title: 'Performance Pulse',
    description: 'Analyze client conversions, follower resonance, and reach velocity across West Africa.',
    image: '/tile_analytics.jpg',
    badge: '+18.4%',
    badgeVariant: 'subtle',
    desktopSpan: 'col-span-1',
    minHeight: 'min-h-[160px] sm:min-h-[175px] lg:min-h-[185px]',
    visualTone: 'amber',
    accessibilityLabel: 'Inspect performance telemetry and audience engagement velocity'
  },
  {
    id: 'tile-storefront',
    route: 'storefront',
    index: '07',
    category: 'Public Boutique',
    title: 'Curated Storefront',
    description: 'Your personal bespoke boutique with verified favorites and custom regimens.',
    image: '/tile_storefront.jpg',
    badge: "AMARA'S EDIT",
    badgeVariant: 'subtle',
    desktopSpan: 'col-span-1',
    minHeight: 'min-h-[160px] sm:min-h-[175px] lg:min-h-[185px]',
    visualTone: 'rose',
    accessibilityLabel: 'Manage your creator shoppable storefront showcase'
  },
  {
    id: 'tile-links',
    route: 'links',
    index: '08',
    category: 'Distribution',
    title: 'Links & Promo',
    description: 'Generate tracked affiliate URLs, custom discount codes, and live tap rates.',
    image: '/tile_links.jpg',
    badge: 'AMARA10',
    badgeVariant: 'gold',
    desktopSpan: 'col-span-1',
    minHeight: 'min-h-[160px] sm:min-h-[175px] lg:min-h-[185px]',
    visualTone: 'emerald',
    accessibilityLabel: 'Manage affiliate tracking links and promotional vouchers'
  },
  {
    id: 'tile-settings',
    route: 'settings',
    index: '09',
    category: 'Preferences',
    title: 'Creator Settings',
    description: 'Fine-tune payout credentials, bio identities, brand notifications, and security.',
    image: '/tile_settings.jpg',
    badge: 'LUMINARY',
    badgeVariant: 'subtle',
    desktopSpan: 'col-span-1',
    minHeight: 'min-h-[160px] sm:min-h-[175px] lg:min-h-[185px]',
    visualTone: 'noir',
    accessibilityLabel: 'Manage creator profile, payout bank details, and notification preferences'
  }
];

export const EditorialNavigationGrid: React.FC<EditorialNavigationGridProps> = ({
  onNavigate,
  onOpenAnalytics,
  activeFilter = 'all',
  layoutMode = 'matrix',
  customTiles = defaultCreatorTiles
}) => {
  const handleTileClick = (route: string) => {
    if (route === 'analytics' && onOpenAnalytics) {
      onOpenAnalytics();
    } else {
      onNavigate(route);
    }
  };

  const filteredTiles = customTiles.filter((tile) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'production') {
      return ['tile-create', 'tile-content', 'tile-storefront'].includes(tile.id);
    }
    if (activeFilter === 'collaborations') {
      return ['tile-campaigns', 'tile-pr-room', 'tile-links'].includes(tile.id);
    }
    if (activeFilter === 'commerce') {
      return ['tile-earnings', 'tile-analytics', 'tile-settings'].includes(tile.id);
    }
    return true;
  });

  // Dynamic column spans for the Asymmetric Luxury Bento layout
  const getBentoSpan = (tileId: string) => {
    switch (tileId) {
      case 'tile-create':
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
    <section
      aria-label="Creator Office Navigation Grid"
      className="w-full"
    >
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
