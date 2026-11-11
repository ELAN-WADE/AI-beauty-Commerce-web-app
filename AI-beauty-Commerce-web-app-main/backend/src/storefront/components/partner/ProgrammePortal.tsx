'use client';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Award, Clapperboard, Handshake, Megaphone, Users } from 'lucide-react';
import { PARTNER_PROGRAMMES } from '../../../modules/partners/programmes';
import { useApp } from '../../context/AppContext';
import { apiFetch } from '../../lib/owned-api';
type RecordRow = { id: string; programme: string; status: string; title: string; body: string; reviewNote: string };
const icons = { clapperboard: Clapperboard, megaphone: Megaphone, handshake: Handshake, award: Award, users: Users };
const field = 'w-full rounded-xl border border-white/20 bg-white/5 p-3 text-base text-white';
export function ProgrammePortal() {
  const { authUser, authLoading, requestCustomerSignIn } = useApp();
  const [selected, setSelected] = useState('creative'), [records, setRecords] = useState<RecordRow[]>([]), [activities, setActivities] = useState<RecordRow[]>([]);
  const [summary, setSummary] = useState(''), [title, setTitle] = useState(''), [body, setBody] = useState(''), [url, setUrl] = useState('');
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [loading, setLoading] = useState(false), [saving, setSaving] = useState(false);
  useEffect(() => { const value = new URLSearchParams(window.location.search).get('programme'); if (PARTNER_PROGRAMMES.some(item => item.id === value)) setSelected(value!); }, []);
  const attempt = useRef<string | null>(null);
  useEffect(() => { attempt.current = null; }, [selected, title, body, url]);
  const programme = PARTNER_PROGRAMMES.find(item => item.id === selected)!;
  const application = records.find(record => record.programme === selected);
  const load = useCallback(async () => {
    if (!authUser) return;
    setLoading(true); setError('');
    try { setRecords((await apiFetch<{records: RecordRow[]}>('/api/partner/programmes')).records); }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not load your programmes.'); }
    finally { setLoading(false); }
  }, [authUser?.id]);
  useEffect(() => { void load(); const refresh = () => { if (!document.hidden) void load(); }; window.addEventListener('focus', refresh); return () => window.removeEventListener('focus', refresh); }, [load]);
  useEffect(() => {
    setActivities([]); if (application?.status !== 'APPROVED') return;
    let active = true;
    apiFetch<{records: RecordRow[]}>(`/api/partner/programmes?programme=${selected}`).then(result => { if (active) setActivities(result.records); }).catch(error => { if (active) setError(error.message); });
    return () => { active = false; };
  }, [selected, application?.status]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try {
      const approved = application?.status === 'APPROVED';
      const result = await apiFetch<any>('/api/partner/programmes', { method: 'POST', body: JSON.stringify(approved ? { action: 'submit', idempotencyKey: attempt.current ||= crypto.randomUUID(), programme: selected, title, body, url } : { action: 'apply', programme: selected, summary }) });
      if (approved) { setActivities(current => [...result.result, ...current.filter(row => !result.result.some((saved: RecordRow) => saved.id === row.id))]); attempt.current = null; setTitle(''); setBody(''); setUrl(''); setNotice('Activity submitted for review.'); }
      else { await load(); setSummary(''); setNotice('Application submitted. DESLA will review your eligibility and required agreements.'); }
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not save. Your entered details have been retained.'); }
    finally { setSaving(false); }
  };
  return <div className="min-h-screen bg-black px-5 py-10 text-white sm:px-8"><div className="mx-auto max-w-5xl space-y-8">
    <header className="rounded-[28px] bg-[#171717] p-7 sm:p-10"><a href="/" className="text-sm font-semibold tracking-widest text-[#D4BD7E]">DESLA</a><p className="mt-6 text-xs uppercase tracking-widest text-[#D4BD7E]">Master platform</p><h1 className="mt-3 text-3xl font-bold sm:text-5xl">DESLA Partner Portal</h1><p className="mt-4 max-w-2xl text-lg text-white/65">One account. Multiple partner programmes. Dashboards built around your approved role.</p></header>
    <nav aria-label="Partner programmes" className="grid grid-cols-2 gap-3 sm:gap-4">{PARTNER_PROGRAMMES.map(item => { const Icon = icons[item.icon]; const state = records.find(record => record.programme === item.id)?.status; return <button key={item.id} type="button" aria-pressed={selected === item.id} onClick={() => { setSelected(item.id); setError(''); setNotice(''); }} className={`rounded-3xl border p-4 sm:p-6 text-left transition-colors ${item.id === 'referral' ? 'col-span-2' : ''} ${selected === item.id ? 'border-[#D4BD7E] bg-[#20201c]' : 'border-white/10 bg-[#171717] hover:bg-[#222]'}`}><Icon size={26} className="text-[#D4BD7E]"/><h2 className="mt-4 text-lg font-bold sm:text-xl">{item.name}</h2><p className="mt-2 text-sm text-white/65">{item.purpose}</p>{state && <p className="mt-3 text-xs tracking-widest text-[#D4BD7E]">{state}</p>}</button>; })}</nav>
    <section aria-label={programme.name + ' workspace'} className="rounded-3xl border border-white/15 bg-[#171717] p-6 sm:p-8"><div className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-2xl font-bold">{programme.name}</h2>{authUser && <button type="button" disabled={loading} onClick={() => void load()} className="text-sm text-[#D4BD7E]">{loading ? 'Refreshing…' : 'Refresh status'}</button>}</div>
      {error && <p role="alert" className="mt-4 text-rose-300">{error}</p>}{notice && <p role="status" className="mt-4 text-[#D4BD7E]">{notice}</p>}
      {authLoading ? <p role="status" className="mt-5">Loading your account…</p> : !authUser ? <div className="mt-5 space-y-4"><p className="text-white/65">Sign in with your existing account to apply. Programme access follows admin review, verification and completed agreements.</p><button type="button" onClick={() => requestCustomerSignIn('/partners?programme=' + selected)} className="rounded-full bg-[#D4BD7E] px-6 py-3 font-semibold text-black">Sign in to apply</button></div> : loading && !records.length ? <p className="mt-5" role="status">Loading programme status…</p> : application?.status === 'PENDING' ? <p className="mt-5 text-white/70">Your application is awaiting review. Approved access will appear here on this same account.</p> : application?.status === 'REJECTED' ? <p className="mt-5 text-white/70">Application declined. {application.reviewNote} Contact DESLA before submitting a revised application.</p> : <form onSubmit={submit} className="mt-6 space-y-4">
        {application?.status === 'APPROVED' ? <><p className="text-[#D4BD7E]">Approved programme workspace</p><label className="block space-y-2"><span>Activity title</span><input required minLength={3} maxLength={160} className={field} value={title} onChange={event => setTitle(event.target.value)}/></label><label className="block space-y-2"><span>Activity details</span><textarea required minLength={10} maxLength={5000} className={field} value={body} onChange={event => setBody(event.target.value)}/></label><label className="block space-y-2"><span>Published content or supporting link (optional, HTTPS)</span><input type="url" className={field} value={url} onChange={event => setUrl(event.target.value)}/></label></> : <><p className="text-white/65">Tell DESLA about your experience and why you would like to join this programme. Registration alone does not activate earnings.</p><label className="block space-y-2"><span>Your application</span><textarea required minLength={20} maxLength={3000} className={field} value={summary} onChange={event => setSummary(event.target.value)}/></label></>}
        <button disabled={saving} className="rounded-full bg-[#D4BD7E] px-6 py-3 font-semibold text-black disabled:opacity-50">{saving ? 'Saving…' : application?.status === 'APPROVED' ? programme.action : 'Submit application'}</button>
      </form>}
      {application?.status === 'APPROVED' && <div className="mt-8 space-y-4"><h3 className="text-lg font-semibold">Your activity</h3>{!activities.length && <p className="text-sm text-white/60">No submitted activities yet.</p>}{activities.map(item => <article key={item.id} className="rounded-xl border border-white/10 p-4"><h4 className="font-semibold">{item.title}</h4><p className="mt-2 whitespace-pre-wrap text-sm text-white/70">{item.body}</p><p className="mt-2 text-xs text-[#D4BD7E]">{item.status}</p>{item.reviewNote && <p className="mt-2 text-sm text-white/70">Review: {item.reviewNote}</p>}</article>)}<p className="text-sm text-white/60">Earnings depend on your recorded programme terms and eligible transactions. Activity submission does not create a commission or initiate a payout.</p></div>}
    </section>
  </div></div>;
}
