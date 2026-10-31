import React from 'react';
import { motion } from 'framer-motion';

export interface TabItem {
  id: string;
  label: string;
}

interface AnimatedTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: 'underline' | 'pill';
}

/**
 * AnimatedTabs
 * Source: Motion Primitives (https://motion-primitives.com)
 * Uses Framer Motion layoutId for fluid, layout-shift-free tab transitions.
 */
export const AnimatedTabs: React.FC<AnimatedTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
  variant = 'underline'
}) => {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center gap-1 ${
        variant === 'pill' ? 'bg-[#FAF9F6] p-1 rounded-full border border-[#E5E7EB]' : 'border-b border-[#E5E7EB]'
      } ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        if (variant === 'pill') {
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`relative px-4 py-2 text-xs font-semibold rounded-full transition-colors duration-150 cursor-pointer ${
                isActive ? 'text-[#0F0F10]' : 'text-[#6B7280] hover:text-[#0F0F10]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-pill-indicator"
                  className="absolute inset-0 bg-white rounded-full shadow-2xs border border-[#E5E7EB]"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative px-4 py-2.5 text-xs sm:text-sm font-semibold transition-colors duration-150 cursor-pointer ${
              isActive ? 'text-[#0F0F10]' : 'text-[#6B7280] hover:text-[#0F0F10]'
            }`}
          >
            <span className="relative z-10">{tab.label}</span>
            {isActive && (
              <motion.div
                layoutId="active-underline-indicator"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0F0F10]"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
