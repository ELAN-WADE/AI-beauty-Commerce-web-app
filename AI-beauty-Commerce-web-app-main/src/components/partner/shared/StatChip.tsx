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
  badge,
  badgeVariant = 'default'
}) => {
  const badgeColors = {
    default: 'bg-[#FAF9F6] text-[#6B7280] border-[#E5E7EB]',
    gold: 'bg-[#FBF5E8] text-[#997A2E] border-[#D4AF37]/30',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  };

  return (
    <article className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#D4AF37]/60 shadow-xs transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#6B7280] line-clamp-1">
          {label}
        </span>
        {badge && (
          <span
            className={`text-[9.5px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border shrink-0 ${badgeColors[badgeVariant]}`}
          >
            {badge}
          </span>
        )}
      </div>

      <div className="mt-1">
        <p className="font-heading font-extrabold text-xl sm:text-2xl text-[#0F0F10] tracking-tight">
          {value}
        </p>
      </div>

      {(change || subtext) && (
        <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-[#6B7280]">
          {change && (
            <span
              className={`inline-flex items-center gap-0.5 font-bold ${
                trend === 'up'
                  ? 'text-emerald-700'
                  : trend === 'down'
                  ? 'text-rose-700'
                  : 'text-[#6B7280]'
              }`}
            >
              {trend === 'up' && <TrendingUp size={12} />}
              {trend === 'down' && <TrendingDown size={12} />}
              {change}
            </span>
          )}
          {subtext && <span className="line-clamp-1">{subtext}</span>}
        </div>
      )}
    </article>
  );
};
