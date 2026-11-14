'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ArrowRight } from '@phosphor-icons/react';

export interface ElasticReelItem {
  id: string;
  src: string;
  title: string;
  caption?: string;
  tag?: string;
  category?: string;
  href?: string;
  onClick?: () => void;
}

export interface ElasticReelProps {
  items: ElasticReelItem[];
  barWidth?: number;
  barHeight?: number;
  gap?: number;
  radius?: number;
  magnify?: number;
  lift?: number;
  elasticity?: number;
  align?: 'start' | 'center' | 'end';
  autoplay?: 'sweep' | 'off' | false | true;
  speed?: number;
  draggable?: boolean;
  pauseOnHover?: boolean;
  wheel?: boolean;
  captions?: boolean;
  labels?: boolean;
  className?: string;
  onItemClick?: (item: ElasticReelItem, index: number) => void;
}

const REST_HEIGHT_PX = 108;
const STAGE_HEIGHT_PX = 400; // 108 / 400 === 0.27 (27% of stage height at rest)

export const ElasticReel: React.FC<ElasticReelProps> = ({
  items,
  barWidth = 59,
  barHeight = 0.27,
  gap = 10,
  radius = 12,
  magnify = 2.4,
  lift = 1.15,
  elasticity = 0.35,
  align = 'center',
  autoplay = 'sweep',
  speed = 1.4,
  draggable = true,
  pauseOnHover = true,
  wheel = false,
  captions = true,
  labels = true,
  className = '',
  onItemClick,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [stageWidth, setStageWidth] = useState<number>(960);

  // Continuous physics state stored in refs for 60fps animation without React re-render overhead
  const focusPosRef = useRef(0);
  const targetPosRef = useRef(0);
  const velocityRef = useRef(0);
  const sweepDirRef = useRef(1);
  const isHoveredRef = useRef(false);
  const isPointerDownRef = useRef(false);
  const isFocusedWithinRef = useRef(false);
  const pointerStartXRef = useRef(0);
  const pointerMovedRef = useRef(false);
  const lastActiveRef = useRef(0);

  const count = items.length;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const updateWidth = () => {
      const next = el.clientWidth;
      if (next > 0) setStageWidth(next);
    };
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Compute responsive bar width so desktop preserves exact barWidth (59px) when room allows,
  // and scales gracefully on narrower viewports without introducing page overflow.
  const effectiveBarWidth = useMemo(() => {
    if (count === 0) return barWidth;
    const maxExpandedWidth = barWidth * magnify;
    const totalNeeded = (count - 1) * barWidth + maxExpandedWidth + (count - 1) * gap + 24;
    if (stageWidth >= totalNeeded) return barWidth;
    const availablePerRest = Math.max(30, (stageWidth - 24 - (count - 1) * gap) / (count - 1 + magnify));
    return Math.min(barWidth, availablePerRest);
  }, [barWidth, count, gap, magnify, stageWidth]);

  const restBarHeight = Math.round(STAGE_HEIGHT_PX * barHeight);
  const maxBarHeight = Math.min(STAGE_HEIGHT_PX - 28, Math.round(restBarHeight * magnify * lift));
  const maxBarWidth = Math.round(effectiveBarWidth * magnify);

  const applyFrameStyles = useCallback(
    (pos: number) => {
      if (!count) return;
      const sigma = 1.05;
      const clampedElasticity = Math.max(0.15, Math.min(0.9, elasticity));

      for (let i = 0; i < count; i += 1) {
        const el = barRefs.current[i];
        if (!el) continue;

        const dist = Math.abs(i - pos);
        const influence = Math.exp(-(dist * dist) / (2 * sigma * sigma));
        const easeWeight = Math.pow(influence, 1 - clampedElasticity * 0.35);

        const w = effectiveBarWidth + (maxBarWidth - effectiveBarWidth) * easeWeight;
        const h = restBarHeight + (maxBarHeight - restBarHeight) * easeWeight;
        const translateY =
          align === 'center'
            ? -6 * easeWeight
            : align === 'end'
              ? -12 * easeWeight
              : 6 * easeWeight;

        el.style.width = `${w.toFixed(1)}px`;
        el.style.height = `${h.toFixed(1)}px`;
        el.style.transform = `translate3d(0, ${translateY.toFixed(1)}px, 0)`;
        el.style.opacity = `${(0.72 + 0.28 * easeWeight).toFixed(3)}`;
        el.style.zIndex = `${Math.round(1 + 20 * easeWeight)}`;
      }
    },
    [align, count, effectiveBarWidth, elasticity, maxBarHeight, maxBarWidth, restBarHeight]
  );

  // Sync static initial positions when reduced motion is preferred or item count changes
  useEffect(() => {
    if (!count) return;
    applyFrameStyles(focusPosRef.current);
  }, [applyFrameStyles, count, activeIndex]);

  useEffect(() => {
    if (!count || prefersReducedMotion) return;

    let rafId = 0;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.004, (now - lastTime) / 1000));
      lastTime = now;

      const paused =
        (pauseOnHover && isHoveredRef.current) ||
        isPointerDownRef.current ||
        isFocusedWithinRef.current;

      if (autoplay === 'sweep' || autoplay === true) {
        if (!paused) {
          const stepRate = Math.max(0.25, speed * 0.55);
          targetPosRef.current += sweepDirRef.current * stepRate * dt;
          if (targetPosRef.current >= count - 1) {
            targetPosRef.current = count - 1;
            sweepDirRef.current = -1;
          } else if (targetPosRef.current <= 0) {
            targetPosRef.current = 0;
            sweepDirRef.current = 1;
          }
        }
      }

      // Spring-damper interpolation governed by `elasticity`
      const stiffness = 95 + elasticity * 140;
      const damping = 18 - elasticity * 8;
      const force = (targetPosRef.current - focusPosRef.current) * stiffness;
      velocityRef.current = (velocityRef.current + force * dt) * Math.exp(-damping * dt);
      focusPosRef.current += velocityRef.current * dt;

      if (Math.abs(targetPosRef.current - focusPosRef.current) < 0.001 && Math.abs(velocityRef.current) < 0.001) {
        focusPosRef.current = targetPosRef.current;
        velocityRef.current = 0;
      }

      applyFrameStyles(focusPosRef.current);

      const nearest = Math.max(0, Math.min(count - 1, Math.round(focusPosRef.current)));
      if (nearest !== lastActiveRef.current) {
        lastActiveRef.current = nearest;
        setActiveIndex(nearest);
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [applyFrameStyles, autoplay, count, elasticity, pauseOnHover, prefersReducedMotion, speed]);

  const focusItem = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(count - 1, index));
      targetPosRef.current = clamped;
      if (prefersReducedMotion) {
        focusPosRef.current = clamped;
        applyFrameStyles(clamped);
      }
      lastActiveRef.current = clamped;
      setActiveIndex(clamped);
    },
    [applyFrameStyles, count, prefersReducedMotion]
  );

  const handleTrackPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!count) return;
    if (isPointerDownRef.current && draggable) {
      if (Math.abs(e.clientX - pointerStartXRef.current) > 6) {
        pointerMovedRef.current = true;
      }
    }
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const idx = ratio * (count - 1);
    targetPosRef.current = idx;
    if (prefersReducedMotion) {
      const rounded = Math.round(idx);
      focusPosRef.current = rounded;
      applyFrameStyles(rounded);
      setActiveIndex(rounded);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!wheel || !count) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (delta !== 0) {
      focusItem(activeIndex + (delta > 0 ? 1 : -1));
    }
  };

  const handleItemActivate = (item: ElasticReelItem, index: number) => {
    if (pointerMovedRef.current) return;
    focusItem(index);
    if (item.onClick) {
      item.onClick();
    } else if (onItemClick) {
      onItemClick(item, index);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!count) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusItem(activeIndex + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusItem(activeIndex - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusItem(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      focusItem(count - 1);
    }
  };

  const activeItem = items[activeIndex] ?? items[0];

  if (count === 0) return null;

  const alignItemsClass =
    align === 'start' ? 'items-start' : align === 'end' ? 'items-end' : 'items-center';

  return (
    <div
      ref={containerRef}
      className={`w-full select-none ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Desktop & Tablet Elastic Reel Presentation */}
      <div
        className="hidden md:flex flex-col items-center w-full"
        onMouseEnter={() => {
          isHoveredRef.current = true;
        }}
        onMouseLeave={() => {
          isHoveredRef.current = false;
          isPointerDownRef.current = false;
        }}
        onFocusCapture={() => {
          isFocusedWithinRef.current = true;
        }}
        onBlurCapture={() => {
          isFocusedWithinRef.current = false;
        }}
        onWheel={handleWheel}
      >
        <div
          ref={trackRef}
          role="region"
          aria-label="Curated collections reel"
          aria-roledescription="interactive carousel"
          onPointerDown={(e) => {
            if (!draggable) return;
            isPointerDownRef.current = true;
            pointerStartXRef.current = e.clientX;
            pointerMovedRef.current = false;
          }}
          onPointerMove={handleTrackPointerMove}
          onPointerUp={() => {
            isPointerDownRef.current = false;
            setTimeout(() => {
              pointerMovedRef.current = false;
            }, 40);
          }}
          onPointerCancel={() => {
            isPointerDownRef.current = false;
            pointerMovedRef.current = false;
          }}
          style={{ height: `${STAGE_HEIGHT_PX}px`, gap: `${gap}px` }}
          className={`relative flex justify-center ${alignItemsClass} w-full overflow-hidden px-3 touch-pan-y ${
            draggable ? 'cursor-grab active:cursor-grabbing' : ''
          }`}
        >
          {items.map((item, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={item.id}
                ref={(el) => {
                  barRefs.current[idx] = el;
                }}
                type="button"
                onClick={() => handleItemActivate(item, idx)}
                onFocus={() => focusItem(idx)}
                aria-label={`Explore ${item.title}`}
                aria-current={isActive ? 'true' : undefined}
                style={{
                  width: `${effectiveBarWidth}px`,
                  height: `${restBarHeight}px`,
                  borderRadius: `${radius}px`,
                }}
                className="group relative shrink-0 overflow-hidden bg-[#F3EEE3] shadow-[0_8px_24px_rgba(15,15,16,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] transition-shadow duration-200 cursor-pointer will-change-[width,height,transform]"
              >
                <img
                  src={item.src}
                  alt={item.title}
                  loading="lazy"
                  draggable={false}
                  className="w-full h-full object-cover object-center pointer-events-none select-none"
                />
                <div
                  className={`pointer-events-none absolute inset-0 transition-opacity duration-200 ${
                    isActive
                      ? 'bg-gradient-to-t from-black/75 via-black/15 to-transparent opacity-100'
                      : 'bg-black/15 opacity-60 group-hover:opacity-25'
                  }`}
                />
                {labels && isActive && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 text-left text-white">
                    {item.tag && (
                      <span className="block text-[9.5px] font-mono uppercase tracking-[0.16em] text-[#D4AF37] font-semibold">
                        {item.tag}
                      </span>
                    )}
                    <span className="block font-heading font-semibold text-sm leading-tight mt-0.5 truncate">
                      {item.title}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Active Collection Caption & Navigation Path */}
        {activeItem && (captions || labels) && (
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 w-full max-w-2xl px-2 text-center sm:text-left">
            <div className="min-w-0">
              {labels && (
                <p className="font-heading font-semibold text-base text-[#0F0F10] tracking-tight">
                  {activeItem.title}
                </p>
              )}
              {captions && activeItem.caption && (
                <p className="text-xs sm:text-[13px] text-[#6B7280] mt-0.5 leading-relaxed line-clamp-2">
                  {activeItem.caption}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleItemActivate(activeItem, activeIndex)}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white px-4 py-2 text-xs font-semibold active:scale-[0.97] transition-all cursor-pointer"
            >
              <span>Shop Collection</span>
              <ArrowRight size={13} weight="bold" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* Mobile Swipeable Collection Presentation (preserves vertical scroll & prevents overflow) */}
      <div className="md:hidden space-y-3">
        <div
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 scrollbar-hide touch-pan-x"
          style={{ WebkitOverflowScrolling: 'touch' }}
          onScroll={(e) => {
            const container = e.currentTarget;
            const firstChild = container.firstElementChild as HTMLElement | null;
            if (!firstChild) return;
            const itemStride = firstChild.offsetWidth + 12;
            const idx = Math.max(0, Math.min(count - 1, Math.round(container.scrollLeft / itemStride)));
            if (idx !== activeIndex) setActiveIndex(idx);
          }}
        >
          {items.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleItemActivate(item, idx)}
              style={{ borderRadius: `${radius}px` }}
              className="snap-start shrink-0 w-[68vw] max-w-[260px] text-left group relative overflow-hidden bg-white border border-[#E5E7EB] active:scale-[0.98] transition-transform cursor-pointer"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F6F5F2]">
                <img
                  src={item.src}
                  alt={item.title}
                  loading="lazy"
                  draggable={false}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                {item.tag && (
                  <span className="absolute bottom-2.5 left-3 text-[10px] font-mono uppercase tracking-[0.14em] text-[#D4AF37] font-semibold">
                    {item.tag}
                  </span>
                )}
              </div>
              <div className="p-3 space-y-1">
                {labels && (
                  <p className="font-heading font-semibold text-[15px] text-[#0F0F10] leading-snug">
                    {item.title}
                  </p>
                )}
                {captions && item.caption && (
                  <p className="text-xs text-[#6B7280] leading-relaxed line-clamp-2">
                    {item.caption}
                  </p>
                )}
                <span className="inline-flex items-center gap-1 pt-1 text-xs font-semibold text-[#997A2E]">
                  <span>Explore</span>
                  <ArrowRight size={12} weight="bold" aria-hidden="true" />
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Minimal Index Dots */}
        <div className="flex items-center justify-center gap-1.5" aria-hidden="true">
          {items.map((item, idx) => (
            <span
              key={item.id}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                idx === activeIndex ? 'w-5 bg-[#0F0F10]' : 'w-1.5 bg-[#E5E7EB]'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ElasticReel;

