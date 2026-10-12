import React, { useState } from 'react';
import { networkCommand, updateAdminOrderStatus, isOwnedApiConfigured } from '../../lib/owned-api';
import { money, partnerButton, partnerInput } from '../partner/PartnerApplication';
import type { Overview } from './NetworkPanel';

export const NetworkSettings: React.FC<{ data: Overview; refresh: () => Promise<void> }> = ({ data, refresh }) => {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [link, setLink] = useState({ kind: 'DISTRIBUTOR' as 'DISTRIBUTOR' | 'CREATOR', partnerId: '', userId: '', percent: '', tier: 'Bronze' });
  const [location, setLocation] = useState<Overview['locations'][number] | null>(null);
  const [price, setPrice] = useState({ variantId: '', tier: 'Bronze', naira: '', units: '24', minimum: '1', isActive: true });
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const execute = async (fn: () => Promise<unknown>, notice: string) => {
    setBusy(true); setError(''); setMessage('');
    try {
      await fn();
      setMessage(notice);
      await refresh();
    } catch (e) {
      if (!isOwnedApiConfigured) {
        setMessage(notice + ' (Sandbox updated)');
      } else {
        setError(e instanceof Error ? e.message : 'Action failed.');
      }
    } finally {
      setBusy(false);
    }
  };
  const selectPrice = (variantId: string, tier: string) => {
    const current = data.wholesalePrices.find(p => p.variantId === variantId && p.tier === tier);
    setPrice({ variantId, tier, naira: current ? String(current.unitPriceKobo / 100) : '', units: current ? String(current.unitsPerCarton) : '', minimum: current ? String(current.minimumCartons) : '1', isActive: current?.isActive ?? true });
  };
  const label = 'block text-sm space-y-1.5';
  return <div className="space-y-4">
    {(message || error) && <p role={error ? 'alert' : 'status'} className={`text-sm ${error ? 'text-rose-700' : 'text-emerald-700'}`}>{error || message}</p>}
    <details className="rounded-xl border bg-white p-4"><summary className="font-bold text-sm cursor-pointer">Partner accounts & commission rates</summary>
      <form className="mt-4 space-y-4" onSubmit={e => { e.preventDefault(); void execute(() => networkCommand({ action: 'link', kind: link.kind, partnerId: link.partnerId, userId: link.userId, commissionBps: Math.round(Number(link.percent) * 100), ...(link.kind === 'DISTRIBUTOR' ? { tier: link.tier } : {}) }), 'Partner account and future-order commission saved.'); }}>
        <fieldset disabled={busy} className="grid sm:grid-cols-2 gap-3">
          <label className={label}>Partner type<select className={partnerInput} value={link.kind} onChange={e => setLink({ kind: e.target.value as typeof link.kind, partnerId: '', userId: '', percent: '', tier: 'Bronze' })}><option value="DISTRIBUTOR">Distributor</option><option value="CREATOR">Creator</option></select></label>
          <label className={label}>Approved partner<select required className={partnerInput} value={link.partnerId} onChange={e => { const p = (link.kind === 'CREATOR' ? data.creators : data.partners).find(p => p.id === e.target.value); setLink(l => ({ ...l, partnerId: e.target.value, userId: p?.userId ?? '', percent: p ? String('commissionBps' in p ? p.commissionBps / 100 : p.commissionRate) : '', tier: p && 'tier' in p ? p.tier : 'Bronze' })); }}><option value="">Select partner…</option>{(link.kind === 'CREATOR' ? data.creators : data.partners).filter(p => p.verified).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <label className={label}>Account owner<select required className={partnerInput} value={link.userId} onChange={e => setLink(l => ({ ...l, userId: e.target.value }))}><option value="">Select account…</option>{data.users.map(u => <option key={u.id} value={u.id}>{u.email}</option>)}</select></label>
          <label className={label}>Commission (%)<input required type="number" min="0" max="50" step={link.kind === 'CREATOR' ? '1' : '0.01'} value={link.percent} onChange={e => setLink(l => ({ ...l, percent: e.target.value }))} className={partnerInput} /></label>
          {link.kind === 'DISTRIBUTOR' && <label className={label}>Wholesale pricing tier<select className={partnerInput} value={link.tier} onChange={e => setLink(l => ({ ...l, tier: e.target.value }))}>{['Bronze', 'Silver', 'Gold'].map(t => <option key={t}>{t}</option>)}</select></label>}
        </fieldset>
        <p className="text-xs text-[#6B7280]">Rates apply to future platform orders. Existing orders keep their agreed rates. Account ownership with an existing wallet cannot be reassigned here.</p>
        <button disabled={busy} className={partnerButton}>Save partner settings</button>
      </form>
    </details>
    <details className="rounded-xl border bg-white p-4"><summary className="font-bold text-sm cursor-pointer">Location settings</summary>
      <label className={`${label} mt-4`}>Location<select className={partnerInput} value={location?.id ?? ''} onChange={e => setLocation(data.locations.find(l => l.id === e.target.value) ?? null)}><option value="">Choose location…</option>{data.locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
      {location && <form className="mt-4 space-y-4" onSubmit={e => { e.preventDefault(); const { id, code, name, type, distributorId, city, state, address, phone, operatingHours, deliveryEnabled, pickupEnabled, deliveryFeeKobo, etaText, isActive } = location; void execute(() => networkCommand({ action: 'location', id, code, name, type, distributorId, city, state, address, phone, operatingHours, deliveryEnabled, pickupEnabled, deliveryFeeKobo, etaText, isActive }), 'Location settings saved.'); }}><fieldset disabled={busy} className="grid sm:grid-cols-2 gap-3">
        {(['name', 'city', 'state', 'address', 'phone', 'operatingHours', 'etaText'] as const).map(key => <label key={key} className={label}>{({ name: 'Store name', city: 'City', state: 'State', address: 'Address', phone: 'Phone', operatingHours: 'Operating hours', etaText: 'Delivery estimate' })[key]}<input required={!['phone', 'operatingHours'].includes(key)} className={partnerInput} value={location[key]} onChange={e => setLocation(l => l ? { ...l, [key]: e.target.value } : l)} /></label>)}
        <label className={label}>Delivery fee (₦, blank = shipping zone)<input className={partnerInput} type="number" min="0" step="0.01" value={location.deliveryFeeKobo == null ? '' : location.deliveryFeeKobo / 100} onChange={e => setLocation(l => l ? { ...l, deliveryFeeKobo: e.target.value === '' ? null : Math.round(Number(e.target.value) * 100) } : l)} /></label>
        {(['deliveryEnabled', 'pickupEnabled', 'isActive'] as const).map(key => <label key={key} className="flex items-center gap-2 text-sm min-h-11"><input type="checkbox" checked={location[key]} onChange={e => setLocation(l => l ? { ...l, [key]: e.target.checked } : l)} />{key === 'isActive' ? 'Accept platform orders' : key === 'pickupEnabled' ? 'Allow pickup' : 'Allow delivery'}</label>)}
      </fieldset><button disabled={busy} className={partnerButton}>Save location</button></form>}
    </details>
    <details className="rounded-xl border bg-white p-4"><summary className="font-bold text-sm cursor-pointer">Wholesale price book</summary>
      <form className="mt-4 space-y-4" onSubmit={e => { e.preventDefault(); void execute(() => networkCommand({ action: 'wholesalePrice', variantId: price.variantId, tier: price.tier, unitPriceKobo: Math.round(Number(price.naira) * 100), unitsPerCarton: Number(price.units), minimumCartons: Number(price.minimum), isActive: price.isActive }), 'Wholesale price saved. Existing invoices keep their original terms.'); }}>
        <fieldset disabled={busy} className="grid sm:grid-cols-2 gap-3"><label className={label}>Product variant<select required value={price.variantId} onChange={e => selectPrice(e.target.value, price.tier)} className={partnerInput}><option value="">Choose variant…</option>{data.variants.map(v => <option key={v.id} value={v.id}>{v.sku} · {v.name} · {v.size}</option>)}</select></label><label className={label}>Eligible tier<select value={price.tier} onChange={e => selectPrice(price.variantId, e.target.value)} className={partnerInput}>{['Bronze', 'Silver', 'Gold'].map(t => <option key={t}>{t}</option>)}</select></label>
        <label className={label}>Price per unit (₦)<input required type="number" min="0.01" step="0.01" max="1000000" value={price.naira} onChange={e => setPrice(p => ({ ...p, naira: e.target.value }))} className={partnerInput} /></label><label className={label}>Units per carton<input required type="number" min="1" max="1000" value={price.units} onChange={e => setPrice(p => ({ ...p, units: e.target.value }))} className={partnerInput} /></label><label className={label}>Minimum cartons<input required type="number" min="1" max="1000" value={price.minimum} onChange={e => setPrice(p => ({ ...p, minimum: e.target.value }))} className={partnerInput} /></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={price.isActive} onChange={e => setPrice(p => ({ ...p, isActive: e.target.checked }))} />Publish for this tier</label></fieldset>
        <p className="text-sm">Carton price: {money(Number(price.naira) * 100 * Number(price.units))}</p><button disabled={busy} className={partnerButton}>Save wholesale price</button>
      </form>
    </details>
    <details className="rounded-xl border bg-white p-4"><summary className="font-bold text-sm cursor-pointer">Wholesale fulfilment ({data.wholesaleOrders.length})</summary><div className="mt-4 space-y-3">
      {!data.wholesaleOrders.length && <p className="text-sm text-[#6B7280]">No wholesale orders yet.</p>}
      {data.wholesaleOrders.map(o => <article key={o.id} className="border rounded-xl p-4 space-y-3"><div className="flex flex-wrap justify-between gap-2"><div className="text-sm"><strong className="font-mono">{o.orderNumber}</strong><p>{data.locations.find(l => l.id === o.destinationId)?.name} · {o.status} · {o.paymentStatus}</p></div><strong>{money(o.totalKobo)}</strong></div>
        {['PAID', 'FULFILLING'].includes(o.status) && <button disabled={busy} className={partnerButton} onClick={() => void execute(() => updateAdminOrderStatus(o.id, o.status === 'PAID' ? 'FULFILLING' : 'SHIPPED'), o.status === 'PAID' ? 'Packing started.' : 'Wholesale shipment dispatched.')}>{o.status === 'PAID' ? 'Start packing' : 'Mark dispatched'}</button>}
        {o.dispatchedAt && !o.returnedAt && <div className="space-y-2"><label className={label}>Full-return receipt evidence<input className={partnerInput} value={evidence[o.id] ?? ''} onChange={e => setEvidence(v => ({ ...v, [o.id]: e.target.value }))} placeholder="Record actual receipt of all returned units at HQ" /></label><button disabled={busy || (evidence[o.id]?.trim().length ?? 0) < 6} className="text-sm underline min-h-11" onClick={() => void execute(() => networkCommand({ action: 'wholesaleReturn', orderId: o.id, evidence: evidence[o.id] }), 'Returned stock credited to HQ. Refunds use the payment refund workflow.')}>Record full stock return</button></div>}
        {o.returnedAt && <p className="text-sm text-[#6B7280]">Stock return recorded {new Date(o.returnedAt).toLocaleString()}</p>}
      </article>)}
    </div></details>
  </div>;
};
