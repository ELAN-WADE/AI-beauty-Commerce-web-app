import React from 'react';
import { preparePublicScreen } from '../../lib/public-screen-preload';
import { useApp } from '../../context/AppContext';
import { NavigationIcon } from './NavigationIcon';
export const BottomNav: React.FC = () => {
  const { currentScreen, navigateTo } = useApp();
  const items = [
    { icon: 'home', label: 'Home', screen: 'home', active: ['home', 'desktop-home', 'splash'] },
    { icon: 'shop', label: 'Shop', screen: 'catalogue', active: ['catalogue', 'categories', 'search', 'product-details'] },
    { icon: 'scan', label: 'Scan', screen: 'ai-scan', active: ['ai-scan'] },
    { icon: 'community', label: 'Community', screen: 'community', active: ['community'] },
    { icon: 'account', label: 'Account', screen: 'account', active: ['account', 'orders', 'rewards'] },
  ] as const;
  return <nav aria-label="Mobile Navigation" className="sticky bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#E5E7EB]/80 shrink-0 lg:hidden font-body pb-[calc(0.25rem+env(safe-area-inset-bottom,0px))]">
    <div className="w-full px-2 py-1 flex items-center justify-between max-w-md mx-auto">
      {items.map(item => { const active = (item.active as readonly string[]).includes(currentScreen); return <button key={item.icon} type="button" onPointerEnter={() => preparePublicScreen(item.screen)} onFocus={() => preparePublicScreen(item.screen)} onTouchStart={() => preparePublicScreen(item.screen)} onClick={() => navigateTo(item.screen)} aria-label={item.label} aria-current={active ? 'page' : undefined} className={'flex flex-col items-center justify-center flex-1 min-h-[56px] gap-1 touch-manipulation active:scale-95 ' + (active ? 'text-[#0F0F10] font-semibold' : 'text-[#8E8E93]')}>
        <NavigationIcon name={item.icon} /><span className="text-[10px] leading-none">{item.label}</span>
      </button>; })}
    </div>
  </nav>;
};
