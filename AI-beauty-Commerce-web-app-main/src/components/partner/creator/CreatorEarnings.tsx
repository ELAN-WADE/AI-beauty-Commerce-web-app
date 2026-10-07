import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownToLine,
  TrendingUp,
  Clock,
  CheckCircle2,
  Building,
  AlertCircle
} from 'lucide-react';
import { StatChip } from '../shared/StatChip';
import { StatusBadge } from '../shared/StatusBadge';
import { ConfirmDialog } from '../shared/ConfirmDialog';

export const CreatorEarnings: React.FC = () => {
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const transactions = [
    {
      id: 'tx-1',
      date: 'Today, 2:15 PM',
      orderNumber: 'ORD-LAG-7821',
      client: 'Khadija Sanusi',
      grossOrder: '₦48,000',
      commissionRate: '12%',
      netPayout: '₦5,760',
      status: 'pending' as const,
      note: 'Validating 7-day client delivery'
    },
    {
      id: 'tx-2',
      date: 'Yesterday, 11:30 AM',
      orderNumber: 'ORD-LAG-7819',
      client: 'Emeka Nwosu',
      grossOrder: '₦39,500',
      commissionRate: '15% (VIP)',
      netPayout: '₦5,925',
      status: 'cleared' as const,
      note: 'Available in balance'
    },
    {
      id: 'tx-3',
      date: '28 Sep 2026',
      orderNumber: 'ORD-ABJ-6912',
      client: 'Fatima Aliyu',
      grossOrder: '₦84,000',
      commissionRate: '12%',
      netPayout: '₦10,080',
      status: 'cleared' as const,
      note: 'Available in balance'
    },
    {
      id: 'tx-4',
      date: '24 Sep 2026',
      orderNumber: 'PAYOUT-NGN-401',
      client: 'Settlement to GTBank (***6789)',
      grossOrder: '—',
      commissionRate: '—',
      netPayout: '-₦150,000',
      status: 'paid' as const,
      note: 'Bank transfer completed'
    }
  ];

  const handleConfirmPayout = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPayoutModalOpen(false);
      alert('Payout request for ₦84,620 submitted! Funds will reflect in your GTBank account within 24 hours.');
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
            Financial Settlement &amp; Ledger
          </span>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10]">
            Creator Earnings
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
            Transparent commission ledger, cleared balances, and direct Nigerian NUBAN payouts.
          </p>
        </div>

        <button
          onClick={() => setPayoutModalOpen(true)}
          className="px-6 py-2.5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-[#D4AF37] text-xs font-bold shadow-md active:scale-[0.97] transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <ArrowDownToLine size={14} />
          <span>Request Payout (₦84,620)</span>
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatChip
          label="Available Withdrawable Balance"
          value="₦84,620"
          subtext="Ready for instant bank transfer"
          badge="Cleared"
          badgeVariant="success"
        />
        <StatChip
          label="Pending Clearance"
          value="₦21,300"
          subtext="Held in 7-day client satisfaction window"
          badge="Pending"
          badgeVariant="warning"
        />
        <StatChip
          label="Lifetime Payouts Received"
          value="₦320,450"
          subtext="Transferred to verified NUBAN"
          badge="Paid Out"
          badgeVariant="gold"
        />
      </div>

      {/* Verified Bank Dossier */}
      <div className="p-5 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#FBF5E8] border border-[#D4AF37]/30 text-[#997A2E] flex items-center justify-center shrink-0">
            <Building size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs sm:text-sm text-[#0F0F10]">
                Guaranty Trust Bank (GTBank) • 0123456789
              </h3>
              <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Verified ✓
              </span>
            </div>
            <p className="text-[11px] text-[#6B7280] font-mono mt-0.5">
              Account Name: AMARA NNADI • BVN Linked &amp; NIP Real-Time Settlement
            </p>
          </div>
        </div>

        <button
          onClick={() => alert('Bank settings can be updated in Settings tab')}
          className="px-4 py-1.5 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-semibold text-[#0F0F10] cursor-pointer"
        >
          Change Account
        </button>
      </div>

      {/* Transaction Ledger Table */}
      <section className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-lg text-[#0F0F10]">
            Commission Transaction Ledger
          </h2>
          <span className="text-xs text-[#9CA3AF] font-mono">Real-time ledger entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[#9CA3AF] font-mono uppercase text-[10px]">
                <th className="pb-3 font-semibold">Date &amp; Order</th>
                <th className="pb-3 font-semibold">Client / Description</th>
                <th className="pb-3 font-semibold text-right">Order Value</th>
                <th className="pb-3 font-semibold text-right">Rate</th>
                <th className="pb-3 font-semibold text-right">Net Commission</th>
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
                  <td className="py-4 text-right font-mono font-bold text-[#0F0F10]">
                    {tx.commissionRate}
                  </td>
                  <td className="py-4 text-right">
                    <span
                      className={`font-mono font-extrabold ${
                        tx.netPayout.startsWith('-') ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {tx.netPayout}
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

      {/* Payout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={payoutModalOpen}
        onClose={() => setPayoutModalOpen(false)}
        onConfirm={handleConfirmPayout}
        title="Confirm Bank Settlement Transfer"
        description="Withdraw ₦84,620 directly to your verified GTBank account (0123456789 - AMARA NNADI)? Transfers are dispatched via NIP instant clearing."
        confirmLabel="Confirm & Transfer ₦84,620"
        cancelLabel="Review Later"
        isProcessing={isProcessing}
      />
    </div>
  );
};
