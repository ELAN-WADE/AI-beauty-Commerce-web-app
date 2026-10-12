import React from 'react';
import { BarChart2, Download, FileText, Calendar } from 'lucide-react';

export const DistributorReports: React.FC = () => {
  const reports = [
    {
      id: 'rep-1',
      title: 'Weekly Same-Day Fulfilment Speed & SLA Report',
      period: '1 Oct - 7 Oct 2026',
      size: 'CSV (140 KB)',
      desc: 'Average dispatch time: 1.8 hours. Courier handoff compliance: 98.4%.'
    },
    {
      id: 'rep-2',
      title: 'Monthly Inventory Valuation & Stock Movement Audit',
      period: 'September 2026',
      size: 'Excel (420 KB)',
      desc: 'Complete SKU breakdown of incoming cartons, retail deliveries, and damaged batch logs.'
    },
    {
      id: 'rep-3',
      title: 'Wholesale Profit Margin & Tax Reconciliation',
      period: 'Q3 2026 (Jul - Sep)',
      size: 'PDF (1.2 MB)',
      desc: 'Formal financial statement of 32% wholesale distribution margins earned.'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="pb-2 border-b border-[#E5E7EB]">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
          Accounting &amp; Auditing
        </span>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10]">
          Exportable Operational Reports
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
          Download CSV and Excel statements of your stock turnover, courier fulfilment SLAs, and tax margins.
        </p>
      </div>

      <div className="space-y-4">
        {reports.map((rep) => (
          <div
            key={rep.id}
            className="p-5 rounded-3xl bg-white border border-[#E5E7EB] hover:border-[#D4AF37] transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] text-[#997A2E] flex items-center justify-center shrink-0">
                <FileText size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="font-heading font-bold text-sm sm:text-base text-[#0F0F10]">
                  {rep.title}
                </h3>
                <p className="text-xs text-[#6B7280]">{rep.desc}</p>
                <div className="flex items-center gap-3 text-[11px] font-mono text-[#9CA3AF]">
                  <span>{rep.period}</span>
                  <span>•</span>
                  <span>{rep.size}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => alert(`Exporting: ${rep.title}`)}
              className="px-5 py-2.5 rounded-full bg-[#FAF9F6] hover:bg-[#0F0F10] hover:text-white border border-[#E5E7EB] text-xs font-bold text-[#0F0F10] transition-colors flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto shrink-0"
            >
              <Download size={13} />
              <span>Download Report</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
