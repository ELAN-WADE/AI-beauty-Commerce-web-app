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
  size = 'md'
}: FilterTabsProps<T>) => {
  return (
    <div
      role="tablist"
      aria-label="Filter options"
      className={`flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1 ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`shrink-0 rounded-full font-semibold transition-all duration-160 ease-out active:scale-[0.97] cursor-pointer flex items-center gap-1.5 ${
              size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-xs sm:text-sm'
            } ${
              isActive
                ? 'bg-[#0F0F10] text-white shadow-xs'
                : 'bg-white hover:bg-[#FAF9F6] text-[#4B5563] hover:text-[#0F0F10] border border-[#E5E7EB]'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-[#F3F4F6] text-[#6B7280]'
                }`}
              >
                {tab.count}
              </span>
            )}
            {tab.badge && (
              <span className="text-[9px] uppercase tracking-wider font-mono font-bold bg-[#D4AF37] text-[#0F0F10] px-1.5 py-0.2 rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
