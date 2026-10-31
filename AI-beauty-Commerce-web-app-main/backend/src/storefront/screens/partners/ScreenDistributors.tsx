import React, { useEffect, useState } from 'react';
import { ChevronLeft, MapPin, Store, MessageCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { fetchDistributors, isOwnedApiConfigured } from '../../lib/owned-api';
import { partnerButton, partnerInput } from '../../components/partner/PartnerApplication';
import { supportedCities } from '../../data/distributors';
import type { Distributor } from '../../types';

export const ScreenDistributors: React.FC = () => {
  const { goBack, selectedCity, setSelectedCity, navigateTo, setSelectedCategory, setPreferredDistributor, setCheckoutAddress, setCheckoutFulfilment, loginWithGoogle, authUser } = useApp();
  const [rows, setRows] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pickup' | 'delivery'>('all');
  const [retry, setRetry] = useState(0);

  const handleJoinDistributorWithGoogle = () => {
    navigateTo('distributor-portal');
  };
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(''); setRows([]);
    if (!isOwnedApiConfigured) { setLoading(false); setError('Connect the live backend to browse verified distributors and stock.'); return; }
    void fetchDistributors(selectedCity).then(result => { if (!cancelled) setRows(result ?? []); }).catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load distributors.'); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedCity, retry]);
  const filtered = rows.filter(d => filter === 'all' || (filter === 'pickup' ? d.location?.pickupEnabled : d.location?.deliveryEnabled));
  return <main className="min-h-screen bg-[#FAF9F6] text-[#0F0F10] pb-28"><div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E7EB] pb-6"><div className="flex gap-3"><button onClick={goBack} aria-label="Go back" className="p-3 self-start rounded-full bg-white border"><ChevronLeft size={20} /></button><div><p className="text-xs text-[#997A2E] uppercase tracking-widest">Desla partner network</p><h1 className="font-heading text-2xl sm:text-3xl font-bold mt-1">Find a distributor</h1><p className="text-sm text-[#6B7280] mt-2">Browse platform stock or contact a distributor about direct purchases.</p></div></div><button className={partnerButton} onClick={() => navigateTo('distributor-portal')}>Partner workspace</button></header>

    {/* Join Distributor Network Fast-Track Banner */}
    <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#0F0F10] to-[#1F1D22] text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs border border-white/10">
      <div className="space-y-1 text-center sm:text-left">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] font-semibold">
          Commercial Dispensary Network
        </span>
        <h2 className="font-heading font-bold text-lg text-white">
          Become an Authorized Desla!™ City Distributor
        </h2>
        <p className="text-xs text-gray-300 max-w-xl">
          Hold regional stock in your city, earn wholesale margins, and process same-day local customer pickups.
        </p>
      </div>
      <button
        onClick={handleJoinDistributorWithGoogle}
        className="shrink-0 py-3 px-5 rounded-xl bg-white hover:bg-gray-100 text-[#0F0F10] text-xs font-bold flex items-center gap-2.5 shadow-sm active:scale-95 transition-all cursor-pointer"
      >
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
        <span>Join Distributor Hub</span>
      </button>
    </div>

    <div className="flex flex-wrap gap-4 items-end justify-between"><label className="text-sm space-y-2 w-full sm:w-64"><span className="flex gap-1.5 items-center"><MapPin size={16} /> Your city</span><input list="distributor-cities" className={partnerInput} value={selectedCity} onChange={e => setSelectedCity(e.target.value)} /><datalist id="distributor-cities">{supportedCities.map(c => <option key={c.city} value={c.city} />)}</datalist></label><div className="flex flex-wrap gap-2" aria-label="Distributor filter">{(['all', 'pickup', 'delivery'] as const).map(f => <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)} className={`min-h-11 px-4 py-2 rounded-full text-sm border ${filter === f ? 'bg-[#0F0F10] text-white' : 'bg-white'}`}>{f === 'all' ? 'All partners' : f === 'pickup' ? 'Platform pickup' : 'Platform delivery'}</button>)}</div></div>
    {loading ? <p role="status" className="p-6">Loading verified distributors…</p> : error ? <section className="p-6 rounded-2xl bg-white border space-y-3"><p role="alert">{error}</p><button className={partnerButton} onClick={() => setRetry(r => r + 1)}>Retry</button></section> : !filtered.length ? <p className="p-6 rounded-2xl bg-white border">No partners match this city and filter. Try another city or view all partners.</p> : <div className="grid md:grid-cols-2 gap-5">{filtered.map(d => <article key={d.id} className="bg-white border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 flex flex-col gap-5"><div><p className="text-xs text-[#997A2E] flex gap-2 items-center"><Store size={16} /> Verified distributor</p><h2 className="font-heading font-bold text-xl mt-2">{d.businessName || d.name}</h2><p className="text-sm text-[#6B7280] mt-1">{d.location?.address || d.address} · {d.city}, {d.state}</p>{d.operatingHours && <p className="text-xs text-[#6B7280] mt-1">{d.operatingHours}</p>}</div>
      <div className="flex-1 space-y-2"><h3 className="font-semibold text-sm">Platform stock</h3>{d.stock?.length ? <><ul className="text-sm space-y-1">{d.stock.slice(0, 6).map(s => <li key={s.sku} className="flex justify-between gap-2"><span>{s.name} · {s.size}</span><span className="font-mono shrink-0">{s.available} available</span></li>)}</ul>{d.stock.length > 6 && <p className="text-xs text-[#6B7280]">+{d.stock.length - 6} more variants</p>}<p className="text-xs text-[#6B7280]">Your complete bag, delivery fee, and pickup eligibility are rechecked at checkout.</p></> : <p className="text-sm text-[#6B7280]">No platform stock is currently listed at this location.</p>}</div>
      <div className="space-y-3 border-t pt-4"><button disabled={!d.location || !d.stock?.length} className={`${partnerButton} w-full`} onClick={() => { setPreferredDistributor(d); setCheckoutFulfilment(null); setCheckoutAddress(a => ({ ...a, city: d.location!.city, state: d.location!.state })); setSelectedCategory('All'); navigateTo('catalogue'); }}>Shop platform stock</button>{d.whatsapp && <><a className="inline-flex items-center gap-2 text-sm underline min-h-11" href={`https://wa.me/${d.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hello, I would like to enquire about a direct purchase from your own stock.')}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} /> Enquire about a direct purchase</a><p className="text-xs text-[#6B7280]">Direct purchases are arranged with the distributor using their own resale stock. Platform checkout and referral commissions apply only to orders placed in this app.</p></>}</div>
    </article>)}</div>}
  </div></main>;
};
