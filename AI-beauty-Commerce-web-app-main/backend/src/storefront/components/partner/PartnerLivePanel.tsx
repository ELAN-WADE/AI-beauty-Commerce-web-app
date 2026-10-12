import React, { useEffect, useState } from 'react';
import {
  fetchPartnerDashboard,
  partnerOrderTransition,
  partnerBankRegister,
  partnerWithdraw,
  partnerRestock,
  partnerReceiveTransfer,
  isOwnedApiConfigured,
  recordWholesaleSale,
  newIdempotencyKey,
} from '../../lib/owned-api';
import { money, partnerButton, partnerInput } from './PartnerApplication';

interface Props {
  kind: 'DISTRIBUTOR' | 'CREATOR';
}

interface WalletView {
  id: string;
  pendingKobo: number;
  availableKobo: number;
  heldKobo: number;
  minimumPayoutKobo: number;
  holdDays: number;
  entries: { id: string; bucket: string; amountKobo: number; description: string; createdAt: string }[];
  banks: { id: string; bankCode: string; bankName: string; accountName: string; maskedNumber: string; verifiedAt: string | null }[];
  withdrawals: { id: string; amountKobo: number; status: string; createdAt: string }[];
}

interface Dashboard {
  profile: { id: string; name: string; promoCode?: string; discountPercent?: number; commissionRate?: number; commissionBps?: number };
  metrics?: { ordersCount: number; paidMerchandiseKobo: number; refundedKobo: number; commissionNetKobo: number; contentPendingKobo?: number; contentAvailableKobo?: number; contentPosts?: number };
  location?: { id: string; name: string; city: string } | null;
  wallet: WalletView;
  orders?: { id: string; orderNumber: string; status: string; totalKobo: number; fulfilmentMethod: string; shippingAddress: unknown; createdAt: string }[];
  inventory?: { pool: 'PLATFORM' | 'WHOLESALE'; variantId: string; sku: string; name: string; size: string; onHand: number; reserved: number }[];
  variants?: { id: string; sku: string; name: string; size: string }[];
  transfers?: { id: string; status: string; dispatchedAt: string }[];
  restocks?: { id: string; variantId: string; qty: number; status: string }[];
}

const naira = money;

export const PartnerLivePanel: React.FC<Props> = ({ kind }) => {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const [bankCode, setBankCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBankId, setWithdrawBankId] = useState('');
  const [restockVariant, setRestockVariant] = useState('');
  const [restockQty, setRestockQty] = useState('');
  const [pickupCodes, setPickupCodes] = useState<Record<string, string>>({});
  const [deliveryNotes, setDeliveryNotes] = useState<Record<string, string>>({});
  const [sale, setSale] = useState({ variantId: '', qty: '', note: '' });
  const [saleKey, setSaleKey] = useState(newIdempotencyKey);

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const res = (await fetchPartnerDashboard(kind)) as Dashboard | null;
      if (!res) {
        setData(null);
        setError(kind === 'DISTRIBUTOR' ? 'Sign in with an approved distributor account to see live operations.' : 'Sign in with an approved creator account to see live earnings.');
        return;
      }
      setData(res);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : 'Could not load live data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOwnedApiConfigured) {
      setLoading(false);
      setError('Live operations need the backend connection (VITE_API_URL).');
      return;
    }
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    setNotice('');
    setError('');
    try {
      await fn();
      setNotice(ok);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <section aria-label="Live operations" className="p-5 rounded-2xl bg-white border border-[#E5E7EB]"><p className="text-xs text-[#6B7280]">Loading live operations…</p></section>;
  if (error && !data) return <section aria-label="Live operations" className="p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-3"><p role="alert" className="text-sm text-[#6B7280]">{error}</p><button className={partnerButton} onClick={() => void refresh()}>Retry</button></section>;
  if (!data) return null;

  const wallet = data.wallet;

  return (
    <section aria-label="Live operations" className="p-5 rounded-2xl bg-white border border-[#D4AF37]/40 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div><h2 className="font-heading font-bold text-xl text-[#0F0F10]">{data.profile.name}</h2><p className="text-sm text-[#6B7280]">{data.location?.name ?? 'Creator account'}{kind === 'DISTRIBUTOR' ? ` · ${(data.profile.commissionBps ?? 0) / 100}% commission on platform orders` : ''}</p></div>
        <button onClick={() => void refresh()} disabled={busy} className="text-[11px] font-bold text-[#997A2E] hover:underline cursor-pointer disabled:opacity-50">Refresh</button>
      </div>
      {(notice || error) && <p className={`text-[11px] ${error ? 'text-rose-600' : 'text-emerald-700'}`}>{error || notice}</p>}
      {kind === 'CREATOR' && data.profile.promoCode && <div className="rounded-xl border border-[#E5E7EB] bg-[#FAF9F6] p-4 space-y-3">
        <h3 className="font-heading font-bold">Your referral link</h3><p className="text-sm">Give {data.profile.discountPercent}% off · Earn {data.profile.commissionRate}% commission on eligible merchandise.</p>
        <p className="font-mono text-lg font-bold">{data.profile.promoCode}</p>
        <input aria-label="Your referral link" readOnly value={`${window.location.origin}${window.location.pathname}?ref=${encodeURIComponent(data.profile.promoCode)}`} className={partnerInput} />
        <button disabled={busy} className={partnerButton} onClick={() => void run(() => navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?ref=${encodeURIComponent(data.profile.promoCode!)}`), 'Referral link copied.')}>Copy referral link</button>
        {data.metrics && <><dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t pt-4">{[['Paid orders', data.metrics.ordersCount], ['Paid merchandise', money(data.metrics.paidMerchandiseKobo)], ['Refunds', money(data.metrics.refundedKobo)], ['Net commission', money(data.metrics.commissionNetKobo)]].map(([label, value]) => <div key={label}><dt className="text-xs text-[#6B7280]">{label}</dt><dd className="font-mono font-bold mt-1 break-words">{value}</dd></div>)}</dl><p className="text-xs text-[#6B7280]">Paid orders include later refunds. Merchandise excludes shipping; refunds include all refunded charges. Net commission includes reversals and is separate from your withdrawable balance.</p><dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t pt-4">{[['Content rewards pending', money(data.metrics.contentPendingKobo ?? 0)], ['Content rewards cleared', money(data.metrics.contentAvailableKobo ?? 0)], ['Rewarded posts', String(data.metrics.contentPosts ?? 0)]].map(([label, value]) => <div key={label}><dt className="text-xs text-[#6B7280]">{label}</dt><dd className="font-mono font-bold mt-1 break-words">{value}</dd></div>)}</dl><p className="text-xs text-[#6B7280]">Content rewards settle weekly from verified orders placed with your code — likes alone never pay. Only admin-approved posts earn; rewards clear after the hold period, net of refunds.</p></>}
      </div>}

      <div className="grid grid-cols-3 gap-2 text-center">
        {([['Pending', wallet.pendingKobo], ['Available', wallet.availableKobo], ['Held', wallet.heldKobo]] as const).map(([label, kobo]) => (
          <div key={label} className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB]">
            <span className="text-[10px] uppercase tracking-wider text-[#6B7280] block">{label}</span>
            <strong className="font-mono text-sm text-[#0F0F10]">{naira(kobo)}</strong>
          </div>
        ))}
      </div>
      <p className="text-xs text-[#6B7280]">New earnings clear {wallet.holdDays} days after delivery or collection. Each order retains its agreed hold period. Minimum payout {naira(wallet.minimumPayoutKobo)} to a verified bank account.</p>

      {kind === 'DISTRIBUTOR' && (
        <>
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#0F0F10]">Assigned orders ({data.orders?.length ?? 0})</h4>
            {(data.orders ?? []).length === 0 && <p className="text-[11px] text-[#6B7280]">No orders assigned to {data.location?.name ?? 'your location'} yet.</p>}
            {(data.orders ?? []).slice(0, 10).map((o) => (
              <div key={o.id} className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <strong className="font-mono text-[#0F0F10]">#{o.orderNumber}</strong>
                  <span className="text-[11px] text-[#6B7280]">{o.status} • {o.fulfilmentMethod === 'PICKUP' ? 'Pickup' : 'Delivery'} • {naira(o.totalKobo)}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {o.status === 'PAID' && (
                    <button disabled={busy} onClick={() => void run(() => partnerOrderTransition({ orderId: o.id, transition: 'ACCEPT' }), 'Order accepted.')} className="px-3 py-1.5 rounded-full bg-[#0F0F10] text-white text-[11px] font-bold cursor-pointer disabled:opacity-50">Accept &amp; pack</button>
                  )}
                  {o.status === 'FULFILLING' && o.fulfilmentMethod === 'DELIVERY' && (
                    <button disabled={busy} onClick={() => void run(() => partnerOrderTransition({ orderId: o.id, transition: 'DISPATCH' }), 'Marked dispatched.')} className="px-3 py-1.5 rounded-full bg-[#0F0F10] text-white text-[11px] font-bold cursor-pointer disabled:opacity-50">Mark dispatched</button>
                  )}
                  {o.status === 'FULFILLING' && o.fulfilmentMethod === 'PICKUP' && (
                    <button disabled={busy} onClick={() => void run(() => partnerOrderTransition({ orderId: o.id, transition: 'READY_PICKUP' }), 'Marked ready for pickup.')} className="px-3 py-1.5 rounded-full bg-[#0F0F10] text-white text-[11px] font-bold cursor-pointer disabled:opacity-50">Ready for pickup</button>
                  )}
                  {o.status === 'READY_PICKUP' && (
                    <span className="flex items-center gap-1.5">
                      <input value={pickupCodes[o.id] ?? ''} onChange={(e) => setPickupCodes((p) => ({ ...p, [o.id]: e.target.value.replace(/\D/g, '').slice(0, 6) }))} placeholder="6-digit code" inputMode="numeric" className="w-28 px-2.5 py-1.5 rounded-lg bg-white border border-[#E5E7EB] text-xs font-mono" />
                      <button disabled={busy} onClick={() => void run(() => partnerOrderTransition({ orderId: o.id, transition: 'CONFIRM_PICKUP', code: pickupCodes[o.id] }), 'Pickup confirmed.')} className="px-3 py-1.5 rounded-full bg-[#0F0F10] text-white text-[11px] font-bold cursor-pointer disabled:opacity-50">Verify &amp; release</button>
                    </span>
                  )}
                  {o.status === 'SHIPPED' && (
                    <div className="flex flex-wrap gap-2"><input aria-label={`Delivery evidence for ${o.orderNumber}`} value={deliveryNotes[o.id] ?? ''} onChange={e => setDeliveryNotes(n => ({ ...n, [o.id]: e.target.value }))} placeholder="Recipient / delivery evidence" className={partnerInput} /><button disabled={busy || (deliveryNotes[o.id]?.trim().length ?? 0) < 6} onClick={() => void run(() => partnerOrderTransition({ orderId: o.id, transition: 'COMPLETE_DELIVERY', note: deliveryNotes[o.id] }), 'Delivery completed.')} className={partnerButton}>Complete delivery</button></div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-[#0F0F10]">Stock at your location</h4>
            <p className="text-xs text-[#6B7280]">Platform allocation fulfils customer orders. Wholesale stock belongs to your business for direct resale.</p>
            {(data.inventory ?? []).length === 0 && <p className="text-[11px] text-[#6B7280]">No stock rows yet. Request a restock below.</p>}
            {(data.inventory ?? []).map((row) => (
              <div key={`${row.pool}-${row.variantId}`} className="flex flex-wrap gap-2 items-center justify-between text-xs py-2 border-b border-[#F3F4F6] last:border-0">
                <span className="text-[#0F0F10]">{row.name} ({row.size}) <strong className="block text-[#997A2E]">{row.pool === 'WHOLESALE' ? 'Wholesale · owned by you' : 'Platform allocation'}</strong></span>
                <span className="font-mono text-[#6B7280]">{row.onHand - row.reserved} avail / {row.onHand} on hand</span>
              </div>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!restockVariant || !restockQty) return;
                void run(() => partnerRestock({ variantId: restockVariant, qty: Number(restockQty) }), 'Restock requested.');
              }}
              className="flex flex-wrap gap-2"
            >
              <select aria-label="Product to request for platform allocation" value={restockVariant} onChange={e => setRestockVariant(e.target.value)} className={`${partnerInput} sm:flex-1`}><option value="">Request platform stock…</option>{data.variants?.map(v => <option key={v.id} value={v.id}>{v.name} · {v.size} · {v.sku}</option>)}</select>
              <input value={restockQty} onChange={(e) => setRestockQty(e.target.value.replace(/\D/g, ''))} placeholder="Qty" inputMode="numeric" className="w-20 px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] text-xs" />
              <button type="submit" disabled={busy || !restockVariant || Number(restockQty) < 1} className={partnerButton}>Request platform stock</button>
            </form>
            {(data.restocks ?? []).map(r => <p key={r.id} className="text-xs text-[#6B7280]">{data.variants?.find(v => v.id === r.variantId)?.sku ?? r.variantId} · {r.qty} units · {r.status}</p>)}
            <form className="rounded-xl bg-[#FAF9F6] p-4 space-y-3" onSubmit={e => { e.preventDefault(); void run(async () => { await recordWholesaleSale({ variantId: sale.variantId, qty: Number(sale.qty), note: sale.note }, saleKey); setSale({ variantId: '', qty: '', note: '' }); setSaleKey(newIdempotencyKey()); }, 'Direct sale recorded against your wholesale stock.'); }}>
              <h4 className="text-sm font-bold">Record a direct wholesale-stock sale</h4><p className="text-xs text-[#6B7280]">Updates units sold from your own stock. Direct sales do not create platform commission.</p>
              <select required aria-label="Wholesale stock sold" value={sale.variantId} onChange={e => { setSale(s => ({ ...s, variantId: e.target.value })); setSaleKey(newIdempotencyKey()); }} className={partnerInput}><option value="">Choose stock…</option>{data.inventory?.filter(r => r.pool === 'WHOLESALE' && r.onHand > 0).map(r => <option key={r.variantId} value={r.variantId}>{r.name} · {r.size}</option>)}</select>
              <div className="grid sm:grid-cols-2 gap-2"><input required type="number" min="1" max="10000" aria-label="Units sold" placeholder="Units sold" className={partnerInput} value={sale.qty} onChange={e => { setSale(s => ({ ...s, qty: e.target.value })); setSaleKey(newIdempotencyKey()); }} /><input required minLength={3} maxLength={200} aria-label="Direct sale reference" placeholder="Receipt / sale reference" className={partnerInput} value={sale.note} onChange={e => { setSale(s => ({ ...s, note: e.target.value })); setSaleKey(newIdempotencyKey()); }} /></div>
              <button disabled={busy} className={partnerButton}>Record direct sale</button>
            </form>
            {(data.transfers ?? []).length > 0 && (
              <div className="space-y-1.5">
                {(data.transfers ?? []).slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-[11px] text-[#6B7280]">
                    <span>Transfer {t.id.slice(0, 8)} • {t.status}</span>
                    {t.status === 'DISPATCHED' && (
                      <button disabled={busy} onClick={() => void run(() => partnerReceiveTransfer(t.id), 'Transfer received.')} className="px-3 py-1 rounded-full border border-[#D4AF37] text-[#997A2E] font-bold cursor-pointer disabled:opacity-50">Confirm receipt</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <div className="space-y-2">
        <h4 className="text-xs font-bold text-[#0F0F10]">Bank accounts</h4>
        {wallet.banks.length === 0 && <p className="text-[11px] text-[#6B7280]">No bank account yet. Add one, then ask support to verify it before withdrawal.</p>}
        {wallet.banks.map((b) => (
          <div key={b.id} className="flex items-center justify-between text-xs">
            <span className="text-[#0F0F10]">{b.bankName} ••••{b.maskedNumber.slice(-4)} • {b.accountName}</span>
            <span className={`text-[10px] font-bold ${b.verifiedAt ? 'text-emerald-700' : 'text-amber-700'}`}>{b.verifiedAt ? 'Verified' : 'Unverified'}</span>
          </div>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!bankCode || !bankName || !accountName || !accountNumber) return;
            void run(() => partnerBankRegister(kind, { bankCode, bankName, accountName, accountNumber }), 'Bank account registered for verification.');
          }}
          className="grid grid-cols-2 gap-2"
        >
          <input value={bankCode} onChange={(e) => setBankCode(e.target.value)} placeholder="Bank code" className="px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] text-xs" />
          <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Bank name" className="px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] text-xs" />
          <input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Account name" className="px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] text-xs" />
          <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit number" inputMode="numeric" className="px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] text-xs font-mono" />
          <button type="submit" disabled={busy} className="col-span-2 py-2.5 rounded-xl border border-[#E5E7EB] text-xs font-bold cursor-pointer disabled:opacity-50">Register bank account</button>
        </form>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-bold text-[#0F0F10]">Withdrawals</h4>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!withdrawBankId || !withdrawAmount) return;
            void run(() => partnerWithdraw(kind, { bankAccountId: withdrawBankId, amountKobo: Math.round(Number(withdrawAmount) * 100) }), 'Withdrawal requested.');
          }}
          className="flex gap-2"
        >
          <select value={withdrawBankId} onChange={(e) => setWithdrawBankId(e.target.value)} className="flex-1 px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] text-xs">
            <option value="">Verified account…</option>
            {wallet.banks.filter((b) => b.verifiedAt).map((b) => (
              <option key={b.id} value={b.id}>{b.bankName} ••••{b.maskedNumber.slice(-4)}</option>
            ))}
          </select>
          <input value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="₦ amount" inputMode="decimal" className="w-28 px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] text-xs" />
          <button type="submit" disabled={busy} className="px-4 py-2 rounded-xl bg-[#0F0F10] text-white text-xs font-bold cursor-pointer disabled:opacity-50">Withdraw</button>
        </form>
        {wallet.withdrawals.slice(0, 5).map((w) => (
          <div key={w.id} className="flex items-center justify-between text-[11px] text-[#6B7280]">
            <span>{naira(w.amountKobo)}</span>
            <span className="font-bold">{w.status}</span>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <h4 className="text-xs font-bold text-[#0F0F10]">Earnings journal</h4>
        {wallet.entries.length === 0 && <p className="text-[11px] text-[#6B7280]">No earnings yet. Commissions appear here after verified payments.</p>}
        {wallet.entries.slice(0, 10).map((entry) => (
          <div key={entry.id} className="flex items-center justify-between text-[11px]">
            <span className="text-[#4B5563] truncate">{entry.description} • {entry.bucket}</span>
            <span className={`font-mono font-bold ${entry.amountKobo >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{entry.amountKobo >= 0 ? '+' : ''}{naira(entry.amountKobo)}</span>
          </div>
        ))}
      </div>
    </section>
  );
};
