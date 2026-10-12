import React, { useEffect, useRef, useState } from 'react';
import { buyWholesale, fetchWholesale, initPayment, newIdempotencyKey, paymentStatus, quoteWholesale, wholesaleOrderAction, type WholesaleDashboard, type WholesaleOrder, type WholesaleQuote } from '../../lib/owned-api';
import { useApp } from '../../context/AppContext';
import { money, partnerButton, partnerInput } from './PartnerApplication';

function downloadInvoice(order: WholesaleOrder) {
  const address = order.wholesaleTerms.shippingAddress;
  const content = ['DESLA — WHOLESALE INVOICE', order.orderNumber, `Issued: ${new Date(order.createdAt).toLocaleString()}`, `Payment: ${order.paymentStatus}`, '',
    `${address.fullName}\n${address.street}\n${address.city}, ${address.state}`, '',
    ...order.items.map(i => `${i.sku} | ${i.productName} (${i.variantLabel}) | ${i.qty} units x ${money(i.unitPriceKobo)} | ${money(i.lineTotalKobo)}`), '',
    `Merchandise: ${money(order.subtotalKobo)}`, `Delivery: ${money(order.deliveryFeeKobo)}`, `Total: ${money(order.totalKobo)}`, '', 'Distributor-owned stock for direct resale. Retail commissions do not apply to this purchase.'].join('\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = `${order.orderNumber}-invoice.txt`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const WholesalePanel: React.FC = () => {
  const { authUser } = useApp();
  const [data, setData] = useState<WholesaleDashboard | null>(null);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [quote, setQuote] = useState<WholesaleQuote | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  // Wholesale stays Flutterwave-only (Paystack removed; redesign pending).
  const [provider] = useState<'flutterwave'>('flutterwave');
  const [payment, setPayment] = useState<{ reference: string; url: string; orderNumber: string } | null>(null);
  const mounted = useRef(true);
  const checkoutKey = useRef(newIdempotencyKey());
  const storageKey = `desla-wholesale-checkout:${authUser?.id}`;

  const refresh = async () => {
    const result = await fetchWholesale();
    if (mounted.current) setData(result);
  };
  useEffect(() => {
    mounted.current = true;
    void refresh().catch(e => { if (mounted.current) setError(e instanceof Error ? e.message : 'Could not load wholesale purchasing.'); });
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    if (!payment) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let count = 0;
    const poll = async () => {
      try {
        const result = await paymentStatus(payment.reference);
        if (cancelled) return;
        if (result.settled) { setPayment(null); setNotice(`Payment verified for ${payment.orderNumber}.`); await refresh(); return; }
        if (result.status === 'failed') { setPayment(null); setError('Payment was not verified. You can retry from the invoice.'); return; }
      } catch { /* Keep the invoice payable; a temporary polling failure is not a payment result. */ }
      if (!cancelled && ++count < 45) timer = setTimeout(poll, 4000);
    };
    void poll();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [payment]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setError(''); setNotice('');
    try { await fn(); } catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : 'Action failed. Please retry.'); }
    finally { if (mounted.current) setBusy(false); }
  };
  const items = Object.entries(quantities).filter(([, q]) => Number(q) > 0).map(([variantId, q]) => ({ variantId, cartons: Number(q) }));
  const startPayment = async (order: WholesaleOrder) => {
    const result = await initPayment(order.id, provider);
    if (!result.authorizationUrl) throw new Error('The gateway did not return a checkout link. Retry payment from this invoice.');
    setPayment({ reference: result.reference, url: result.authorizationUrl, orderNumber: order.orderNumber });
  };
  if (!data) return <section className="rounded-2xl border bg-white p-6 space-y-3"><p role={error ? 'alert' : 'status'}>{error || 'Loading your wholesale catalogue…'}</p>{error && <button className={partnerButton} disabled={busy} onClick={() => void run(refresh)}>Retry</button>}</section>;
  return <div className="space-y-6">
    <section className="rounded-2xl border border-[#D4AF37]/40 bg-white p-5 sm:p-7 space-y-5">
      <div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs uppercase tracking-widest text-[#997A2E]">{data.tier} wholesale terms</p><h2 className="font-heading font-bold text-xl mt-1">Purchase stock for your business</h2><p className="text-sm text-[#6B7280] mt-2">Deliver to {data.location.name}, {data.location.address}. Purchased units enter your wholesale stock after you confirm receipt.</p></div><button onClick={() => void run(refresh)} disabled={busy} className="text-sm underline">Refresh</button></div>
      {(error || notice) && <p role={error ? 'alert' : 'status'} className={`text-sm ${error ? 'text-rose-700' : 'text-emerald-700'}`}>{error || notice}</p>}
      {payment && <div className="rounded-xl bg-[#FAF9F6] border p-4 space-y-2"><p className="font-semibold text-sm">Pay invoice {payment.orderNumber}</p><a href={payment.url} target="_blank" rel="noopener noreferrer" className={partnerButton}>Open secure checkout</a><p className="text-xs text-[#6B7280]">Checkout opens in a new tab. Return here after payment; this page checks the verified result. Refresh if verification takes longer.</p></div>}
      {data.items.length === 0 ? <p className="text-sm text-[#6B7280]">No wholesale prices are configured for your tier yet. Ask the team to publish your catalogue.</p> : <form onSubmit={e => { e.preventDefault(); void run(async () => {
        const result = await quoteWholesale(items); setQuote(result);
        try {
          const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null');
          checkoutKey.current = saved?.fingerprint === result.quoteFingerprint ? saved.key : newIdempotencyKey();
          sessionStorage.setItem(storageKey, JSON.stringify({ fingerprint: result.quoteFingerprint, key: checkoutKey.current }));
        } catch { checkoutKey.current = newIdempotencyKey(); }
      }); }} className="space-y-5">
        <fieldset disabled={busy} className="divide-y divide-[#E5E7EB]">
          {data.items.map(item => <div key={item.variantId} className="py-4 flex flex-wrap items-center justify-between gap-4"><div className="flex-1 min-w-0"><h3 className="font-semibold text-sm">{item.name} · {item.size}</h3><p className="font-mono text-xs text-[#6B7280] mt-1">{item.sku}</p><p className="text-sm mt-2">{money(item.unitPriceKobo * item.unitsPerCarton)} / carton <span className="text-[#6B7280]">· {item.unitsPerCarton} units</span></p><p className="text-xs text-[#6B7280]">Minimum {item.minimumCartons} cartons · {Math.floor(item.available / item.unitsPerCarton)} cartons available at HQ</p></div><label className="w-28 text-sm space-y-1"><span>Cartons</span><input aria-label={`${item.name} cartons`} type="number" min="0" max={Math.min(1000, Math.floor(item.available / item.unitsPerCarton))} step="1" value={quantities[item.variantId] ?? ''} onChange={e => { setQuantities(q => ({ ...q, [item.variantId]: e.target.value })); setQuote(null); }} className={partnerInput} placeholder="0" /></label></div>)}
        </fieldset>
        <button disabled={busy || items.length === 0} className={partnerButton}>Review quote</button>
      </form>}
      {quote && <section aria-label="Wholesale quote" className="rounded-xl bg-[#FAF9F6] border p-5 space-y-4">
        <h3 className="font-heading font-bold">Review your purchase</h3>
        {quote.items.map(i => <div key={i.variantId} className="flex justify-between gap-3 text-sm"><span>{i.productName} · {i.cartons} cartons / {i.qty} units</span><span>{money(i.lineTotalKobo)}</span></div>)}
        <div className="text-sm border-t pt-3 space-y-1"><p className="flex justify-between"><span>Delivery</span><span>{money(quote.deliveryFeeKobo)}</span></p><p className="flex justify-between font-bold"><span>Total</span><span>{money(quote.totalKobo)}</span></p></div>
        <p className="text-xs text-[#6B7280]">Stock is reserved when the invoice is created. Your prices are fixed on that invoice. Payment is verified by the gateway before dispatch.</p>
        <button disabled={busy} className={partnerButton} onClick={() => void run(async () => {
          const result = await buyWholesale(quote.items.map(i => ({ variantId: i.variantId, cartons: i.cartons })), quote.quoteFingerprint, checkoutKey.current);
          setData(d => d ? { ...d, orders: [result.order, ...d.orders.filter(o => o.id !== result.order.id)] } : d);
          setQuote(null); setQuantities({});
          try { sessionStorage.removeItem(storageKey); } catch { /* storage optional */ }
          setNotice(`Invoice ${result.order.orderNumber} created. Choose a gateway below to pay.`);
        })}>Create invoice · {money(quote.totalKobo)}</button>
      </section>}
    </section>
    <section className="rounded-2xl border bg-white p-5 sm:p-7 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-heading font-bold text-xl">Invoices & shipments</h2><span className="text-sm text-[#6B7280]">Payment gateway: <strong className="text-[#0F0F10]">Flutterwave</strong></span></div>
      {!data.orders.length && <p className="text-sm text-[#6B7280]">Your wholesale invoices will appear here.</p>}
      {data.orders.map(o => <article key={o.id} className="rounded-xl border border-[#E5E7EB] p-4 space-y-3"><div className="flex flex-wrap justify-between gap-2"><div><h3 className="font-mono font-bold">{o.orderNumber}</h3><p className="text-xs text-[#6B7280]">{new Date(o.createdAt).toLocaleDateString()} · {o.status} · {o.paymentStatus}{o.wholesaleReturnedAt ? ' · Stock returned to HQ' : ''}</p></div><strong>{money(o.totalKobo)}</strong></div>
        <details><summary className="cursor-pointer text-sm">Invoice lines</summary><ul className="mt-2 space-y-1 text-sm">{o.items.map(i => <li key={i.variantId}>{i.productName} ({i.variantLabel}) · {i.qty} units · {money(i.lineTotalKobo)}</li>)}</ul><p className="text-sm mt-2">Delivery: {money(o.deliveryFeeKobo)}</p></details>
        <div className="flex flex-wrap gap-3"><button className="min-h-11 text-sm underline" onClick={() => downloadInvoice(o)}>Download invoice</button>{o.status === 'PENDING' && <><button disabled={busy} className={partnerButton} onClick={() => void run(() => startPayment(o))}>Pay with Flutterwave</button><button disabled={busy} className="text-sm min-h-11 underline" onClick={() => void run(async () => { await wholesaleOrderAction('cancel', o.id); await refresh(); setNotice('Unpaid invoice cancelled.'); })}>Cancel unpaid invoice</button></>}{o.status === 'SHIPPED' && !o.wholesaleReturnedAt && <button disabled={busy} className={partnerButton} onClick={() => void run(async () => { await wholesaleOrderAction('receive', o.id); await refresh(); setNotice('Receipt confirmed. Your wholesale inventory has been credited.'); })}>Confirm all units received</button>}</div>
      </article>)}
    </section>
  </div>;
};
