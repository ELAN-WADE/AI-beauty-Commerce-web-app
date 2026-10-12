import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';

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
  accessibilityLabel: string;
}

export interface EditorialNavigationTileProps {
  tile: EditorialTileData;
  onNavigate: (routeId: string) => void;
  priority?: boolean;
}

export const EditorialNavigationTile: React.FC<EditorialNavigationTileProps> = ({
  tile,
  onNavigate,
  priority = false
}) => {
  const [imgError, setImgError] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onNavigate(tile.route);
    }
  };

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={tile.accessibilityLabel || `${tile.title} — ${tile.category}`}
      onClick={() => onNavigate(tile.route)}
      onKeyDown={handleKeyDown}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className={`group relative overflow-hidden rounded-2xl cursor-pointer select-none transition-all ${
        tile.desktopSpan || 'col-span-1'
      } ${tile.tabletSpan || ''} ${tile.minHeight || 'min-h-[160px] sm:min-h-[175px] lg:min-h-[185px]'} ${
        isFocused ? 'ring-2 ring-[#0F0F10] ring-offset-2' : ''
      } active:scale-[0.985] bg-[#121214] shadow-[0_6px_20px_-4px_rgba(0,0,0,0.14)] hover:shadow-[0_16px_32px_-6px_rgba(0,0,0,0.25)]`}
      style={{
        transitionProperty: 'transform, box-shadow',
        transitionDuration: '240ms',
        transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)'
      }}
    >
      {/* Background Photography Layer */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#18181B]">
        {!imgError ? (
          <img
            src={tile.image}
            alt=""
            loading={priority ? 'eager' : 'lazy'}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center transform group-hover:scale-[1.03] transition-transform will-change-transform opacity-90 group-hover:opacity-100"
            style={{
              transitionDuration: '400ms',
              transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)'
            }}
          />
        ) : (
          <div className="w-full h-full bg-[#18181B]" />
        )}

        {/* Crisp Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 group-hover:from-black/95 transition-colors duration-300" />
      </div>

      {/* Content Layout */}
      <div className="relative z-10 h-full w-full p-4 sm:p-5 flex flex-col justify-between">
        {/* Top Header: Index & Clean Monochrome Status Stamp */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] sm:text-[11px] font-bold tracking-widest uppercase text-white/80">
              {tile.index}
            </span>
            <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-white/40" />
            <span className="hidden sm:inline-block font-mono text-[9.5px] uppercase tracking-wider text-white/70 font-semibold">
              {tile.category}
            </span>
          </div>

          {tile.badge && (
            <span className="font-mono text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-white/90 shrink-0">
              {tile.badge}
            </span>
          )}
        </div>

        {/* Bottom Destination Title & Action Indicator */}
        <div className="space-y-1 pt-4">
          <div className="flex items-end justify-between gap-2.5">
            <h3 className="font-heading font-extrabold text-lg sm:text-xl text-white tracking-tight leading-tight">
              {tile.title}
            </h3>

            <div
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/80 shrink-0 group-hover:bg-[#0F0F10] group-hover:text-white transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              style={{
                transitionDuration: '240ms',
                transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)'
              }}
            >
              <ArrowUpRight size={15} />
            </div>
          </div>

          <p className="text-[11.5px] sm:text-xs text-white/70 leading-relaxed font-normal max-w-[50ch] line-clamp-1 sm:line-clamp-2 transform translate-y-0.5 opacity-90 sm:opacity-0 sm:translate-y-1.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
            {tile.description}
          </p>
        </div>
      </div>
    </div>
  );
};
