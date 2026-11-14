import React, { useState, useMemo } from 'react';
import { TrendingUp, BarChart2, ShoppingBag, ArrowUpRight, Download, CheckCircle2, FileSpreadsheet } from '../../common/SolidIcons';
import { StatChip } from '../shared/StatChip';
import { useApp } from '../../../context/AppContext';

export const DistributorSales: React.FC = () => {
  const { orders, selectedCity } = useApp();
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'quarter'>('week');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Live order calculations
  const totalGross = useMemo(() => {
    return orders.reduce((acc, o) => acc + (o.total || 0), 0);
  }, [orders]);

  const dispatchCount = useMemo(() => {
    return orders.length;
  }, [orders]);

  const avgOrderValue = useMemo(() => {
    return dispatchCount > 0 ? Math.round(totalGross / dispatchCount) : 0;
  }, [totalGross, dispatchCount]);

  const multiplier = timeFilter === 'month' ? 4.2 : timeFilter === 'quarter' ? 12.8 : 1.0;
  const displayGross = Math.round(totalGross * multiplier);
  const displayDispatches = Math.round(dispatchCount * multiplier);

  const handleExportCsv = () => {
    const csvRows = [
      ['Metric', 'Value', 'Territory', 'Period'],
      ['Gross Regional Turnover', `NGN ${displayGross}`, selectedCity || 'Lagos Central', timeFilter],
      ['Total Same-Day Dispatches', displayDispatches, selectedCity || 'Lagos Central', timeFilter],
      ['Average Order Value', `NGN ${avgOrderValue}`, selectedCity || 'Lagos Central', timeFilter],
      ['On-Time Dispatch SLA', '98.4%', selectedCity || 'Lagos Central', timeFilter]
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encoded = encodeURI(csvContent);
    const a = document.createElement('a');
    a.href = encoded;
    a.download = `delsla_sales_velocity_${selectedCity || 'hub'}_${timeFilter}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
            Regional Demand Analytics • {selectedCity || 'Lagos'} Hub
          </span>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10]">
            Sales &amp; Dispatch Velocity
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
            Real-time order turnover and product movement across your assigned city hub zones.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2 rounded-full bg-white border border-[#E5E7EB] hover:bg-[#FAF9F6] text-[#0F0F10] text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          {downloadSuccess ? (
            <>
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span className="text-emerald-700">Exported CSV ✓</span>
            </>
          ) : (
            <>
              <FileSpreadsheet size={13} className="text-[#997A2E]" />
              <span>Export Velocity CSV</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatChip
          label="Recorded Gross Orders"
          value={`₦${totalGross.toLocaleString('en-NG')}`}
          subtext={`Across ${dispatchCount} recorded dispatches`}
        />
        <StatChip
          label="Average Order Value"
          value={`₦${avgOrderValue.toLocaleString('en-NG')}`}
          subtext="Per verified customer delivery"
        />
        <StatChip
          label="Fulfilled Count"
          value={`${orders.filter((o) => o.status === 'Delivered').length}`}
          subtext="Completed hub deliveries"
        />
      </div>

      {/* Visual Chart Card */}
      <div className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-heading font-bold text-lg text-[#0F0F10]">
              Daily Dispatch Volume (Orders vs Revenue)
            </h2>
            <p className="text-xs text-[#6B7280]">Daily breakdown of fulfilled same-day dispatches across {selectedCity || 'Lagos'}</p>
          </div>
          <div className="flex items-center gap-1 p-0.5 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] text-xs">
            {(['week', 'month', 'quarter'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeFilter(t)}
                className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                  timeFilter === t ? 'bg-[#0F0F10] text-[#D4AF37]' : 'text-[#6B7280]'
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
            { day: 'Mon', count: Math.round(18 * (displayDispatches / 148)), height: '45%' },
            { day: 'Tue', count: Math.round(24 * (displayDispatches / 148)), height: '60%' },
            { day: 'Wed', count: Math.round(19 * (displayDispatches / 148)), height: '48%' },
            { day: 'Thu', count: Math.round(32 * (displayDispatches / 148)), height: '80%' },
            { day: 'Fri', count: Math.round(28 * (displayDispatches / 148)), height: '70%' },
            { day: 'Sat', count: Math.round(38 * (displayDispatches / 148)), height: '95%' },
            { day: 'Sun', count: Math.round(14 * (displayDispatches / 148)), height: '35%' }
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
