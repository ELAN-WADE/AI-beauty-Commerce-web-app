import React, { useEffect, useState } from 'react';
import { fetchNetworkOverview, networkCommand, isOwnedApiConfigured } from '../../lib/owned-api';
import { NetworkSettings } from './NetworkSettings';

export interface Overview {
  locations: { id: string; code: string; name: string; type: 'WAREHOUSE' | 'DISTRIBUTOR' | 'RETAIL_STORE'; address: string; phone: string; operatingHours: string; etaText: string; city: string; state: string; isActive: boolean; distributorId: string | null; deliveryEnabled: boolean; pickupEnabled: boolean; deliveryFeeKobo: number | null }[];
  stock: { pool: 'PLATFORM' | 'WHOLESALE'; locationId: string; variantId: string; sku: string; name: string; onHand: number; reserved: number }[];
  partners: { id: string; name: string; city: string; userId: string | null; tier: string; commissionBps: number; verified: boolean }[];
  creators: { id: string; name: string; promoCode: string; userId: string | null; commissionRate: number; verified: boolean }[];
  users: { id: string; email: string }[];
  variants: { id: string; sku: string; size: string; name: string }[];
  transfers: { id: string; sourceLocationId: string; destinationLocationId: string; status: string }[];
  restocks: { id: string; locationId: string; variantId: string; qty: number; status: string }[];
  banks: { id: string; walletId: string; bankName: string; accountName: string; verifiedAt: string | null }[];
  withdrawals: { id: string; walletId: string; amountKobo: number; status: string }[];
  finance: boolean;
  wholesalePrices: { variantId: string; tier: string; unitPriceKobo: number; unitsPerCarton: number; minimumCartons: number; isActive: boolean }[];
  wholesaleOrders: { id: string; orderNumber: string; status: string; paymentStatus: string; totalKobo: number; destinationId: string; dispatchedAt: string | null; receivedAt: string | null; returnedAt: string | null }[];
}

const naira = (kobo: number) => '₦' + Math.round(kobo / 100).toLocaleString('en-NG');

export const NetworkPanel: React.FC = () => {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [transferForm, setTransferForm] = useState({ source: '', dest: '', variant: '', qty: '' });
  const [payoutEvidence, setPayoutEvidence] = useState<Record<string, string>>({});
  const [payoutRef, setPayoutRef] = useState<Record<string, string>>({});
  const [bankEvidence, setBankEvidence] = useState<Record<string, string>>({});

  const refresh = async () => {
    setError('');
    try {
      const res = (await fetchNetworkOverview()) as Overview | null;
      if (!res) {
        setData(null);
        setError('Network management needs a staff account with the network permission.');
        return;
      }
      setData(res);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : 'Could not load the network.');
    }
  };

  useEffect(() => {
    if (!isOwnedApiConfigured) {
      setError('Connect the live backend to manage the network.');
      return;
    }
    void refresh();
  }, []);

  const run = async (input: Record<string, unknown>, ok: string) => {
    setBusy(true);
    setNotice('');
    setError('');
    try {
      await networkCommand(input);
      setNotice(ok);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setBusy(false);
    }
  };

  if (error && !data) return <p className="text-xs text-[#6B7280]">{error}</p>;
  if (!data) return <p className="text-xs text-[#6B7280]">Loading network…</p>;

  return (
    <div className="space-y-5">
      {(notice || error) && <p className={`text-[11px] ${error ? 'text-rose-600' : 'text-emerald-700'}`}>{error || notice}</p>}
      <NetworkSettings data={data} refresh={refresh} />

      <div className="space-y-2">
        <h4 className="text-xs font-bold text-[#0F0F10]">Inventory locations ({data.locations.length})</h4>
        {data.locations.map((l) => {
          const units = data.stock.filter((s) => s.locationId === l.id && s.pool === 'PLATFORM').reduce((n, s) => n + Math.max(0, s.onHand - s.reserved), 0);
          const owned = data.stock.filter((s) => s.locationId === l.id && s.pool === 'WHOLESALE').reduce((n, s) => n + s.onHand, 0);
          return (
            <div key={l.id} className="p-3 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-between gap-2 text-xs">
              <div>
                <strong className="text-[#0F0F10] block">{l.name} ({l.code})</strong>
                <span className="text-[#6B7280]">{l.city}, {l.state} • {units} platform units available • {owned} distributor-owned units • {l.deliveryFeeKobo == null ? 'zone fee' : naira(l.deliveryFeeKobo)}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${l.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                {l.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          );
        })}
        <p className="text-[11px] text-[#6B7280]">Use Location settings above to configure delivery and pickup before activating a partner location.</p>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-bold text-[#0F0F10]">Dispatch stock transfer</h4>
        <div className="grid grid-cols-2 gap-2">
          <select value={transferForm.source} onChange={(e) => setTransferForm((f) => ({ ...f, source: e.target.value }))} className="px-3 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs">
            <option value="">Source…</option>
            {data.locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <select value={transferForm.dest} onChange={(e) => setTransferForm((f) => ({ ...f, dest: e.target.value }))} className="px-3 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs">
            <option value="">Destination…</option>
            {data.locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <select value={transferForm.variant} onChange={(e) => setTransferForm((f) => ({ ...f, variant: e.target.value }))} className="px-3 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs">
            <option value="">Variant…</option>
            {data.variants.slice(0, 200).map((v) => <option key={v.id} value={v.id}>{v.sku} — {v.name}</option>)}
          </select>
          <input value={transferForm.qty} onChange={(e) => setTransferForm((f) => ({ ...f, qty: e.target.value.replace(/\D/g, '') }))} placeholder="Qty" inputMode="numeric" className="px-3 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs" />
        </div>
        <button
          disabled={busy || !transferForm.source || !transferForm.dest || !transferForm.variant || !transferForm.qty}
          onClick={() => void run({ action: 'transfer', sourceLocationId: transferForm.source, destinationLocationId: transferForm.dest, items: [{ variantId: transferForm.variant, qty: Number(transferForm.qty) }] }, 'Transfer dispatched.')}
          className="px-4 py-2 rounded-full bg-[#0F0F10] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
        >
          Dispatch transfer
        </button>
        {data.transfers.slice(0, 5).map((t) => (
          <div key={t.id} className="flex items-center justify-between text-[11px] text-[#6B7280]">
            <span>{t.id.slice(0, 8)} • {t.status}</span>
            {t.status === 'DISPATCHED' && (
              <button disabled={busy} onClick={() => void run({ action: 'receive', transferId: t.id }, 'Transfer received.')} className="px-3 py-1 rounded-full border border-[#D4AF37] text-[#997A2E] font-bold cursor-pointer disabled:opacity-50">Receive</button>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-bold text-[#0F0F10]">Restock requests ({data.restocks.length})</h4>
        {data.restocks.slice(0, 8).map((r) => (
          <div key={r.id} className="flex items-center justify-between text-[11px] text-[#6B7280]">
            <span>{r.qty} units • {r.status}</span>
            <span className="flex gap-1.5">
              {r.status === 'REQUESTED' && <button disabled={busy} onClick={() => void run({ action: 'restock', id: r.id, status: 'APPROVED' }, 'Restock approved.')} className="px-3 py-1 rounded-full bg-[#0F0F10] text-white font-bold cursor-pointer disabled:opacity-50">Approve</button>}
              {r.status === 'APPROVED' && <button disabled={busy} onClick={() => void run({ action: 'restock', id: r.id, status: 'FULFILLED' }, 'Restock fulfilled — dispatch a transfer.')} className="px-3 py-1 rounded-full border border-[#E5E7EB] font-bold cursor-pointer disabled:opacity-50">Fulfilled</button>}
            </span>
          </div>
        ))}
      </div>

      {data.finance && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-[#0F0F10]">Payout reviews ({data.withdrawals.length})</h4>
          <p className="text-[11px] text-[#6B7280]">Approval never moves money. Mark PAID only after the bank transfer completes, with its reference and evidence.</p>
          {data.withdrawals.slice(0, 10).map((w) => (
            <div key={w.id} className="p-3 rounded-xl bg-white border border-[#E5E7EB] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <strong className="text-[#0F0F10]">{naira(w.amountKobo)}</strong>
                <span className="font-bold text-[#6B7280]">{w.status}</span>
              </div>
              <input value={payoutEvidence[w.id] ?? ''} onChange={(e) => setPayoutEvidence((p) => ({ ...p, [w.id]: e.target.value }))} placeholder="Reconciliation evidence" className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] text-xs" />
              <input value={payoutRef[w.id] ?? ''} onChange={(e) => setPayoutRef((p) => ({ ...p, [w.id]: e.target.value }))} placeholder="Bank transfer reference (PAID only)" className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] text-xs font-mono" />
              <div className="flex flex-wrap gap-1.5">
                {(['APPROVED', 'PROCESSING', 'PAID', 'REJECTED', 'FAILED'] as const).map((s) => (
                  <button
                    key={s}
                    disabled={busy}
                    onClick={() => void run({ action: 'payout', id: w.id, status: s, evidence: payoutEvidence[w.id] ?? '', ...(payoutRef[w.id] ? { paymentReference: payoutRef[w.id] } : {}) }, `Payout ${s.toLowerCase()}.`)}
                    className="px-3 py-1.5 rounded-full border border-[#E5E7EB] text-[11px] font-bold cursor-pointer disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {data.banks.filter((b) => !b.verifiedAt).length > 0 && (
            <div className="space-y-1.5">
              <h5 className="text-[11px] font-bold text-[#0F0F10]">Unverified bank accounts</h5>
              {data.banks.filter((b) => !b.verifiedAt).slice(0, 8).map((b) => (
                <div key={b.id} className="flex items-center justify-between text-[11px] text-[#6B7280]">
                  <span>{b.bankName} • {b.accountName}</span>
                  <input aria-label={`Verification evidence for ${b.accountName}`} value={bankEvidence[b.id] ?? ''} onChange={e => setBankEvidence(v => ({ ...v, [b.id]: e.target.value }))} placeholder="Ownership verification evidence" className="px-2 py-2 border rounded-lg min-w-0" /><button disabled={busy || (bankEvidence[b.id]?.trim().length ?? 0) < 6} onClick={() => void run({ action: 'verifyBank', bankAccountId: b.id, evidence: bankEvidence[b.id] }, 'Bank account verified.')} className="px-3 py-1 rounded-full bg-[#0F0F10] text-white font-bold cursor-pointer disabled:opacity-50">Verify</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
