'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { DESLA_EASE_OUT } from '../motion/DeslaMotion';

export interface VisualCategoryItem {
  label: string;
  value: string;
  image: string;
}

/**
 * Canonical circular category set shared between the Shop catalogue strip
 * and the mobile Curated Collections carousel.
 */
export const SHOP_VISUAL_CATEGORIES: VisualCategoryItem[] = [
  { label: 'All Range', value: 'All', image: '/artwork/collection-seasonal-editorial.webp' },
  { label: 'Skin Care', value: 'skincare', image: '/cat_skincare.jpg' },
  { label: 'Body Rituals', value: 'body-care', image: '/cat_bodycare.jpg' },
  { label: 'Haute Fragrance', value: 'fragrance', image: '/cat_fragrance.jpg' },
  { label: 'Lip & Color', value: 'makeup', image: '/cat_makeup.jpg' },
  { label: 'Lifestyle', value: 'lifestyle', image: '/cat_lifestyle.jpg' },
  { label: 'Sun Defense', value: 'suncare', image: '/product_sunscreen.jpg' },
  { label: 'Bath & Body', value: 'bath', image: '/routine_01_cleanse.jpg' },
];

export interface CircularCategoryChipProps {
  item: VisualCategoryItem;
  isActive?: boolean;
  onClick: () => void;
  indicatorLayoutId?: string;
  size?: 'shop' | 'carousel';
  decorative?: boolean;
}

/**
 * Exact circular category tile from the Shop page:
 * circular cropped image container + clean single-line category label beneath.
 */
export const CircularCategoryChip: React.FC<CircularCategoryChipProps> = ({
  item,
  isActive = false,
  onClick,
  indicatorLayoutId,
  size = 'shop',
  decorative = false,
}) => {
  const circleDimensions =
    size === 'carousel'
      ? 'w-16 h-16'
      : 'w-14 h-14 sm:w-16 sm:h-16';

  return (
    <button
      type="button"
      aria-pressed={indicatorLayoutId ? isActive : undefined}
      aria-hidden={decorative || undefined}
      tabIndex={decorative ? -1 : undefined}
      onClick={onClick}
      className="relative flex flex-col items-center gap-1.5 pb-2 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89248] rounded-xl transition-transform active:scale-95 shrink-0 select-none"
    >
      <div
        className={`${circleDimensions} rounded-full overflow-hidden p-0.5 transition-all duration-200 ${
          isActive
            ? 'ring-2 ring-[#111111] ring-offset-2 scale-[1.03] shadow-xs'
            : 'border border-[#EAE5DC] hover:border-[#B89248]/70 opacity-90 group-hover:opacity-100'
        }`}
      >
        <img
          src={item.image}
          alt={decorative ? '' : item.label}
          draggable={false}
          className="w-full h-full object-cover rounded-full pointer-events-none"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/product_barrier_cream.jpg';
          }}
        />
      </div>
      <span
        className={`text-[11px] whitespace-nowrap transition-colors duration-200 ${
          isActive
            ? 'font-medium text-[#111111]'
            : 'font-normal text-[#6E6A63] group-hover:text-[#111111]'
        }`}
      >
        {item.label}
      </span>
      {isActive && indicatorLayoutId && (
        <motion.span
          layoutId={indicatorLayoutId}
          transition={{ duration: 0.26, ease: DESLA_EASE_OUT }}
          className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-[#B89248]"
          aria-hidden="true"
        />
      )}
    </button>
  );
};

export interface MobileCircularCategoryCarouselProps {
  items: VisualCategoryItem[];
  onSelect: (categoryValue: string) => void;
  /** Scroll drift speed in pixels per second (default 26px/s). */
  speedPxPerSec?: number;
}

/**
 * Seamless, manually swipeable, auto-moving horizontal circular category carousel.
 * - Uses native scroll + requestAnimationFrame sub-pixel accumulation with exact
 *   half-track modulo wrapping for zero visual jumps or flicker.
 * - Pauses automatically on touch, pointer, wheel, hover, or focus and smoothly
 *   resumes after user interaction settles.
 * - Honors prefers-reduced-motion (disables auto-drift while keeping swipe native).
 */
export const MobileCircularCategoryCarousel: React.FC<MobileCircularCategoryCarouselProps> = ({
  items,
  onSelect,
  speedPxPerSec = 26,
}) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const firstSetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const firstSet = firstSetRef.current;
    if (!scroller || !firstSet || items.length === 0) return;

    const motionQuery =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

    let reducedMotion = motionQuery?.matches ?? false;
    const handleMotionChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
    };
    motionQuery?.addEventListener?.('change', handleMotionChange);

    let setWidth = firstSet.offsetWidth;
    const measure = () => {
      setWidth = firstSet.offsetWidth;
    };

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    resizeObserver?.observe(firstSet);

    let interacting = false;
    let resumeTimer: ReturnType<typeof setTimeout> | null = null;
    if (scroller.scrollLeft === 0 && setWidth > 4) {
      scroller.scrollLeft = 2;
    }
    let virtualScroll = scroller.scrollLeft;
    let lastTimestamp = 0;
    let rafId = 0;

    const pauseInteraction = () => {
      interacting = true;
      if (resumeTimer) {
        clearTimeout(resumeTimer);
        resumeTimer = null;
      }
    };

    const scheduleResume = (delayMs = 1400) => {
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => {
        if (!scroller) return;
        virtualScroll = scroller.scrollLeft;
        interacting = false;
      }, delayMs);
    };

    const onPointerDown = () => pauseInteraction();
    const onPointerUp = () => scheduleResume(1400);
    const onTouchStart = () => pauseInteraction();
    const onTouchEnd = () => scheduleResume(1400);
    const onMouseEnter = () => pauseInteraction();
    const onMouseLeave = () => scheduleResume(400);
    const onFocusIn = () => pauseInteraction();
    const onFocusOut = () => scheduleResume(600);

    // Keep manual swiping seamlessly wrapped in both directions without jumps
    const onScroll = () => {
      if (!interacting || setWidth <= 0) return;
      const current = scroller.scrollLeft;
      if (current >= setWidth) {
        scroller.scrollLeft = current - setWidth;
      } else if (current <= 0) {
        scroller.scrollLeft = current + setWidth;
      }
      virtualScroll = scroller.scrollLeft;
    };

    scroller.addEventListener('pointerdown', onPointerDown, { passive: true });
    scroller.addEventListener('pointerup', onPointerUp, { passive: true });
    scroller.addEventListener('pointercancel', onPointerUp, { passive: true });
    scroller.addEventListener('touchstart', onTouchStart, { passive: true });
    scroller.addEventListener('touchend', onTouchEnd, { passive: true });
    scroller.addEventListener('touchcancel', onTouchEnd, { passive: true });
    scroller.addEventListener('mouseenter', onMouseEnter);
    scroller.addEventListener('mouseleave', onMouseLeave);
    scroller.addEventListener('focusin', onFocusIn);
    scroller.addEventListener('focusout', onFocusOut);
    scroller.addEventListener('scroll', onScroll, { passive: true });

    const tick = (now: number) => {
      if (lastTimestamp === 0) lastTimestamp = now;
      const dt = Math.min(0.05, (now - lastTimestamp) / 1000);
      lastTimestamp = now;

      if (!interacting && !reducedMotion && !document.hidden && setWidth > 0) {
        virtualScroll += speedPxPerSec * dt;
        if (virtualScroll >= setWidth) {
          virtualScroll -= setWidth;
        }
        scroller.scrollLeft = virtualScroll;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      if (resumeTimer) clearTimeout(resumeTimer);
      resizeObserver?.disconnect();
      motionQuery?.removeEventListener?.('change', handleMotionChange);
      scroller.removeEventListener('pointerdown', onPointerDown);
      scroller.removeEventListener('pointerup', onPointerUp);
      scroller.removeEventListener('pointercancel', onPointerUp);
      scroller.removeEventListener('touchstart', onTouchStart);
      scroller.removeEventListener('touchend', onTouchEnd);
      scroller.removeEventListener('touchcancel', onTouchEnd);
      scroller.removeEventListener('mouseenter', onMouseEnter);
      scroller.removeEventListener('mouseleave', onMouseLeave);
      scroller.removeEventListener('focusin', onFocusIn);
      scroller.removeEventListener('focusout', onFocusOut);
      scroller.removeEventListener('scroll', onScroll);
    };
  }, [items, speedPxPerSec]);

  return (
    <div
      ref={scrollerRef}
      role="region"
      aria-label="Curated beauty categories"
      className="flex overflow-x-auto no-scrollbar py-1.5 -mx-4 px-4 touch-pan-x touch-pan-y"
    >
      {/* Primary canonical track (keyboard & screen-reader accessible) */}
      <div ref={firstSetRef} className="flex items-start gap-4 pr-4 shrink-0">
        {items.map((item) => (
          <CircularCategoryChip
            key={`primary-${item.value}`}
            item={item}
            size="carousel"
            onClick={() => onSelect(item.value)}
          />
        ))}
      </div>

      {/* Seamless loop duplicate track (visually identical, ignored by assistive tech) */}
      <div aria-hidden="true" className="flex items-start gap-4 pr-4 shrink-0">
        {items.map((item) => (
          <CircularCategoryChip
            key={`clone-${item.value}`}
            item={item}
            size="carousel"
            decorative
            onClick={() => onSelect(item.value)}
          />
        ))}
      </div>
    </div>
  );
};
