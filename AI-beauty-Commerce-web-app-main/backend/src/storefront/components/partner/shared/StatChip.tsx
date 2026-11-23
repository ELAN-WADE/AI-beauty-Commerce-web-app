import React from 'react';
import { TrendingUp, TrendingDown } from '../../common/SolidIcons';

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
  badge,
  badgeVariant = 'default',
}) => {
  const badgeTone =
    badgeVariant === 'warning'
      ? 'bg-amber-50 text-amber-800 border border-amber-200/80'
      : badgeVariant === 'success'
        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
        : badgeVariant === 'gold'
          ? 'bg-[#FBF5E8] text-[#8C6D28] border border-[#D4AF37]/30'
          : 'text-[#6B7280]';

  return (
    <article className="p-3.5 sm:p-5 rounded-2xl bg-white border border-[#EAE5DC] flex flex-col justify-between min-w-0">
      <div className="flex items-start justify-between gap-1.5 mb-1.5">
        <span className="text-[11px] sm:text-xs font-medium text-[#6B7280] leading-snug line-clamp-2">
          {label}
        </span>
        {badge && (
          <span
            className={`text-[9.5px] sm:text-[10.5px] font-mono font-semibold uppercase tracking-wider shrink-0 rounded-full px-1.5 py-0.5 leading-none ${badgeTone}`}
          >
            {badge}
          </span>
        )}
      </div>

      <div>
        <p className="font-heading font-semibold text-lg sm:text-2xl text-[#0F0F10] tracking-tight font-digit tabular-nums">
          {value}
        </p>
      </div>

      {(change || subtext) && (
        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] sm:text-xs text-[#6B7280] min-w-0">
          {change && (
            <span className="inline-flex items-center gap-1 font-medium text-[#0F0F10] shrink-0">
              {trend === 'up' && <TrendingUp size={12} className="text-[#0F0F10]" />}
              {trend === 'down' && <TrendingDown size={12} className="text-[#0F0F10]" />}
              <span>{change}</span>
            </span>
          )}
          {subtext && (
            <span className="text-[#6B7280] leading-snug line-clamp-2">
              {subtext}
            </span>
          )}
        </div>
      )}
    </article>
  );
};
