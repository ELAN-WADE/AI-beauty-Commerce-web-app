'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import { SCREEN_PATHS } from '@/lib/screen-routes';
import { useApp } from '../../context/AppContext';
import { NavigationIcon } from './NavigationIcon';
import { DESLA_EASE_OUT } from '../motion/DeslaMotion';

export const BottomNav: React.FC = () => {
  const router = useRouter();
  const { currentScreen, navigateTo } = useApp();
  const prefersReduced = useReducedMotion();

  const items = [
    { icon: 'home', label: 'Home', screen: 'home', active: ['home', 'desktop-home', 'splash'] },
    { icon: 'shop', label: 'Shop', screen: 'catalogue', active: ['catalogue', 'categories', 'search', 'product-details'] },
    { icon: 'scan', label: 'Scan', screen: 'ai-scan', active: ['ai-scan'] },
    { icon: 'community', label: 'Community', screen: 'community', active: ['community'] },
    { icon: 'account', label: 'Account', screen: 'account', active: ['account', 'orders', 'rewards'] },
  ] as const;

  return (
    <nav
      aria-label="Mobile Navigation"
      className="sticky bottom-0 left-0 right-0 z-40 bg-[#FBF9F5]/95 backdrop-blur-xl border-t border-[#E7E1D6] shadow-[0_-8px_24px_-14px_rgba(17,17,17,0.12)] shrink-0 lg:hidden font-body pb-[calc(0.25rem+env(safe-area-inset-bottom,0px))]"
    >
      <div className="w-full px-2 pt-1.5 pb-1 flex items-center justify-between max-w-md mx-auto">
        {items.map((item) => {
          const active = (item.active as readonly string[]).includes(currentScreen);
          const isScan = item.icon === 'scan';
          return (
            <button
              key={item.icon}
              type="button"
              onPointerEnter={() => router.prefetch(SCREEN_PATHS[item.screen])}
              onFocus={() => router.prefetch(SCREEN_PATHS[item.screen])}
              onTouchStart={() => router.prefetch(SCREEN_PATHS[item.screen])}
              onClick={() => navigateTo(item.screen)}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center flex-1 min-h-[52px] gap-1 touch-manipulation transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-95 cursor-pointer ${
                active
                  ? 'text-[#111111] font-semibold'
                  : 'text-[#767168] font-medium'
              }`}
            >
              <span className="relative flex items-center justify-center w-12 h-7 rounded-full">
                {active && (
                  <motion.span
                    layoutId={prefersReduced ? undefined : 'mobile-bottom-nav-pill'}
                    transition={
                      prefersReduced
                        ? { duration: 0 }
                        : { duration: 0.2, ease: DESLA_EASE_OUT }
                    }
                    className={`absolute inset-0 rounded-full ${
                      isScan
                        ? 'bg-[#D4AF37]/20 border border-[#D4AF37]/40'
                        : 'bg-[#111111]/[0.07]'
                    }`}
                    aria-hidden="true"
                  />
                )}
                <NavigationIcon
                  name={item.icon}
                  size={20}
                  active={active}
                  className={`relative z-10 ${
                    isScan && active
                      ? 'text-[#8C6D28]'
                      : isScan
                        ? 'text-[#997A2E]'
                        : ''
                  }`}
                />
              </span>
              <span className="text-[10px] leading-none tracking-[0.01em]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
