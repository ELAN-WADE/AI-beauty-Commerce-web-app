import React from 'react';
import {
  EditorialNavigationTile,
  EditorialTileData
} from './EditorialNavigationTile';

export type EditorialCategoryFilter = 'production' | 'collaboration' | 'ledger';
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
    title: 'Creator Studio',
    description: 'Conceive beauty routines, film short-form reels, and architect natural product regimens.',
    image: '/tile_create_studio.jpg',
    desktopSpan: 'col-span-1',
    minHeight: 'min-h-[180px] sm:min-h-[200px]',
    sharedLayoutId: 'creator-studio-hero-card',
    accessibilityLabel: 'Open Creator Studio workspace to author routines and videos'
  },
  {
    id: 'tile-campaigns',
    route: 'campaigns',
    index: '02',
    category: 'Collaborations',
    title: 'Brand Campaigns',
    description: 'Partner on seasonal brand briefs, elevate awareness, and unlock high-impact milestone bonuses.',
    image: '/tile_campaigns.jpg',
    desktopSpan: 'col-span-1',
    minHeight: 'min-h-[180px] sm:min-h-[200px]',
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
    desktopSpan: 'col-span-1',
    minHeight: 'min-h-[180px] sm:min-h-[200px]',
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
    desktopSpan: 'col-span-1',
    minHeight: 'min-h-[180px] sm:min-h-[200px]',
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
    desktopSpan: 'col-span-1',
    minHeight: 'min-h-[180px] sm:min-h-[200px]',
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
    desktopSpan: 'col-span-1',
    minHeight: 'min-h-[180px] sm:min-h-[200px]',
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
    desktopSpan: 'col-span-1',
    minHeight: 'min-h-[180px] sm:min-h-[200px]',
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
    desktopSpan: 'col-span-1',
    minHeight: 'min-h-[180px] sm:min-h-[200px]',
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
    desktopSpan: 'col-span-1',
    minHeight: 'min-h-[180px] sm:min-h-[200px]',
    accessibilityLabel: 'Manage creator profile, payout bank details, and notification preferences'
  }
];

export const EditorialNavigationGrid: React.FC<EditorialNavigationGridProps> = ({
  onNavigate,
  onOpenAnalytics,
  activeFilter = 'production',
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
    if (activeFilter === 'production') {
      return ['tile-create', 'tile-content', 'tile-storefront'].includes(tile.id);
    }
    if (activeFilter === 'collaboration') {
      return ['tile-campaigns', 'tile-pr-room', 'tile-links'].includes(tile.id);
    }
    if (activeFilter === 'ledger') {
      return ['tile-earnings', 'tile-analytics', 'tile-settings'].includes(tile.id);
    }
    return true;
  });

  return (
    <section
      aria-label="Studio Workspace Destinations"
      className="w-full"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
        {filteredTiles.map((tile, idx) => (
          <EditorialNavigationTile
            key={tile.id}
            tile={tile}
            onNavigate={handleTileClick}
            priority={idx < 3}
          />
        ))}
      </div>
    </section>
  );
};
