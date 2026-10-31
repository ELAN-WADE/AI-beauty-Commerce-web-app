import React, { useEffect, useState } from 'react';
import { fetchNetworkOverview, networkCommand, isOwnedApiConfigured } from '../../lib/owned-api';
import { NetworkSettings } from './NetworkSettings';
import { isPortalDesignPreview } from '../../lib/portal-preview';
import {
  Building2,
  Truck,
  ArrowRight,
  Package,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  ShieldCheck,
  CreditCard
} from 'lucide-react';

export interface Overview {
  locations: {
    id: string;
    code: string;
    name: string;
    type: 'WAREHOUSE' | 'DISTRIBUTOR' | 'RETAIL_STORE';
    address: string;
    phone: string;
    operatingHours: string;
    etaText: string;
    city: string;
    state: string;
    isActive: boolean;
    distributorId: string | null;
    deliveryEnabled: boolean;
    pickupEnabled: boolean;
    deliveryFeeKobo: number | null;
  }[];
  stock: {
    pool: 'PLATFORM' | 'WHOLESALE';
    locationId: string;
    variantId: string;
    sku: string;
    name: string;
    onHand: number;
    reserved: number;
  }[];
  partners: {
    id: string;
    name: string;
    city: string;
    userId: string | null;
    tier: string;
    commissionBps: number;
    verified: boolean;
  }[];
  creators: {
    id: string;
    name: string;
    promoCode: string;
    userId: string | null;
    commissionRate: number;
    verified: boolean;
  }[];
  users: { id: string; email: string }[];
  variants: { id: string; sku: string; size: string; name: string }[];
  transfers: {
    id: string;
    sourceLocationId: string;
    destinationLocationId: string;
    status: string;
  }[];
  restocks: {
    id: string;
    locationId: string;
    variantId: string;
    qty: number;
    status: string;
  }[];
  banks: {
    id: string;
    walletId: string;
    bankName: string;
    accountName: string;
    verifiedAt: string | null;
  }[];
  withdrawals: {
    id: string;
    walletId: string;
    amountKobo: number;
    status: string;
  }[];
  finance: boolean;
  wholesalePrices: {
    variantId: string;
    tier: string;
    unitPriceKobo: number;
    unitsPerCarton: number;
    minimumCartons: number;
    isActive: boolean;
  }[];
  wholesaleOrders: {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    totalKobo: number;
    destinationId: string;
    dispatchedAt: string | null;
    receivedAt: string | null;
    returnedAt: string | null;
  }[];
}

const naira = (kobo: number) => '₦' + Math.round(kobo / 100).toLocaleString('en-NG');

const initialNetworkOverview: Overview = { locations: [], stock: [], partners: [], creators: [], users: [], variants: [], transfers: [], restocks: [], banks: [], withdrawals: [], finance: false, wholesalePrices: [], wholesaleOrders: [] };

export const NetworkPanel: React.FC = () => {
  const [data, setData] = useState<Overview>(() => isPortalDesignPreview() ? initialNetworkOverview : { locations: [], stock: [], partners: [], creators: [], users: [], variants: [], transfers: [], restocks: [], banks: [], withdrawals: [], finance: false, wholesalePrices: [], wholesaleOrders: [] });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [transferForm, setTransferForm] = useState({ source: '', dest: '', variant: '', qty: '' });
  const [payoutEvidence, setPayoutEvidence] = useState<Record<string, string>>({});
  const [payoutRef, setPayoutRef] = useState<Record<string, string>>({});
  const [bankEvidence, setBankEvidence] = useState<Record<string, string>>({});

  const refresh = async () => {
    setError('');
    if (isPortalDesignPreview()) { setData(initialNetworkOverview); return; }
    if (!isOwnedApiConfigured) {
      setError('Connect the live backend to manage the network.');
      return;
    }
    try {
      const res = (await fetchNetworkOverview()) as Overview | null;
      if (res) {
        setData(res);
      } else throw new Error('Could not load the live network.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the live network.');
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const run = async (input: Record<string, unknown>, ok: string) => {
    setBusy(true);
    setNotice('');
    setError('');

    // If live API is connected, call networkCommand
    if (isOwnedApiConfigured) {
      try {
        await networkCommand(input);
        setNotice(ok);
        await refresh();
        setBusy(false);
        return;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Action failed. No local changes were applied.');
        setBusy(false);
        return;
      }
    }
    setError('Connect the live backend to perform this action.');
    setBusy(false);
    return;
  };

  return (
    <div className="space-y-6">
      {/* Status Notice */}
      {(notice || error) && (
        <div
          className={`p-3 rounded-2xl text-xs font-mono font-bold flex items-center justify-between border ${
            error
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-[#0F0F10] text-[#D4AF37] border-[#D4AF37]/30 shadow-xs'
          }`}
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" /> {notice || error}
          </span>
          <button onClick={() => { setNotice(''); setError(''); }} className="text-white/60 hover:text-white cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Network Settings Collapsibles */}
      <NetworkSettings data={data} refresh={refresh} />

      {/* 1. Regional Hub Facilities */}
      <div className="p-5 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-heading font-bold text-[#0F0F10]">
              Regional Facility Hubs ({data.locations.length})
            </h4>
            <p className="text-xs text-[#71717A]">
              Active cold-chain logistics centers, local rider radiuses, and platform inventory quotas.
            </p>
          </div>
          <span className="text-[10px] font-mono uppercase bg-[#FAF9F6] text-[#0F0F10] border border-[#EAE8E3] px-2.5 py-1 rounded-full font-bold">
            Omnichannel Routing
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {data.locations.map((l) => {
            const units = data.stock
              .filter((s) => s.locationId === l.id && s.pool === 'PLATFORM')
              .reduce((n, s) => n + Math.max(0, s.onHand - s.reserved), 0);
            const owned = data.stock
              .filter((s) => s.locationId === l.id && s.pool === 'WHOLESALE')
              .reduce((n, s) => n + s.onHand, 0);

            return (
              <div
                key={l.id}
                className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] space-y-2.5 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <strong className="text-[#0F0F10] font-bold block">
                      {l.name} ({l.code})
                    </strong>
                    <span className="text-[11px] text-[#71717A]">
                      {l.city}, {l.state} • {l.phone}
                    </span>
                  </div>
                  <span
                    className={`text-[9.5px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border ${
                      l.isActive
                        ? 'bg-[#0F0F10] text-[#D4AF37] border-[#0F0F10]'
                        : 'bg-white text-[#71717A] border-[#EAE8E3]'
                    }`}
                  >
                    {l.isActive ? 'Active' : 'Offline'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-y border-[#EAE8E3] font-mono text-[11px]">
                  <div>
                    <span className="text-[9px] uppercase text-[#71717A] block">Platform Pool</span>
                    <strong className="text-[#0F0F10]">{units} Units</strong>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-[#71717A] block">Wholesale Owned</span>
                    <strong className="text-[#0F0F10]">{owned} Units</strong>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-[#71717A] block">City Bike Fee</span>
                    <strong className="text-[#997A2E]">{l.deliveryFeeKobo == null ? 'Zone Fee' : naira(l.deliveryFeeKobo)}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#71717A]">
                  <span>{l.etaText}</span>
                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    {l.deliveryEnabled && <span className="text-[#0F0F10]">Bike Rider ✓</span>}
                    {l.pickupEnabled && <span className="text-[#0F0F10]">• In-Hub Pickup ✓</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Stock Transfer Dispatcher */}
      <div className="p-5 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs space-y-4">
        <div>
          <h4 className="text-sm font-heading font-bold text-[#0F0F10]">
            Central Lab Stock Transfer Dispatcher
          </h4>
          <p className="text-xs text-[#71717A]">
            Dispatch small-batch formulation shipments from Lekki HQ Laboratory to regional hub pools.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
          <select
            value={transferForm.source}
            onChange={(e) => setTransferForm((f) => ({ ...f, source: e.target.value }))}
            className="px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#EAE8E3] font-mono"
          >
            <option value="">Source Facility…</option>
            {data.locations.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>

          <select
            value={transferForm.dest}
            onChange={(e) => setTransferForm((f) => ({ ...f, dest: e.target.value }))}
            className="px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#EAE8E3] font-mono"
          >
            <option value="">Destination Hub…</option>
            {data.locations.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>

          <select
            value={transferForm.variant}
            onChange={(e) => setTransferForm((f) => ({ ...f, variant: e.target.value }))}
            className="px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#EAE8E3] font-mono"
          >
            <option value="">Formulation Variant…</option>
            {data.variants.map((v) => (
              <option key={v.id} value={v.id}>{v.sku} ({v.size})</option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              value={transferForm.qty}
              onChange={(e) => setTransferForm((f) => ({ ...f, qty: e.target.value.replace(/\D/g, '') }))}
              placeholder="Qty Units"
              inputMode="numeric"
              className="w-24 px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#EAE8E3] font-mono"
            />
            <button
              disabled={busy || !transferForm.source || !transferForm.dest || !transferForm.variant || !transferForm.qty}
              onClick={() =>
                void run(
                  {
                    action: 'transfer',
                    sourceLocationId: transferForm.source,
                    destinationLocationId: transferForm.dest,
                    items: [{ variantId: transferForm.variant, qty: Number(transferForm.qty) }]
                  },
                  'Stock transfer dispatched via priority courier.'
                )
              }
              className="flex-1 py-2.5 rounded-xl bg-[#0F0F10] text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-bold hover:bg-[#27272A] cursor-pointer disabled:opacity-50"
            >
              Dispatch
            </button>
          </div>
        </div>

        {/* Transfers Active Queue */}
        <div className="space-y-2 pt-2 border-t border-[#EAE8E3]">
          <span className="text-[10px] font-mono uppercase text-[#71717A] font-bold block">
            Recent In-Transit Transfers ({data.transfers.length})
          </span>
          {data.transfers.slice(0, 5).map((t) => {
            const src = data.locations.find((l) => l.id === t.sourceLocationId)?.name || 'HQ Lab';
            const dest = data.locations.find((l) => l.id === t.destinationLocationId)?.name || 'Regional Hub';
            return (
              <div
                key={t.id}
                className="p-3 rounded-xl bg-[#FAF9F6] border border-[#EAE8E3] flex items-center justify-between text-xs"
              >
                <div className="font-mono">
                  <span className="font-bold text-[#0F0F10] block">#{t.id}</span>
                  <span className="text-[11px] text-[#71717A]">
                    {src} → {dest}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-white border border-[#EAE8E3] text-[#0F0F10]">
                    {t.status}
                  </span>
                  {t.status === 'DISPATCHED' && (
                    <button
                      disabled={busy}
                      onClick={() => void run({ action: 'receive', transferId: t.id }, 'Transfer confirmed and received at hub.')}
                      className="px-3 py-1 rounded-full bg-[#0F0F10] text-[#D4AF37] border border-[#D4AF37]/30 text-[11px] font-mono font-bold cursor-pointer hover:bg-[#27272A] disabled:opacity-50"
                    >
                      Confirm Receipt
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Restock Requests Desk */}
      <div className="p-5 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs space-y-4">
        <div>
          <h4 className="text-sm font-heading font-bold text-[#0F0F10]">
            Distributor Restock Requests Desk ({data.restocks.length})
          </h4>
          <p className="text-xs text-[#71717A]">
            Requests raised by regional distributors when their physical stock reaches critical minimums.
          </p>
        </div>

        <div className="space-y-2">
          {data.restocks.map((r) => {
            const loc = data.locations.find((l) => l.id === r.locationId)?.name || 'Regional Hub';
            const v = data.variants.find((v) => v.id === r.variantId)?.name || 'Formulation';
            return (
              <div
                key={r.id}
                className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#EAE8E3] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <strong className="text-[#0F0F10] block">{loc}</strong>
                  <span className="text-[#71717A]">
                    {v} • <span className="font-mono font-bold text-[#0F0F10]">{r.qty} Units Requested</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase font-bold px-2.5 py-0.5 rounded-full bg-white border border-[#EAE8E3] text-[#0F0F10]">
                    {r.status}
                  </span>
                  {r.status === 'REQUESTED' && (
                    <button
                      disabled={busy}
                      onClick={() => void run({ action: 'restock', id: r.id, status: 'APPROVED' }, 'Restock request approved.')}
                      className="px-3 py-1 rounded-full bg-[#0F0F10] text-[#D4AF37] border border-[#D4AF37]/30 font-mono font-bold text-[11px] hover:bg-[#27272A] cursor-pointer disabled:opacity-50"
                    >
                      Approve Request
                    </button>
                  )}
                  {r.status === 'APPROVED' && (
                    <button
                      disabled={busy}
                      onClick={() => void run({ action: 'restock', id: r.id, status: 'FULFILLED' }, 'Restock fulfilled.')}
                      className="px-3 py-1 rounded-full bg-white border border-[#EAE8E3] text-[#0F0F10] font-mono font-bold text-[11px] hover:bg-[#FAF9F6] cursor-pointer disabled:opacity-50"
                    >
                      Mark Fulfilled
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Margin & Commission Payout Settlements */}
      {data.finance && (
        <div className="p-5 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs space-y-4">
          <div>
            <h4 className="text-sm font-heading font-bold text-[#0F0F10]">
              Distributor Margin &amp; Commission Settlements ({data.withdrawals.length})
            </h4>
            <p className="text-xs text-[#71717A]">
              Reconcile distributor wallet withdrawal requests. Settle via bank transfer and log payment evidence.
            </p>
          </div>

          <div className="space-y-3">
            {data.withdrawals.map((w) => (
              <div
                key={w.id}
                className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] space-y-3 text-xs"
              >
                <div className="flex items-center justify-between font-mono">
                  <strong className="text-sm font-bold text-[#0F0F10]">
                    {naira(w.amountKobo)}
                  </strong>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0F0F10] text-[#D4AF37]">
                    {w.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    value={payoutEvidence[w.id] ?? ''}
                    onChange={(e) => setPayoutEvidence((p) => ({ ...p, [w.id]: e.target.value }))}
                    placeholder="Audit evidence note (e.g. Verified via GTB Portal)"
                    className="px-3 py-2 rounded-xl bg-white border border-[#EAE8E3] text-xs outline-none"
                  />
                  <input
                    value={payoutRef[w.id] ?? ''}
                    onChange={(e) => setPayoutRef((p) => ({ ...p, [w.id]: e.target.value }))}
                    placeholder="NIP transaction reference (e.g. NIP/2026/04/889104)"
                    className="px-3 py-2 rounded-xl bg-white border border-[#EAE8E3] text-xs font-mono outline-none"
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {(['APPROVED', 'PAID', 'REJECTED'] as const).map((s) => (
                    <button
                      key={s}
                      disabled={busy}
                      onClick={() =>
                        void run(
                          {
                            action: 'payout',
                            id: w.id,
                            status: s,
                            evidence: payoutEvidence[w.id] ?? 'Administrative verification',
                            ...(payoutRef[w.id] ? { paymentReference: payoutRef[w.id] } : {})
                          },
                          `Payout status updated to ${s}.`
                        )
                      }
                      className={`px-3.5 py-1.5 rounded-full text-[11px] font-mono font-bold cursor-pointer transition disabled:opacity-50 ${
                        s === 'PAID'
                          ? 'bg-[#0F0F10] text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#27272A]'
                          : 'bg-white border border-[#EAE8E3] text-[#0F0F10] hover:bg-[#FAF9F6]'
                      }`}
                    >
                      Mark {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
