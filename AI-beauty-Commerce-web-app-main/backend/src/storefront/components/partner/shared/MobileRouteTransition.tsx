import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export type PartnerPortalKind = 'creator' | 'distributor';

export interface PartnerTileTransitionMeta {
  layoutId: string;
  image: string;
  index: string;
  title: string;
}

export const STUDIO_EASE = [0.23, 1, 0.32, 1] as const;

export const PARTNER_TILE_META: Record<
  PartnerPortalKind,
  Record<string, PartnerTileTransitionMeta>
> = {
  creator: {
    create: {
      layoutId: 'creator-studio-hero-card',
      image: '/tile_create_studio.jpg',
      index: '01',
      title: 'Creator Studio',
    },
    campaigns: {
      layoutId: 'creator-campaigns-hero-card',
      image: '/tile_campaigns.jpg',
      index: '02',
      title: 'Active Campaigns',
    },
    content: {
      layoutId: 'creator-content-hero-card',
      image: '/tile_content.jpg',
      index: '03',
      title: 'My Content Library',
    },
    'pr-room': {
      layoutId: 'creator-pr-room-hero-card',
      image: '/tile_pr_room.jpg',
      index: '04',
      title: 'The PR Room',
    },
    earnings: {
      layoutId: 'creator-earnings-hero-card',
      image: '/tile_earnings.jpg',
      index: '05',
      title: 'Earnings & Payouts',
    },
    storefront: {
      layoutId: 'creator-storefront-hero-card',
      image: '/tile_storefront.jpg',
      index: '07',
      title: 'My Storefront',
    },
    links: {
      layoutId: 'creator-links-hero-card',
      image: '/tile_links.jpg',
      index: '08',
      title: 'Links & Codes',
    },
    settings: {
      layoutId: 'creator-settings-hero-card',
      image: '/tile_settings.jpg',
      index: '09',
      title: 'Creator Settings',
    },
  },
  distributor: {
    orders: {
      layoutId: 'distributor-orders-hero-card',
      image: '/tile_dist_orders.jpg',
      index: '01',
      title: 'Hub Orders',
    },
    restock: {
      layoutId: 'distributor-restock-hero-card',
      image: '/tile_dist_restock.jpg',
      index: '02',
      title: 'Bulk Restock',
    },
    inventory: {
      layoutId: 'distributor-inventory-hero-card',
      image: '/tile_dist_inventory.jpg',
      index: '03',
      title: 'Inventory Vault',
    },
    earnings: {
      layoutId: 'distributor-earnings-hero-card',
      image: '/tile_dist_earnings.jpg',
      index: '04',
      title: 'Wholesale Margins',
    },
    sales: {
      layoutId: 'distributor-sales-hero-card',
      image: '/tile_dist_sales.jpg',
      index: '05',
      title: 'Sales & Velocity',
    },
    territory: {
      layoutId: 'distributor-territory-hero-card',
      image: '/tile_dist_territory.jpg',
      index: '06',
      title: 'Delivery Territory',
    },
    reports: {
      layoutId: 'distributor-reports-hero-card',
      image: '/tile_dist_sla.jpg',
      index: '07',
      title: 'Performance & SLA',
    },
    support: {
      layoutId: 'distributor-support-hero-card',
      image: '/tile_dist_support.jpg',
      index: '08',
      title: 'Hub Support',
    },
    settings: {
      layoutId: 'distributor-settings-hero-card',
      image: '/tile_dist_settings.jpg',
      index: '09',
      title: 'Hub Settings',
    },
  },
};

export function getPartnerTileLayoutId(
  portal: PartnerPortalKind,
  route: string,
): string | undefined {
  return PARTNER_TILE_META[portal][route]?.layoutId;
}

/**
 * Tracks mobile partner viewport (< 768px) so shared-element layoutId transitions
 * execute only on mobile and leave desktop Bento dashboards instantaneous.
 */
export function useIsMobilePartnerViewport(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mql = window.matchMedia('(max-width: 767px)');
    const sync = () => setIsMobile(mql.matches);
    sync();
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', sync);
      return () => mql.removeEventListener('change', sync);
    }
    mql.addListener(sync);
    return () => mql.removeListener(sync);
  }, []);

  return isMobile;
}

export interface MobileSharedHeroCardProps {
  portal: PartnerPortalKind;
  route: string;
  subtitle?: string;
  title: string;
  description?: string;
  rightAction?: React.ReactNode;
  showOnDesktop?: boolean;
}

/**
 * Shared-element destination header card on mobile (< md) that morphs smoothly
 * from the originating dashboard navigation tile. Hidden on desktop unless showOnDesktop is set.
 */
export const MobileSharedHeroCard: React.FC<MobileSharedHeroCardProps> = ({
  portal,
  route,
  subtitle,
  title,
  description,
  rightAction,
  showOnDesktop = false,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const isMobile = useIsMobilePartnerViewport();
  const meta = PARTNER_TILE_META[portal][route];

  if (!meta) return null;

  const activeLayoutId =
    isMobile && !shouldReduceMotion ? meta.layoutId : undefined;

  return (
    <div
      className={`${
        showOnDesktop ? 'flex' : 'flex md:hidden'
      } flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#E5E7EB]`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <motion.div
          layoutId={activeLayoutId}
          transition={{ duration: shouldReduceMotion ? 0 : 0.34, ease: STUDIO_EASE }}
          className="relative w-full max-w-[240px] sm:w-48 md:w-52 aspect-[16/10] rounded-2xl overflow-hidden bg-[#18181B] shadow-[0_8px_24px_-6px_rgba(0,0,0,0.16)] shrink-0"
        >
          <img
            src={meta.image}
            alt={title || meta.title}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white">
            <span className="font-mono text-[10px] tracking-wider text-white/80">
              {meta.index}
            </span>
            <span className="text-xs font-medium text-white truncate ml-2">
              {meta.title}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={isMobile && !shouldReduceMotion ? { opacity: 0, y: 8 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.05, ease: STUDIO_EASE }}
          className="space-y-1 min-w-0"
        >
          {subtitle && (
            <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#6B7280] font-medium">
              {subtitle}
            </p>
          )}
          <h1 className="font-heading font-semibold text-xl sm:text-2xl text-[#0F0F10] tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-[#6B7280] max-w-md leading-relaxed">
              {description}
            </p>
          )}
        </motion.div>
      </div>

      {rightAction && (
        <motion.div
          initial={isMobile && !shouldReduceMotion ? { opacity: 0, y: 6 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.08, ease: STUDIO_EASE }}
          className="flex flex-wrap items-center gap-2 shrink-0"
        >
          {rightAction}
        </motion.div>
      )}
    </div>
  );
};

export interface MobileRouteContentProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Smooth mobile-only content entrance wrapper for partner destination screens.
 * Stays completely static on desktop viewports so desktop layouts feel instant.
 */
export const MobileRouteContent: React.FC<MobileRouteContentProps> = ({
  children,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const isMobile = useIsMobilePartnerViewport();

  return (
    <motion.div
      initial={isMobile && !shouldReduceMotion ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: isMobile && !shouldReduceMotion ? 0.26 : 0, delay: isMobile ? 0.04 : 0, ease: STUDIO_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

