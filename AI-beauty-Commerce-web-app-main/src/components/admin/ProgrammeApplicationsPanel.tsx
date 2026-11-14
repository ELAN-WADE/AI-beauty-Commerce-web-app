import React, { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../../lib/owned-api';
import { partnerInput, partnerButton } from '../partner/PartnerApplication';

type Item = { id: string; ownerId: string; parentId: string | null; audience: string; title: string; body: string; url: string; status: string; reviewNote: string; version: number; commissionBps?:number; email?: string; emailVerified?: boolean; data: { details?: Record<string, unknown> } };
type Queue = { applications: Item[]; tasks: Item[]; submissions: Item[] };
export function ProgrammeApplicationsPanel({ onReviewed }: { onReviewed: () => void }) {
  const [data, setData] = useState<Queue>({ applications: [], tasks: [], submissions: [] });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    setLoading(true);
    try { setData(await apiFetch<Queue>('/api/admin/partner-programmes')); setError(''); }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not load programme applications.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const command = async (input: object) => {
    if (busy) return false;
    setBusy(true); setError(''); setNotice('');
    try { await apiFetch('/api/admin/partner-programmes', { method: 'POST', body: JSON.stringify(input) }); setNotice('Programme update saved.'); await refresh(); onReviewed(); return true; }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not save the programme update.'); return false; }
    finally { setBusy(false); }
  };
  return <section aria-label="Influencer and ambassador programme reviews" className="mt-10 space-y-5 border-t border-[#E5E7EB] pt-8">
    <div className="flex flex-wrap justify-between gap-4"><div><h2 className="font-heading text-2xl font-bold">Influencer / Ambassador applications</h2><p className="mt-2 text-sm text-[#71717A]">One combined partner role. Review identity and eligibility, supply the agreement, then assign campaigns and brand activities after acceptance.</p></div><button type="button" className="min-h-11 text-sm underline" disabled={busy || loading} onClick={() => void refresh()}>Refresh programme applications</button></div>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
    {notice && <p role="status" className="text-sm text-emerald-800">{notice}</p>}
    {loading ? <p role="status" className="text-sm">Loading programme applications...</p> : !data.applications.length && <p className="rounded-2xl border p-6 text-sm text-[#71717A]">No Influencer / Ambassador applications yet.</p>}
    {data.applications.map(application => <ProgrammeReview key={application.id + ':' + application.version} application={application} tasks={data.tasks.filter(task => task.parentId === application.id)} submissions={data.submissions} busy={busy} command={command} />)}
  </section>;
}
function ProgrammeReview({ application: row, tasks, submissions, busy, command }: { application: Item; tasks: Item[]; submissions: Item[]; busy: boolean; command: (input: object) => Promise<boolean> }) {
  const [note, setNote] = useState('');
  const [agreement, setAgreement] = useState(String(row.data.details?.agreement||''));
  const [commissionRate,setCommissionRate]=useState(String((row.commissionBps??0)/100));
  const [verificationReference, setVerificationReference] = useState('');
  const [title, setTitle] = useState('');
  const [brief, setBrief] = useState('');
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [deliveryNotes, setDeliveryNotes] = useState<Record<string, string>>({});
  const detail = row.data.details ?? {};
  const accepted = Boolean(detail.agreementVersion && detail.acceptedAgreementVersion === detail.agreementVersion);
  const review = (decision: 'APPROVED' | 'REJECTED' | 'REVOKED') => void command({ action: 'review', id: row.id, version: row.version, decision, note, agreement, verificationReference, commissionBps:Math.round(Number(commissionRate)*100) });
  return <article aria-label={`${row.title} influencer ambassador application`} className="space-y-4 rounded-2xl border border-[#EAE8E3] bg-white p-5 shadow-xs">
    <div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-bold">{row.title}</h3><p className="text-sm text-[#6B7280]">Influencer / Ambassador - {row.email}</p></div><span className="text-xs uppercase text-[#6B7280]">{row.status.toLowerCase()}</span></div>
    <a href={row.url} target="_blank" rel="noopener noreferrer" className="inline-block text-sm underline">Review public social profile</a>
    <p className="whitespace-pre-wrap text-sm">{row.body}</p>
    {row.reviewNote && <p className="text-sm text-[#6B7280]">Review note: {row.reviewNote}</p>}
    {['SUBMITTED', 'APPROVED'].includes(row.status) && <label className="block space-y-1 text-sm">Review note<textarea className={partnerInput} aria-label={`Programme review note for ${row.title}`} maxLength={1000} value={note} onChange={event => setNote(event.target.value)} /></label>}
    {['SUBMITTED','APPROVED'].includes(row.status) && <label className="block space-y-1 text-sm">Commission percentage<input aria-label={`Commission percentage for ${row.title}`} type="number" min="0" max="50" step="0.01" className={partnerInput} value={commissionRate} onChange={event=>setCommissionRate(event.target.value)} /></label>}
    {row.status === 'SUBMITTED' && <>
      <label className="block space-y-1 text-sm">Verification reference<input className={partnerInput} value={verificationReference} maxLength={500} onChange={event => setVerificationReference(event.target.value)} placeholder="Reference to completed eligibility and identity review" /></label>
      <label className="block space-y-1 text-sm">Programme agreement<textarea className={partnerInput} rows={6} value={agreement} maxLength={10000} onChange={event => setAgreement(event.target.value)} placeholder="Enter the actual approved responsibilities, duration and compensation terms for the applicant to review and accept." /></label>
      {!row.emailVerified && <p className="text-sm text-amber-800">The applicant must verify their email before approval.</p>}
      <div className="flex flex-wrap gap-3"><button type="button" className={partnerButton} disabled={busy || commissionRate==='' || !Number.isFinite(Number(commissionRate)) || Number(commissionRate)<0 || Number(commissionRate)>50 || !row.emailVerified || note.trim().length < 3 || verificationReference.trim().length < 3 || agreement.trim().length < 20} onClick={() => review('APPROVED')}>Approve Influencer / Ambassador</button><button type="button" className="min-h-11 text-sm text-rose-700 underline" disabled={busy || note.trim().length < 3} onClick={() => review('REJECTED')}>Decline application</button></div>
    </>}
    {row.status === 'APPROVED' && <>
      <p className="text-sm text-[#6B7280]">Agreement: {accepted ? 'Accepted - programme access active' : 'Awaiting applicant acceptance - role not active'}</p>
      <label className="block space-y-1 text-sm">Updated agreement<textarea className={partnerInput} value={agreement} maxLength={10000} onChange={event=>setAgreement(event.target.value)} /></label>
      <button type="button" className={partnerButton} disabled={busy||note.trim().length<3||agreement.trim().length<20||commissionRate===''||Number(commissionRate)<0||Number(commissionRate)>50} onClick={()=>void command({action:'commission',id:row.id,version:row.version,commissionBps:Math.round(Number(commissionRate)*100),agreement,note})}>Update commission and request agreement acceptance</button>
      <details className="text-sm"><summary className="cursor-pointer">View approved agreement</summary><p className="mt-3 whitespace-pre-wrap">{String(detail.agreement || '')}</p></details>
      <button type="button" className="min-h-11 text-sm text-rose-700 underline" disabled={busy || note.trim().length < 3} onClick={() => review('REVOKED')}>Revoke programme access</button>
      {accepted && <form aria-label={`Assign activity to ${row.title}`} onSubmit={event => { event.preventDefault(); void command({ action: 'assign', requestId, id: row.id, title, brief }).then(saved => { if (saved) { setTitle(''); setBrief(''); setRequestId(crypto.randomUUID()); } }); }} className="space-y-3 border-t border-[#E5E7EB] pt-4">
        <h4 className="font-semibold">Assign campaign or ambassador activity</h4>
        <label className="block space-y-1 text-sm">Activity title<input className={partnerInput} required minLength={3} maxLength={160} value={title} onChange={event => setTitle(event.target.value)} /></label>
        <label className="block space-y-1 text-sm">Activity brief<textarea className={partnerInput} required minLength={10} maxLength={5000} value={brief} onChange={event => setBrief(event.target.value)} /></label>
        <button className={partnerButton} disabled={busy}>Assign activity</button>
      </form>}
    </>}
    {tasks.map(task => { const delivery = submissions.find(item => item.parentId === task.id); return <section key={task.id} className="space-y-3 rounded-xl bg-[#FAF9F6] p-4"><h4 className="font-semibold">{task.title}</h4><p className="text-xs uppercase text-[#6B7280]">{task.status.replaceAll('_', ' ').toLowerCase()}</p><p className="whitespace-pre-wrap text-sm">{task.body}</p>{delivery && <><a href={delivery.url} className="text-sm underline" target="_blank" rel="noopener noreferrer">Open submitted deliverable</a><p className="text-sm">{delivery.body}</p>{delivery.status === 'SUBMITTED' && row.status === 'APPROVED' && <><label className="block space-y-1 text-sm">Deliverable review note<textarea className={partnerInput} value={deliveryNotes[delivery.id] || ''} maxLength={1000} onChange={event => setDeliveryNotes({ ...deliveryNotes, [delivery.id]: event.target.value })} /></label><div className="flex gap-4">{[true, false].map(approved => <button type="button" key={String(approved)} disabled={busy || (deliveryNotes[delivery.id] || '').trim().length < 3} className="min-h-11 text-sm underline" onClick={() => void command({ action: 'review-submission', id: delivery.id, version: delivery.version, approved, note: deliveryNotes[delivery.id] })}>{approved ? 'Approve deliverable' : 'Request changes'}</button>)}</div></>}</>}</section>; })}
  </article>;
}
