import React, { useEffect, useState } from 'react';
import { ChevronLeft, MapPin, Store, MessageCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { fetchDistributors, isOwnedApiConfigured } from '../../lib/owned-api';
import { partnerButton, partnerInput } from '../../components/partner/PartnerApplication';
import { supportedCities } from '../../data/distributors';
import type { Distributor } from '../../types';

export const ScreenDistributors: React.FC = () => {
  const { goBack, selectedCity, setSelectedCity, navigateTo, setSelectedCategory, setPreferredDistributor, setCheckoutAddress, setCheckoutFulfilment, loginAsDemoRole } = useApp();
  const [rows, setRows] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pickup' | 'delivery'>('all');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(''); setRows([]);
    if (!isOwnedApiConfigured) { setLoading(false); setError('Connect the live backend to browse verified distributors and stock.'); return; }
    void fetchDistributors(selectedCity).then(result => { if (!cancelled) setRows(result ?? []); }).catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load distributors.'); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedCity, retry]);
  const filtered = rows.filter(d => filter === 'all' || (filter === 'pickup' ? d.location?.pickupEnabled : d.location?.deliveryEnabled));
  return <main className="min-h-screen bg-[#FAF9F6] text-[#0F0F10] pb-28"><div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E7EB] pb-6"><div className="flex gap-3"><button onClick={goBack} aria-label="Go back" className="p-3 self-start rounded-full bg-white border"><ChevronLeft size={20} /></button><div><p className="text-xs text-[#997A2E] uppercase tracking-widest">Desla partner network</p><h1 className="font-heading text-2xl sm:text-3xl font-bold mt-1">Find a distributor</h1><p className="text-sm text-[#6B7280] mt-2">Browse platform stock or contact a distributor about direct purchases.</p></div></div><button className={partnerButton} onClick={() => { loginAsDemoRole('DISTRIBUTOR'); navigateTo('distributor-portal'); }}>Partner workspace</button></header>
    <div className="flex flex-wrap gap-4 items-end justify-between"><label className="text-sm space-y-2 w-full sm:w-64"><span className="flex gap-1.5 items-center"><MapPin size={16} /> Your city</span><input list="distributor-cities" className={partnerInput} value={selectedCity} onChange={e => setSelectedCity(e.target.value)} /><datalist id="distributor-cities">{supportedCities.map(c => <option key={c.city} value={c.city} />)}</datalist></label><div className="flex flex-wrap gap-2" aria-label="Distributor filter">{(['all', 'pickup', 'delivery'] as const).map(f => <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)} className={`min-h-11 px-4 py-2 rounded-full text-sm border ${filter === f ? 'bg-[#0F0F10] text-white' : 'bg-white'}`}>{f === 'all' ? 'All partners' : f === 'pickup' ? 'Platform pickup' : 'Platform delivery'}</button>)}</div></div>
    {loading ? <p role="status" className="p-6">Loading verified distributors…</p> : error ? <section className="p-6 rounded-2xl bg-white border space-y-3"><p role="alert">{error}</p><button className={partnerButton} onClick={() => setRetry(r => r + 1)}>Retry</button></section> : !filtered.length ? <p className="p-6 rounded-2xl bg-white border">No partners match this city and filter. Try another city or view all partners.</p> : <div className="grid md:grid-cols-2 gap-5">{filtered.map(d => <article key={d.id} className="bg-white border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 flex flex-col gap-5"><div><p className="text-xs text-[#997A2E] flex gap-2 items-center"><Store size={16} /> Verified distributor</p><h2 className="font-heading font-bold text-xl mt-2">{d.businessName || d.name}</h2><p className="text-sm text-[#6B7280] mt-1">{d.location?.address || d.address} · {d.city}, {d.state}</p>{d.operatingHours && <p className="text-xs text-[#6B7280] mt-1">{d.operatingHours}</p>}</div>
      <div className="flex-1 space-y-2"><h3 className="font-semibold text-sm">Platform stock</h3>{d.stock?.length ? <><ul className="text-sm space-y-1">{d.stock.slice(0, 6).map(s => <li key={s.sku} className="flex justify-between gap-2"><span>{s.name} · {s.size}</span><span className="font-mono shrink-0">{s.available} available</span></li>)}</ul>{d.stock.length > 6 && <p className="text-xs text-[#6B7280]">+{d.stock.length - 6} more variants</p>}<p className="text-xs text-[#6B7280]">Your complete bag, delivery fee, and pickup eligibility are rechecked at checkout.</p></> : <p className="text-sm text-[#6B7280]">No platform stock is currently listed at this location.</p>}</div>
      <div className="space-y-3 border-t pt-4"><button disabled={!d.location || !d.stock?.length} className={`${partnerButton} w-full`} onClick={() => { setPreferredDistributor(d); setCheckoutFulfilment(null); setCheckoutAddress(a => ({ ...a, city: d.location!.city, state: d.location!.state })); setSelectedCategory('All'); navigateTo('catalogue'); }}>Shop platform stock</button>{d.whatsapp && <><a className="inline-flex items-center gap-2 text-sm underline min-h-11" href={`https://wa.me/${d.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hello, I would like to enquire about a direct purchase from your own stock.')}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} /> Enquire about a direct purchase</a><p className="text-xs text-[#6B7280]">Direct purchases are arranged with the distributor using their own resale stock. Platform checkout and referral commissions apply only to orders placed in this app.</p></>}</div>
    </article>)}</div>}
  </div></main>;
};
