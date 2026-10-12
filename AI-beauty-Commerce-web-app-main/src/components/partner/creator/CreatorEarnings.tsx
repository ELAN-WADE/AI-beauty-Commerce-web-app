import React, { useState } from 'react';
import {
  Building,
  CheckCircle2
} from 'lucide-react';
import { StatChip } from '../shared/StatChip';
import { StatusBadge } from '../shared/StatusBadge';

export const CreatorEarnings: React.FC = () => {
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

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Subtitle banner */}
      <div className="pb-1">
        <p className="text-xs sm:text-sm text-[#6B7280]">
          Transparent commission ledger, cleared balances, and direct Nigerian NUBAN payouts.
        </p>
      </div>

      {/* 3 Metric Cards with Clean Upper-Right Stamps */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatChip
          label="AVAILABLE WITHDRAWABLE BALANCE"
          value="₦84,620"
          subtext="Ready for instant bank transfer"
          badge="CLEARED"
        />
        <StatChip
          label="PENDING CLEARANCE"
          value="₦21,300"
          subtext="Held in 7-day client satisfaction window"
          badge="PENDING"
        />
        <StatChip
          label="LIFETIME PAYOUTS RECEIVED"
          value="₦320,450"
          subtext="Transferred to verified NUBAN"
          badge="PAID OUT"
        />
      </div>

      {/* Verified Bank Account Card */}
      <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-[#E5E7EB] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#FBF5E8] border border-[#D4AF37]/30 text-[#997A2E] flex items-center justify-center shrink-0">
            <Building size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-[#0F0F10]">
                Guaranty Trust Bank (GTBank) • 0123456789
              </h3>
              <span className="text-[11px] font-mono font-bold text-[#0F0F10] flex items-center gap-1">
                Verified <CheckCircle2 size={12} className="inline text-[#0F0F10]" />
              </span>
            </div>
            <p className="text-xs text-[#6B7280] font-mono mt-0.5">
              Account Name: AMARA NNADI • BVN Linked &amp; NIP Real-Time Settlement
            </p>
          </div>
        </div>

        <button
          onClick={() => alert('Bank account management')}
          className="px-5 py-2 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-semibold text-[#0F0F10] transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-2xs"
        >
          Change Account
        </button>
      </div>

      {/* Commission Transaction Ledger Table */}
      <div className="rounded-2xl sm:rounded-3xl bg-white border border-[#E5E7EB] shadow-2xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#E5E7EB] flex items-center justify-between">
          <div>
            <h2 className="font-heading font-extrabold text-lg sm:text-xl text-[#0F0F10] tracking-tight">
              Commission Transaction Ledger
            </h2>
          </div>
          <span className="text-xs text-[#9CA3AF] font-mono">
            Real-time ledger entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[10px] font-mono font-bold uppercase text-[#9CA3AF] tracking-wider">
                <th className="py-3.5 px-6">Date &amp; Order</th>
                <th className="py-3.5 px-6">Client / Description</th>
                <th className="py-3.5 px-6">Order Value</th>
                <th className="py-3.5 px-6">Rate</th>
                <th className="py-3.5 px-6">Net Commission</th>
                <th className="py-3.5 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-[#FAF9F6]/80 transition-colors">
                  <td className="py-4 px-6 font-mono">
                    <span className="font-bold text-[#0F0F10] block">{tx.orderNumber}</span>
                    <span className="text-[11px] text-[#9CA3AF]">{tx.date}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-bold text-[#0F0F10] block">{tx.client}</span>
                    <span className="text-[11px] text-[#6B7280]">{tx.note}</span>
                  </td>
                  <td className="py-4 px-6 font-mono font-bold text-[#0F0F10]">
                    {tx.grossOrder}
                  </td>
                  <td className="py-4 px-6 font-mono text-[#6B7280]">
                    {tx.commissionRate}
                  </td>
                  <td className="py-4 px-6 font-mono font-bold text-[#0F0F10]">
                    <span>{tx.netPayout}</span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <StatusBadge status={tx.status} variant="minimal" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
