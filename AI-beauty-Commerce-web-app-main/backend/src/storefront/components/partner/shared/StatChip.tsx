import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatChipProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  subtext?: string;
  badge?: string;
  badgeVariant?: 'default' | 'gold' | 'warning' | 'success';
}

export const StatChip: React.FC<StatChipProps> = ({
  label,
  value,
  change,
  trend = 'neutral',
  subtext,
  badge
}) => {
  return (
    <article className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#6B7280] truncate">
          {label}
        </span>
        {badge && (
          <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-[#0F0F10] shrink-0">
            {badge}
          </span>
        )}
      </div>

      <div>
        <p className="font-heading font-extrabold text-2xl text-[#0F0F10] tracking-tight font-digit">
          {value}
        </p>
      </div>

      {(change || subtext) && (
        <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-[#6B7280]">
          {change && (
            <span className="inline-flex items-center gap-1 font-bold text-[#0F0F10]">
              {trend === 'up' && <TrendingUp size={12} className="text-[#0F0F10]" />}
              {trend === 'down' && <TrendingDown size={12} className="text-[#0F0F10]" />}
              <span>{change}</span>
            </span>
          )}
          {subtext && <span className="truncate text-[#6B7280]">{subtext}</span>}
        </div>
      )}
    </article>
  );
};
