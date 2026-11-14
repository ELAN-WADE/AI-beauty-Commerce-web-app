import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from '../../common/SolidIcons';

export interface EditorialTileData {
  id: string;
  route: string;
  index: string;
  category: string;
  title: string;
  description: string;
  image: string;
  badge?: string;
  badgeVariant?: string;
  desktopSpan?: string;
  tabletSpan?: string;
  minHeight?: string;
  visualTone?: string;
  sharedLayoutId?: string;
  accessibilityLabel: string;
}

export interface EditorialNavigationTileProps {
  tile: EditorialTileData;
  onNavigate: (routeId: string) => void;
  priority?: boolean;
}

const TILE_TRANSITION = {
  duration: 0.36,
  ease: [0.23, 1, 0.32, 1] as const
};

export const EditorialNavigationTile: React.FC<EditorialNavigationTileProps> = ({
  tile,
  onNavigate,
  priority = false
}) => {
  const [imgError, setImgError] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onNavigate(tile.route);
    }
  };

  const activeLayoutId = !shouldReduceMotion && tile.sharedLayoutId ? tile.sharedLayoutId : undefined;

  return (
    <motion.div
      role="link"
      tabIndex={0}
      aria-label={tile.accessibilityLabel || `${tile.title} — ${tile.category}`}
      onClick={() => onNavigate(tile.route)}
      onKeyDown={handleKeyDown}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
      className={`group relative overflow-hidden rounded-2xl cursor-pointer select-none touch-manipulation ${
        tile.desktopSpan || 'col-span-1'
      } ${tile.tabletSpan || ''} ${tile.minHeight || 'min-h-[168px] sm:min-h-[185px] lg:min-h-[200px]'} ${
        isFocused ? 'ring-2 ring-[#0F0F10] ring-offset-2' : ''
      } bg-[#121214] shadow-[0_6px_20px_-4px_rgba(0,0,0,0.12)] hover:shadow-[0_14px_28px_-6px_rgba(0,0,0,0.2)] transition-shadow duration-200`}
    >
      {/* Shared Photography Layer (Morphs continuously into destination card when sharedLayoutId is present) */}
      <motion.div
        layoutId={activeLayoutId}
        transition={TILE_TRANSITION}
        className="absolute inset-0 w-full h-full overflow-hidden rounded-2xl bg-[#18181B]"
      >
        {!imgError ? (
          <img
            src={tile.image}
            alt={tile.title}
            loading={priority ? 'eager' : 'lazy'}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.03] opacity-90 group-hover:opacity-100"
          />
        ) : (
          <div className="w-full h-full bg-[#18181B]" />
        )}

        {/* Crisp Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/15 group-hover:from-black/90 transition-colors duration-200" />
      </motion.div>

      {/* Content Layout */}
      <div className="relative z-10 h-full w-full p-4 sm:p-5 flex flex-col justify-between">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[11px] font-medium tracking-wider text-white/80">
              {tile.index}
            </span>
            <span className="hidden sm:inline-block text-xs text-white/70 font-medium">
              {tile.category}
            </span>
          </div>

          {tile.badge && (
            <span className="text-xs font-medium text-white/90 shrink-0">
              {tile.badge}
            </span>
          )}
        </div>

        {/* Bottom Destination Title & Action Indicator */}
        <div className="space-y-1 pt-4">
          <div className="flex items-end justify-between gap-2.5">
            <h3 className="font-heading font-semibold text-base sm:text-lg text-white tracking-tight leading-snug">
              {tile.title}
            </h3>

            <div className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white shrink-0 group-hover:bg-[#0F0F10] transition-colors duration-200">
              <ArrowUpRight size={15} />
            </div>
          </div>

          <p className="text-xs sm:text-[13px] text-white/75 leading-relaxed font-normal max-w-[46ch] line-clamp-2 transition-opacity duration-200">
            {tile.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
