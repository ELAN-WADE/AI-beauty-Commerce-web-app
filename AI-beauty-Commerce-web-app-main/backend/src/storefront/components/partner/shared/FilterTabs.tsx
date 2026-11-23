import React from 'react';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  count?: number;
  badge?: string;
}

export interface FilterTabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export const FilterTabs = <T extends string>({
  tabs,
  activeTab,
  onChange,
  className = '',
  size = 'md',
}: FilterTabsProps<T>) => {
  return (
    <div className={`relative min-w-0 ${className}`}>
      <div
        role="tablist"
        aria-label="Filter options"
        className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1 pr-6"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              type="button"
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`shrink-0 rounded-full font-semibold transition-[transform,background-color,color,border-color] duration-150 ease-out active:scale-[0.97] cursor-pointer flex items-center gap-1.5 ${
                size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm'
              } ${
                isActive
                  ? 'bg-[#111111] text-white shadow-sm'
                  : 'bg-white hover:bg-[#FAF9F6] text-[#4B5563] hover:text-[#111111] border border-[#E7E1D6]'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-semibold leading-none tabular-nums ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[#F3F4F6] text-[#6B7280]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
              {tab.badge && (
                <span className="text-[9px] uppercase tracking-wider font-mono font-medium bg-[#D4AF37] text-[#111111] px-1.5 py-0.5 rounded-full leading-none">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {/* Subtle right-edge scroll hint fade on narrow mobile screens */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-7 bg-gradient-to-l from-white via-white/80 to-transparent sm:hidden"
        aria-hidden="true"
      />
    </div>
  );
};
