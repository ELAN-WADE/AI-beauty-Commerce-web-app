import React, { useState } from 'react';
import { Wallet, ArrowDownToLine, Building, CheckCircle2 } from 'lucide-react';
import { StatChip } from '../shared/StatChip';
import { StatusBadge } from '../shared/StatusBadge';
import { ConfirmDialog } from '../shared/ConfirmDialog';

export const DistributorEarnings: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const transactions = [
    {
      id: 'st-1',
      date: 'Today, 1:40 PM',
      orderNumber: 'ORD-LAG-7821',
      client: 'Khadija Sanusi',
      grossOrder: '₦48,000',
      margin: '₦15,360 (32%)',
      status: 'pending' as const,
      note: 'Awaiting customer delivery verification'
    },
    {
      id: 'st-2',
      date: 'Yesterday, 4:10 PM',
      orderNumber: 'ORD-LAG-7819',
      client: 'Emeka Nwosu',
      grossOrder: '₦39,500',
      margin: '₦12,640 (32%)',
      status: 'cleared' as const,
      note: 'Available in settlement balance'
    },
    {
      id: 'st-3',
      date: '01 Oct 2026',
      orderNumber: 'SETTLE-HUB-204',
      client: 'Weekly Settlement Payout to Zenith Bank',
      grossOrder: '—',
      margin: '-₦450,000',
      status: 'paid' as const,
      note: 'NIP transfer reference #NIP-9902'
    }
  ];

  const handleConfirmPayout = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setModalOpen(false);
      alert('Settlement of ₦320,450 initiated to Zenith Bank Account (1012345678)! Funds will reflect within 4 hours.');
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
            Wholesale Margin &amp; Settlements
          </span>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10]">
            Distributor Earnings
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
            Segregated accounting: customer storefront revenue vs your 32% wholesale distribution profit.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-6 py-2.5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-[#D4AF37] text-xs font-bold shadow-md active:scale-[0.97] transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <ArrowDownToLine size={14} />
          <span>Request Settlement (₦320,450)</span>
        </button>
      </div>

      {/* Financial Split Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatChip
          label="Available Settlement Balance"
          value="₦320,450"
          subtext="Cleared wholesale profit ready to withdraw"
          badge="Cleared"
          badgeVariant="success"
        />
        <StatChip
          label="Pending Customer Clearance"
          value="₦64,000"
          subtext="Held until courier handoff confirmation"
          badge="Pending"
          badgeVariant="warning"
        />
        <StatChip
          label="Lifetime Distributor Profit"
          value="₦1,240,000"
          subtext="Cumulative wholesale margin"
          badge="Total"
          badgeVariant="gold"
        />
      </div>

      {/* Settlement Bank Card */}
      <div className="p-5 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#FBF5E8] border border-[#D4AF37]/30 text-[#997A2E] flex items-center justify-center shrink-0">
            <Building size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs sm:text-sm text-[#0F0F10]">
                Zenith Bank Plc • 1012345678
              </h3>
              <span className="text-[10px] font-mono font-bold text-[#0F0F10] bg-[#FAF9F6] px-2.5 py-0.5 rounded-full border border-[#E5E7EB]">
                Verified Hub Account ✓
              </span>
            </div>
            <p className="text-[11px] text-[#6B7280] font-mono mt-0.5">
              Account Name: DESLA LAGOS CENTRAL OPERATIONS • Instant NIP Settlement
            </p>
          </div>
        </div>

        <button
          onClick={() => alert('Update bank details in Settings tab')}
          className="px-4 py-1.5 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-semibold text-[#0F0F10] cursor-pointer"
        >
          Manage Account
        </button>
      </div>

      {/* Settlement Ledger Table */}
      <section className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
        <h2 className="font-heading font-bold text-lg text-[#0F0F10]">
          Wholesale Margin Ledger
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[#9CA3AF] font-mono uppercase text-[10px]">
                <th className="pb-3 font-semibold">Date &amp; ID</th>
                <th className="pb-3 font-semibold">Order / Settlement Details</th>
                <th className="pb-3 font-semibold text-right">Gross Order</th>
                <th className="pb-3 font-semibold text-right">Hub Margin (32%)</th>
                <th className="pb-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]/70">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-[#FAF9F6]/80 transition-colors">
                  <td className="py-4">
                    <span className="font-bold text-[#0F0F10] block">{tx.orderNumber}</span>
                    <span className="text-[11px] text-[#9CA3AF] font-mono">{tx.date}</span>
                  </td>
                  <td className="py-4">
                    <span className="font-medium text-[#0F0F10] block">{tx.client}</span>
                    <span className="text-[11px] text-[#6B7280]">{tx.note}</span>
                  </td>
                  <td className="py-4 text-right font-mono text-[#6B7280]">{tx.grossOrder}</td>
                  <td className="py-4 text-right">
                    <span className="font-mono font-extrabold text-[#0F0F10]">
                      {tx.margin}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <StatusBadge status={tx.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDialog
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmPayout}
        title="Confirm Wholesale Settlement Transfer"
        description="Transfer ₦320,450 to Zenith Bank (1012345678 - DESLA LAGOS CENTRAL OPERATIONS)? Transfers are settled automatically via NIP."
        confirmLabel="Confirm & Transfer ₦320,450"
        cancelLabel="Review Later"
        isProcessing={isProcessing}
      />
    </div>
  );
};
