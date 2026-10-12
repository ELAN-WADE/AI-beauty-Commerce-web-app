import React, { useState } from 'react';
import { TrendingUp, BarChart2, ShoppingBag, ArrowUpRight } from 'lucide-react';
import { StatChip } from '../shared/StatChip';

export const DistributorSales: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'quarter'>('week');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="pb-2 border-b border-[#E5E7EB]">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
          Regional Demand Analytics
        </span>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10]">
          Sales &amp; Dispatch Velocity
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
          Real-time order turnover and product movement across your assigned city hub zones.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatChip label="Gross Sales This Week" value="₦2,240,000" change="+18.2%" trend="up" subtext="Across 148 dispatches" />
        <StatChip label="Average Order Value" value="₦15,100" subtext="Per customer delivery" />
        <StatChip label="Top Moving Category" value="Treatment Oils" subtext="42% of hub dispatches" badge="Fastest" badgeVariant="gold" />
      </div>

      {/* Visual Chart Card */}
      <div className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-heading font-bold text-lg text-[#0F0F10]">
              Daily Dispatch Volume (Orders vs Revenue)
            </h2>
            <p className="text-xs text-[#6B7280]">Daily breakdown of fulfilled same-day dispatches</p>
          </div>
          <div className="flex items-center gap-1 p-0.5 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] text-xs">
            {(['week', 'month', 'quarter'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeFilter(t)}
                className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                  timeFilter === t ? 'bg-[#0F0F10] text-white' : 'text-[#6B7280]'
                }`}
              >
                {t === 'week' ? 'This Week' : t === 'month' ? 'This Month' : 'Quarter'}
              </button>
            ))}
          </div>
        </div>

        {/* Dual Axis Bars */}
        <div className="h-48 flex items-end justify-between gap-3 pt-6 border-b border-[#E5E7EB] px-2">
          {[
            { day: 'Mon', count: 18, height: '45%' },
            { day: 'Tue', count: 24, height: '60%' },
            { day: 'Wed', count: 19, height: '48%' },
            { day: 'Thu', count: 32, height: '80%' },
            { day: 'Fri', count: 28, height: '70%' },
            { day: 'Sat', count: 38, height: '95%' },
            { day: 'Sun', count: 14, height: '35%' }
          ].map((bar, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
              <span className="text-[10px] font-mono text-[#9CA3AF] opacity-0 group-hover:opacity-100 transition-opacity">
                {bar.count}
              </span>
              <div
                className="w-full max-w-10 rounded-t-xl bg-[#0F0F10] group-hover:bg-[#D4AF37] transition-colors"
                style={{ height: bar.height }}
              />
              <span className="text-[11px] font-mono text-[#6B7280] font-bold">{bar.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
