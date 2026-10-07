import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Share2,
  ArrowRight,
  Gift,
  Megaphone,
  CheckCircle2,
  TrendingUp,
  Eye,
  ShoppingBag
} from 'lucide-react';
import { StatChip } from '../shared/StatChip';
import { StatusBadge } from '../shared/StatusBadge';

export interface CreatorOverviewProps {
  onNavigate: (routeId: string) => void;
  onOpenCreate: () => void;
}

export const CreatorOverview: React.FC<CreatorOverviewProps> = ({
  onNavigate,
  onOpenCreate
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10] tracking-tight">
              Good morning, Amara ✦
            </h1>
            <span className="hidden sm:inline-block text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FBF5E8] text-[#997A2E] border border-[#D4AF37]/30">
              Level 3 Luminary
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1 font-medium">
            Your content inspired 126k clients across Lagos &amp; Abuja this month.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigate('storefront')}
            className="px-4 py-2 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-semibold text-[#0F0F10] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 size={13} className="text-[#6B7280]" />
            <span>Storefront</span>
          </button>
          <button
            onClick={onOpenCreate}
            className="px-5 py-2 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-bold shadow-xs active:scale-[0.97] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} className="text-[#D4AF37]" />
            <span>Create Content</span>
          </button>
        </div>
      </div>

      {/* 4 Financial & Performance KPI Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatChip
          label="Available Earnings"
          value="₦84,620"
          change="+18.4%"
          trend="up"
          subtext="Cleared for withdrawal"
          badge="Ready"
          badgeVariant="success"
        />
        <StatChip
          label="Pending Commission"
          value="₦21,300"
          subtext="2 orders in validation"
          badge="Pending"
          badgeVariant="warning"
        />
        <StatChip
          label="Attributed Orders"
          value="148"
          change="+18%"
          trend="up"
          subtext="From your shared links"
        />
        <StatChip
          label="Total Sales Generated"
          value="₦684,400"
          subtext="Avg ₦4,624 / order"
          badge="12% Rate"
          badgeVariant="gold"
        />
      </section>

      {/* Two-Column Midsection: Performance Chart & Level Progression */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Performance Overview */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#997A2E] block">
                Revenue Velocity
              </span>
              <h2 className="font-heading font-bold text-lg text-[#0F0F10] mt-0.5">
                Attributed Sales Trend
              </h2>
            </div>
            <div className="flex items-center gap-1 p-0.5 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] self-start sm:self-auto text-xs">
              {(['7d', '30d', '90d'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                    timeRange === r
                      ? 'bg-[#0F0F10] text-white'
                      : 'text-[#6B7280] hover:text-[#0F0F10]'
                  }`}
                >
                  {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '90 Days'}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Chart Graphic with Golden Gradient Area */}
          <div className="relative h-44 sm:h-52 w-full pt-4">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 600 180"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="chart-gold-glow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Subtle grid lines */}
              <line x1="0" y1="40" x2="600" y2="40" stroke="#F3F4F6" strokeDasharray="4 4" />
              <line x1="0" y1="90" x2="600" y2="90" stroke="#F3F4F6" strokeDasharray="4 4" />
              <line x1="0" y1="140" x2="600" y2="140" stroke="#F3F4F6" strokeDasharray="4 4" />

              {/* Area */}
              <polygon
                points="0,150 50,135 120,110 190,125 260,80 340,95 420,50 500,65 600,30 600,180 0,180"
                fill="url(#chart-gold-glow)"
              />
              {/* Line */}
              <polyline
                points="0,150 50,135 120,110 190,125 260,80 340,95 420,50 500,65 600,30"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Data points */}
              <circle cx="260" cy="80" r="4" fill="#0F0F10" stroke="#D4AF37" strokeWidth="2" />
              <circle cx="420" cy="50" r="4" fill="#0F0F10" stroke="#D4AF37" strokeWidth="2" />
              <circle cx="600" cy="30" r="5" fill="#D4AF37" stroke="#FFFFFF" strokeWidth="2" />
            </svg>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#9CA3AF] font-mono pt-3 border-t border-[#E5E7EB]">
            <span>1 Oct</span>
            <span>8 Oct</span>
            <span>15 Oct</span>
            <span>22 Oct</span>
            <span className="font-bold text-[#0F0F10]">29 Oct (₦684k)</span>
          </div>
        </div>

        {/* Right (1 col): Creator Tier Progression */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
                Tier Status
              </span>
              <span className="text-xs font-bold text-[#0F0F10]">72% Complete</span>
            </div>
            <h3 className="font-heading font-bold text-lg text-[#0F0F10] mt-1">
              Level 3: Luminary
            </h3>
            <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
              Generate ₦315,600 more in verified client sales to unlock <strong>Icon Tier</strong>.
            </p>

            {/* Progress bar */}
            <div className="w-full h-2.5 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] mt-4 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B38A22] transition-all duration-500"
                style={{ width: '72%' }}
              />
            </div>

            <div className="mt-5 p-3.5 rounded-2xl bg-[#FBF5E8]/70 border border-[#D4AF37]/25 space-y-2">
              <p className="text-[11px] font-bold text-[#0F0F10] flex items-center gap-1.5">
                <Sparkles size={13} className="text-[#D4AF37]" />
                <span>Next Tier VIP Unlocks:</span>
              </p>
              <ul className="text-xs text-[#4B5563] space-y-1">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-[#997A2E]" />
                  <span>15% Commission Rate (+3% boost)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-[#997A2E]" />
                  <span>Automatic seasonal PR Box allocation</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-[#997A2E]" />
                  <span>Featured spot on Desla home showcase</span>
                </li>
              </ul>
            </div>
          </div>

          <button
            onClick={() => onNavigate('earnings')}
            className="w-full mt-5 py-2.5 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-semibold text-[#0F0F10] transition-colors cursor-pointer"
          >
            View Full Tier Benefits
          </button>
        </div>
      </section>

      {/* Opportunities Grid: Active Campaign & PR Room */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Campaign Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E5E7EB] hover:border-[#D4AF37] transition-all shadow-xs flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FBF5E8] text-[#997A2E] text-[10px] font-mono font-bold uppercase tracking-wider border border-[#D4AF37]/30">
                <Megaphone size={11} />
                <span>Featured Campaign</span>
              </span>
              <span className="text-xs text-rose-700 font-mono font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                12 Days Left
              </span>
            </div>

            <h3 className="font-heading font-extrabold text-xl text-[#0F0F10]">
              Glow Season 2026
            </h3>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-1 leading-relaxed">
              Showcase melanin hydration routines with Desla Vitamin C &amp; Radiant Glow Oil.
            </p>

            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#E5E7EB]/70 text-xs">
              <div>
                <span className="text-[10px] font-mono text-[#9CA3AF] uppercase block">
                  Commission
                </span>
                <span className="font-extrabold text-emerald-800 text-sm">15% + ₦25,000</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#9CA3AF] uppercase block">
                  Deliverables
                </span>
                <span className="font-bold text-[#0F0F10]">1 Reel + 1 Routine</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3">
            <button
              onClick={() => onNavigate('campaigns')}
              className="w-full py-2.5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98] cursor-pointer"
            >
              <span>View Campaign Brief</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* PR Package Opportunity Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E5E7EB] hover:border-[#D4AF37] transition-all shadow-xs flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold uppercase tracking-wider border border-emerald-200">
                <Gift size={11} />
                <span>PR Allocation Available</span>
              </span>
              <span className="text-xs text-[#997A2E] font-mono font-bold">
                Eligible ✓
              </span>
            </div>

            <h3 className="font-heading font-extrabold text-xl text-[#0F0F10]">
              Radiant Glow Collection
            </h3>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-1 leading-relaxed">
              Complimentary 4-piece clinical box shipped to your doorstep in Lagos or Abuja.
            </p>

            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#E5E7EB]/70 text-xs">
              <div>
                <span className="text-[10px] font-mono text-[#9CA3AF] uppercase block">
                  Box Value
                </span>
                <span className="font-extrabold text-[#0F0F10] text-sm">₦64,000 (Free)</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#9CA3AF] uppercase block">
                  Slots Left
                </span>
                <span className="font-bold text-amber-800">5 Spots Open</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3">
            <button
              onClick={() => onNavigate('pr-room')}
              className="w-full py-2.5 rounded-full border border-[#D4AF37] bg-[#FBF5E8] hover:bg-[#F3EEE3] text-xs font-bold text-[#997A2E] flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98] cursor-pointer"
            >
              <span>Request PR Package</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </section>

      {/* Recent Published Content */}
      <section className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#997A2E] block">
              Content Performance
            </span>
            <h3 className="font-heading font-bold text-lg text-[#0F0F10]">
              Recently Published Content
            </h3>
          </div>
          <button
            onClick={() => onNavigate('content')}
            className="text-xs font-bold text-[#0F0F10] hover:text-[#997A2E] flex items-center gap-1 cursor-pointer"
          >
            <span>View All (42)</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="divide-y divide-[#E5E7EB]/70">
          {[
            {
              id: '1',
              title: 'Morning Glass Skin Routine for Melanin Rich Complexions',
              format: 'Beauty Routine',
              views: '12.8k',
              orders: '42 orders',
              commission: '₦19,400',
              status: 'published' as const,
              date: 'Published yesterday'
            },
            {
              id: '2',
              title: 'Clinical Barrier Repair Breakdown: 3 Essential Steps',
              format: 'Video Tutorial',
              views: '8.4k',
              orders: '28 orders',
              commission: '₦12,800',
              status: 'published' as const,
              date: 'Published 3 days ago'
            }
          ].map((item) => (
            <div
              key={item.id}
              className="py-3.5 first:pt-2 last:pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <StatusBadge status={item.status} />
                  <span className="text-[11px] font-mono text-[#6B7280]">
                    {item.format}
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-[#0F0F10]">
                  {item.title}
                </h4>
                <p className="text-[11px] text-[#9CA3AF]">{item.date}</p>
              </div>

              <div className="flex items-center gap-4 text-xs font-medium shrink-0">
                <div className="text-right">
                  <span className="flex items-center gap-1 text-[#6B7280]">
                    <Eye size={12} />
                    <span>{item.views}</span>
                  </span>
                  <span className="flex items-center gap-1 font-bold text-[#0F0F10] mt-0.5">
                    <ShoppingBag size={12} />
                    <span>{item.orders}</span>
                  </span>
                </div>
                <div className="text-right pl-3 border-l border-[#E5E7EB]">
                  <span className="text-[10px] font-mono text-[#9CA3AF] uppercase block">
                    Earned
                  </span>
                  <span className="font-extrabold text-[#0F0F10] text-sm">
                    {item.commission}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
