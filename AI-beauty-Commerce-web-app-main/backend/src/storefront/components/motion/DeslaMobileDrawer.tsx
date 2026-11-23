'use client';

import React, { useEffect, useState } from 'react';
import { Drawer } from 'vaul';
import NumberFlow, { type Format } from '@number-flow/react';
import { useReducedMotion } from 'motion/react';
import { DeslaModalFrame } from './DeslaMotion';

/**
 * Tracks whether the current viewport is a mobile touch width (< 640px).
 * Defaults to false during SSR to prevent hydration mismatch, then syncs on mount.
 */
export function useIsMobileSheetViewport(breakpointPx = 640): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mql = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`);
    const update = () => setIsMobile(mql.matches);
    update();
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', update);
      return () => mql.removeEventListener('change', update);
    }
    mql.addListener(update);
    return () => mql.removeListener(update);
  }, [breakpointPx]);

  return isMobile;
}

export interface DeslaMobileDrawerProps {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  children: React.ReactNode;
  /** Desktop modal panel classes (used when viewport >= breakpointPx and forceDrawer is false). */
  desktopPanelClassName?: string;
  /** Mobile Vaul sheet classes (used when viewport < breakpointPx or forceDrawer is true). */
  mobileContentClassName?: string;
  /** Force Vaul bottom sheet even above 640px (e.g., partner mobile bottom sheets). */
  forceDrawer?: boolean;
  /** Breakpoint below which Vaul Drawer is rendered (default 640 = sm). */
  breakpointPx?: number;
  /** Optional snap points or hide drag handle. */
  showHandle?: boolean;
  /** Optional subtle iOS background scaling effect. */
  shouldScaleBackground?: boolean;
}

/**
 * Responsive luxury overlay primitive:
 * - Mobile (< 640px): Native Vaul drag-to-dismiss bottom sheet with velocity physics,
 *   rubber-band boundary damping, safe-area inset support, and overscroll containment.
 * - Desktop (>= 640px): Preserves Desla's centered DeslaModalFrame.
 */
export const DeslaMobileDrawer: React.FC<DeslaMobileDrawerProps> = ({
  open,
  onClose,
  ariaLabel,
  children,
  desktopPanelClassName = 'w-full max-w-lg rounded-3xl bg-white border border-[#E7E1D6] shadow-2xl overflow-hidden',
  mobileContentClassName = 'bg-white rounded-t-[24px] border-t border-[#E7E1D6] shadow-2xl max-h-[90dvh] flex flex-col overflow-hidden',
  forceDrawer = false,
  breakpointPx = 640,
  showHandle = true,
  shouldScaleBackground = true,
}) => {
  const isMobile = useIsMobileSheetViewport(breakpointPx);
  const useVaul = forceDrawer || isMobile;

  if (!useVaul) {
    return (
      <DeslaModalFrame
        open={open}
        onClose={onClose}
        ariaLabel={ariaLabel}
        panelClassName={desktopPanelClassName}
        align="center"
      >
        {children}
      </DeslaModalFrame>
    );
  }

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      shouldScaleBackground={shouldScaleBackground}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-[#0F0F10]/50 backdrop-blur-[2px]" />
        <Drawer.Content
          aria-label={ariaLabel}
          className={`fixed inset-x-0 bottom-0 z-50 outline-none font-body pb-safe ${mobileContentClassName}`}
        >
          <Drawer.Title className="sr-only">{ariaLabel}</Drawer.Title>
          {showHandle && (
            <div className="flex justify-center pt-2.5 pb-1.5 shrink-0 cursor-grab active:cursor-grabbing" aria-hidden="true">
              <div className="w-10 h-1 rounded-full bg-[#D8D2C8]" />
            </div>
          )}
          {children}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

/**
 * Desla-calibrated rolling numeric value using @number-flow/react.
 * Respects prefers-reduced-motion automatically and enforces tabular-nums.
 */
export const DeslaRollingNumber: React.FC<{
  value: number;
  prefix?: string;
  suffix?: string;
  format?: Format;
  locales?: string;
  className?: string;
}> = ({
  value,
  prefix,
  suffix,
  format,
  locales = 'en-NG',
  className = '',
}) => {
  const prefersReduced = useReducedMotion();
  const safeValue = Number.isFinite(value) ? value : 0;

  return (
    <NumberFlow
      value={safeValue}
      prefix={prefix}
      suffix={suffix}
      format={format}
      locales={locales}
      animated={!prefersReduced}
      transformTiming={{ duration: 240, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }}
      opacityTiming={{ duration: 160, easing: 'ease-out' }}
      className={`tabular-nums ${className}`}
    />
  );
};
