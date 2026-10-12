import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { ApplicationReceipt } from '../../lib/owned-api';

export const partnerInput = 'w-full min-w-0 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]';
export const partnerButton = 'inline-flex items-center justify-center min-h-11 rounded-full bg-[#0F0F10] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#997A2E]';
export const money = (kobo: number) => (kobo / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });

export const PartnerApplication: React.FC<{ kind: 'DISTRIBUTOR' | 'CREATOR' }> = ({ kind }) => {
  const { authUser, isLiveBackend, registerCreator, registerDistributor, selectedCity } = useApp();
  const [form, setForm] = useState({ name: '', businessName: '', city: selectedCity, state: '', address: '', phone: '', handle: '', niche: '', platform: 'Instagram' as 'Instagram' | 'TikTok' | 'YouTube' });
  const [receipt, setReceipt] = useState<ApplicationReceipt | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const field = (name: Exclude<keyof typeof form, 'platform'>, label: string, type = 'text') => <label className="block space-y-1.5 text-sm"><span>{label}</span><input required={name !== 'businessName'} type={type} maxLength={name === 'address' ? 300 : 120} value={form[name]} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))} className={partnerInput} /></label>;
  if (receipt) return <section role="status" className="rounded-2xl border border-[#D4AF37]/40 bg-white p-6 space-y-2"><h2 className="font-heading text-xl font-bold">Application received</h2><p className="text-sm text-[#6B7280]">Your application is {receipt.status}. Partner access becomes available after the team reviews and approves it.</p><p className="text-xs font-mono break-all">Reference: {receipt.id}</p></section>;
  return <form onSubmit={async e => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const result = kind === 'DISTRIBUTOR' ? await registerDistributor({ name: form.name, businessName: form.businessName, city: form.city, state: form.state, address: form.address, phone: form.phone, whatsapp: form.phone.replace(/\D/g, '') })
        : await registerCreator({ name: form.name, handle: form.handle, niche: form.niche, platform: form.platform });
      setReceipt(result);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not submit. Please try again.'); }
    finally { setBusy(false); }
  }} className="max-w-2xl rounded-2xl border border-[#E5E7EB] bg-white p-5 sm:p-7 space-y-5">
    <div><h2 className="font-heading text-xl font-bold">Apply as a {kind === 'DISTRIBUTOR' ? 'distributor' : 'creator'}</h2><p className="mt-2 text-sm text-[#6B7280]">Tell us about your business. We’ll review the application linked to {authUser?.email ?? 'your account'}.</p></div>
    <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
      {field('name', 'Full name')}
      {kind === 'DISTRIBUTOR' ? <>{field('businessName', 'Business name (optional)')}{field('city', 'City')}{field('state', 'State')}{field('address', 'Business address')}{field('phone', 'Phone', 'tel')}</> : <>{field('handle', 'Social handle')}{field('niche', 'Content focus')}<label className="space-y-1.5 text-sm"><span>Platform</span><select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value as typeof f.platform }))} className={partnerInput}>{['Instagram', 'TikTok', 'YouTube'].map(p => <option key={p}>{p}</option>)}</select></label></>}
    </fieldset>
    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    {!isLiveBackend && <p className="text-sm text-[#6B7280]">Connect the live backend to submit an application.</p>}
    <button disabled={busy || !authUser || !isLiveBackend} className={partnerButton}>{busy ? 'Submitting…' : 'Submit for review'}</button>
  </form>;
};
