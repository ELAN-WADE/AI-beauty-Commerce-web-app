import React, { useState, useMemo, useEffect } from 'react';
import { Wallet, ArrowDownToLine, Building, CheckCircle2, X } from '../../common/SolidIcons';
import { StatChip } from '../shared/StatChip';
import { StatusBadge } from '../shared/StatusBadge';
import { useApp } from '../../../context/AppContext';
import { fetchPartnerDashboard, partnerWithdraw } from '../../../lib/owned-api';

export const DistributorEarnings: React.FC = () => {
  const { distributorLedger } = useApp();
  const [liveData, setLiveData] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [payoutForm, setPayoutForm] = useState({
    amount: 0,
    bank: '',
    nuban: '',
    accountName: ''
  });
  const refreshWallet = async () => { const data = await fetchPartnerDashboard('DISTRIBUTOR'); setLiveData(data); return data; };
  useEffect(() => { void refreshWallet().catch(() => setLiveData(null)); }, []);
  const verifiedBanks = liveData?.wallet?.banks?.filter((bank: any) => !!bank.verifiedAt) ?? [];
  const selectedBank = verifiedBanks.find((bank: any) => bank.id === payoutForm.bank);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Calculate live balances
  const balances = useMemo(() => {
    const withdrawals = liveData?.wallet?.withdrawals ?? [];
    return {
      available: (liveData?.wallet?.availableKobo ?? 0) / 100,
      pending: (liveData?.wallet?.pendingKobo ?? 0) / 100,
      lifetimeWithdrawn: withdrawals.filter((row: any) => row.status === 'PAID').reduce((sum: number, row: any) => sum + row.amountKobo / 100, 0),
    };
  }, [liveData, distributorLedger]);

  const handleConfirmPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      if (!selectedBank) throw new Error('A verified payout account is required.');
      await partnerWithdraw('DISTRIBUTOR', { bankAccountId: selectedBank.id, amountKobo: Math.round(Number(payoutForm.amount) * 100) });
      await refreshWallet(); setModalOpen(false);
      showToast(`Settlement request for ₦${Number(payoutForm.amount).toLocaleString('en-NG')} submitted.`);
    } catch (error) { showToast(error instanceof Error ? error.message : 'Settlement request failed.'); }
    finally { setIsProcessing(false); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast message */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-[#0F0F10] text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-semibold flex items-center justify-between shadow-xl animate-in slide-in-from-top-2">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#D4AF37]" /> {toastMessage}
          </span>
          <button onClick={() => setToastMessage(null)} className="text-white hover:text-white/80 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

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
            Segregated accounting: customer storefront revenue vs your recorded wholesale ledger.
          </p>
        </div>

        <button
          onClick={() => {
            setPayoutForm((prev) => ({ ...prev, amount: Math.min(balances.available, 200000) }));
            setModalOpen(true);
          }}
          className="px-6 py-2.5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-[#D4AF37] text-xs font-bold shadow-md active:scale-[0.97] transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <ArrowDownToLine size={14} />
          <span>Request Settlement (₦{balances.available.toLocaleString('en-NG')})</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatChip
          label="AVAILABLE SETTLEMENT BALANCE"
          value={`₦${balances.available.toLocaleString('en-NG')}`}
          subtext="Ready for instant NIP disbursement"
          badge="CLEARED"
        />
        <StatChip
          label="PENDING DELIVERY VERIFICATION"
          value={`₦${balances.pending.toLocaleString('en-NG')}`}
          subtext="Held pending OTP customer handover"
          badge="PENDING"
        />
        <StatChip
          label="LIFETIME WHOLESALE MARGIN"
          value={`₦${balances.lifetimeWithdrawn.toLocaleString('en-NG')}`}
          subtext="Total partner profits paid to date"
          badge="PROCESSED"
        />
      </div>

      {/* Verified Bank Account Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#FBF5E8] border border-[#D4AF37]/30 text-[#997A2E] flex items-center justify-center shrink-0">
            <Building size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-[#0F0F10]">
                {selectedBank ? `${selectedBank.bankName} • ${selectedBank.maskedNumber}` : 'No verified bank account selected'}
              </h3>
              <span className="text-[11px] font-mono font-bold text-emerald-700 flex items-center gap-1">
                Verified <CheckCircle2 size={12} className="inline text-emerald-600" />
              </span>
            </div>
            <p className="text-xs text-[#6B7280] font-mono mt-0.5">
              Account Name: {selectedBank?.accountName ?? '—'} • Verified payout destination
            </p>
          </div>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-5 py-2 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-semibold text-[#0F0F10] transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-2xs"
        >
          Withdraw Funds
        </button>
      </div>

      {/* Margin Transaction Ledger Table */}
      <div className="rounded-3xl bg-white border border-[#E5E7EB] shadow-2xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#E5E7EB] flex items-center justify-between">
          <div>
            <h2 className="font-heading font-extrabold text-lg sm:text-xl text-[#0F0F10] tracking-tight">
              Wholesale Margin Ledger
            </h2>
          </div>
          <span className="text-xs text-[#9CA3AF] font-mono">
            {distributorLedger.length} Ledger Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[10px] font-mono font-bold uppercase text-[#9CA3AF] tracking-wider bg-[#FAF9F6]">
                <th className="py-3 px-6">Date &amp; Reference</th>
                <th className="py-3 px-6">Description / Activity</th>
                <th className="py-3 px-6">Type</th>
                <th className="py-3 px-6 text-right">Net Amount</th>
                <th className="py-3 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {distributorLedger.map((tx) => (
                <tr key={tx.id} className="hover:bg-[#FAF9F6]/80 transition-colors">
                  <td className="py-4 px-6 font-mono">
                    <span className="font-bold text-[#0F0F10] block">{tx.reference}</span>
                    <span className="text-[11px] text-[#9CA3AF]">{tx.date}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-bold text-[#0F0F10] block">{tx.description}</span>
                    <span className="text-[11px] text-[#6B7280]">{tx.note}</span>
                  </td>
                  <td className="py-4 px-6 font-mono text-[#6B7280]">
                    <span className="px-2 py-0.5 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] text-[10px]">
                      {tx.type}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-mono font-bold text-right">
                    <span className={tx.amountNgn < 0 ? 'text-[#0F0F10]' : 'text-emerald-600'}>
                      {tx.amountNgn < 0 ? `-₦${Math.abs(tx.amountNgn).toLocaleString('en-NG')}` : `+₦${tx.amountNgn.toLocaleString('en-NG')}`}
                    </span>
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

      {/* Payout Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F0F10]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#EAE8E3] overflow-hidden">
            <div className="p-5 border-b border-[#EAE8E3] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
                  Direct NIP Settlement
                </span>
                <h3 className="font-heading font-extrabold text-lg text-[#0F0F10]">
                  Withdraw Wholesale Margin
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#FAF9F6] text-[#71717A] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmPayout} className="p-5 space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#FBF5E8] border border-[#D4AF37]/30 space-y-1">
                <span className="text-[#6B7280]">Available for Withdrawal:</span>
                <p className="font-mono text-lg font-bold text-[#0F0F10]">
                  ₦{balances.available.toLocaleString('en-NG')}
                </p>
              </div>

              <div>
                <label className="block font-bold text-[#0F0F10] mb-1">Withdrawal Amount (₦)</label>
                <input
                  type="number"
                  min="5000"
                  max={balances.available}
                  value={payoutForm.amount}
                  onChange={(e) => setPayoutForm({ ...payoutForm, amount: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] text-xs font-mono font-bold focus:outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#0F0F10] mb-1">Bank Destination</label>
                <select
                  value={payoutForm.bank}
                  onChange={(e) => setPayoutForm({ ...payoutForm, bank: e.target.value })}
                  className="w-full p-2.5 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] text-xs font-bold focus:outline-none"
                >
                  {verifiedBanks.length === 0 && <option value="">No verified payout account</option>}
                  {verifiedBanks.map((bank: any) => <option key={bank.id} value={bank.id}>{bank.bankName} • {bank.maskedNumber}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#0F0F10] mb-1">10-Digit NUBAN Account</label>
                <input
                  type="text"
                  maxLength={10}
                  value={selectedBank?.maskedNumber ?? ''}
                  readOnly
                  className="w-full p-2.5 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] text-xs font-mono font-bold focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#0F0F10] mb-1">Account Holder Name</label>
                <input
                  type="text"
                  value={selectedBank?.accountName ?? ''}
                  readOnly
                  className="w-full p-2.5 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] text-xs font-bold focus:outline-none"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#EAE8E3]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#EAE8E3] text-xs font-semibold text-[#71717A] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-6 py-2.5 rounded-full bg-[#0F0F10] text-[#D4AF37] font-bold text-xs shadow-md cursor-pointer hover:bg-[#27272A] disabled:opacity-50"
                >
                  {isProcessing ? 'Processing NIP Transfer...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
