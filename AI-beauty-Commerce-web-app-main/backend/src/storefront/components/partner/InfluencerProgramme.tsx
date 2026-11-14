import React, { useCallback, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { apiFetch } from '../../lib/owned-api';
import { programmeDefinitions, programmePath } from '../../lib/partner-programmes';
import { PartnerProgrammeSelector } from './shell/PartnerProgrammeSelector';
import { partnerInput, partnerButton } from './PartnerApplication';

type RecordItem = { id: string; parentId: string | null; title: string; body: string; url: string; status: string; reviewNote: string; version: number };
type Membership = { commissionBps:number; id: string; name: string; profileUrl: string; motivation: string; status: string; reviewNote: string; version: number; agreement: string; agreementVersion: number; acceptedAgreementVersion: number };
type Workspace = { earnings?:{code:string;commissionBps:number;wallet:{pendingKobo:number;availableKobo:number;heldKobo:number}}|null; membership: Membership | null; canOperate: boolean; tasks: RecordItem[]; submissions: RecordItem[] };
const programme = 'INFLUENCER' as const;

export function InfluencerProgramme() {
  const { authUser, authLoading, requestCustomerSignIn, loginWithGoogle } = useApp();
  if (authLoading && !authUser) return <p role="status" className="p-6">Loading your account...</p>;
  if (!authUser) return <section className="mx-auto max-w-xl space-y-5 p-6 sm:p-10">
    <h1 className="font-heading text-2xl sm:text-3xl font-semibold">Influencer / Ambassador</h1>
    <p className="text-sm text-[#6B7280]">Use your existing account to apply, review your application or open your approved workspace.</p>
    <button type="button" className={partnerButton} onClick={() => loginWithGoogle(window.location.origin + programmePath(programme), 'CUSTOMER')}>Continue with Google</button>
    <button type="button" className="ml-4 min-h-11 text-sm underline" onClick={() => requestCustomerSignIn(programmePath(programme))}>Sign in with email</button>
  </section>;
  return <ProgrammeWorkspace key={authUser.id} />;
}

function ProgrammeWorkspace() {
  const { authUser, refreshAuth, navigateTo } = useApp();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [form, setForm] = useState({ name: authUser?.profile?.displayName || '', profileUrl: '', motivation: '' });
  const [deliveries, setDeliveries] = useState<Record<string, { url: string; note: string }>>({});
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    void apiFetch<Workspace>('/api/partner/programme?programme=INFLUENCER', { signal: controller.signal })
      .then(data => { if (active) { setWorkspace(data); setError(''); setAccepted(false); } })
      .catch(error => { if (active) setError(error instanceof Error ? error.message : 'Could not load this programme.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [revision]);
  useEffect(() => { window.addEventListener('focus', refresh); return () => window.removeEventListener('focus', refresh); }, [refresh]);
  const command = async (input: object) => {
    if (busy) return;
    setBusy(true); setError('');
    try {
      await apiFetch('/api/partner/programme', { method: 'POST', body: JSON.stringify({ ...input, programme }) });
      await refreshAuth();
      refresh();
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not save. Please retry.'); }
    finally { setBusy(false); }
  };
  const member = workspace?.membership;
  const canApply = !member || ['REJECTED', 'REVOKED'].includes(member.status);
  return <main className="mx-auto min-h-screen max-w-7xl bg-white p-4 pb-24 text-[#0F0F10] sm:p-6 lg:p-10">
    <PartnerProgrammeSelector key={revision} kind="INFLUENCER" />
    <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs uppercase tracking-wider text-[#6B7280]">{programmeDefinitions.INFLUENCER.title}</p><h1 className="mt-2 font-heading text-2xl sm:text-3xl font-semibold">Influencer / Ambassador</h1><p className="mt-2 text-sm text-[#6B7280]">Your campaigns, brand activities and reviewed deliverables.</p></div>
      <div className="flex gap-4"><button type="button" disabled={loading || busy} onClick={refresh} className="min-h-11 text-sm underline">Refresh workspace</button><button type="button" onClick={() => navigateTo('home')} className="min-h-11 text-sm underline">Storefront</button></div>
    </header>
    {error && <p role="alert" className="mb-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
    {loading && <p role="status" className="mb-5 text-sm text-[#6B7280]">Checking your programme access...</p>}
    {!loading && workspace && <>
      {member && <section className="mb-6 rounded-2xl border border-[#E5E7EB] p-5"><h2 className="font-semibold">Application: {member.status.toLowerCase()}</h2>{member.reviewNote && <p className="mt-2 text-sm text-[#6B7280]">{member.reviewNote}</p>}{member.status === 'SUBMITTED' && <p className="mt-2 text-sm">Your application is awaiting administrator review. No additional account is needed.</p>}</section>}
      {canApply && <form aria-label="Influencer and ambassador application" onSubmit={event => { event.preventDefault(); void command({ action: 'apply', ...form }); }} className="max-w-2xl space-y-4 rounded-2xl border border-[#E5E7EB] p-5 sm:p-7">
        <h2 className="font-heading text-xl font-semibold">Apply as an Influencer / Ambassador</h2>
        <p className="text-sm text-[#6B7280]">Tell us about your audience and how you would represent Desla. The same application covers influencer and ambassador work.</p>
        <label className="block space-y-1 text-sm">Full name<input className={partnerInput} required minLength={2} maxLength={120} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
        <label className="block space-y-1 text-sm">Public social profile URL<input className={partnerInput} type="url" required placeholder="https://www.instagram.com/yourprofile/" maxLength={1000} value={form.profileUrl} onChange={event => setForm({ ...form, profileUrl: event.target.value })} /></label>
        <label className="block space-y-1 text-sm">About your audience and proposed partnership<textarea className={partnerInput} required minLength={20} maxLength={3000} rows={5} value={form.motivation} onChange={event => setForm({ ...form, motivation: event.target.value })} /></label>
        <button className={partnerButton} disabled={busy}>{busy ? 'Submitting...' : 'Submit application'}</button>
      </form>}
      {member?.status === 'APPROVED' && !workspace.canOperate && <section className="max-w-3xl space-y-4 rounded-2xl border border-[#E5E7EB] p-5 sm:p-7">
        <h2 className="font-heading text-xl font-semibold">Review your programme agreement</h2><p className="text-sm">Commission: {member.commissionBps/100}% of eligible merchandise sales after discounts, excluding delivery charges.</p>
        <p className="text-sm text-[#6B7280]">Administrator approval is complete. Accept the current agreement to activate your Influencer / Ambassador role.</p>
        <div className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-xl bg-[#FAF9F6] p-4 text-sm" tabIndex={0} aria-label="Programme agreement">{member.agreement}</div>
        <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} className="mt-1 h-4 w-4" />I have read and accept this programme agreement (version {member.agreementVersion}).</label>
        <button type="button" className={partnerButton} disabled={busy || !accepted || !member.agreement} onClick={() => void command({ action: 'accept', version: member.version })}>Accept agreement and open workspace</button>
      </section>}
      {workspace.canOperate && workspace.earnings && <section className="mb-6 space-y-3 rounded-2xl border border-[#E5E7EB] p-5" aria-label="Referral performance and earnings"><h2 className="text-xl font-bold">Referral earnings</h2><p className="text-sm">Your commission: {workspace.earnings.commissionBps/100}%</p><p className="break-all text-sm">Partner code: <strong>{workspace.earnings.code}</strong></p><a className="break-all text-sm underline" href={'/catalogue?ref='+encodeURIComponent(workspace.earnings.code)}>Open your referral link</a><p className="text-sm">Pending: {(workspace.earnings.wallet.pendingKobo/100).toLocaleString('en-NG',{style:'currency',currency:'NGN'})} - Available: {(workspace.earnings.wallet.availableKobo/100).toLocaleString('en-NG',{style:'currency',currency:'NGN'})}</p><p className="text-xs text-[#6B7280]">Verified paid sales earn pending commission. Delivery, the hold period and any refunds determine cleared earnings. Bank payments require payout review.</p></section>}
      {workspace.canOperate && <section className="space-y-5" aria-label="Influencer and ambassador assignments">
        <div><h2 className="font-heading text-2xl font-bold">Campaigns & brand activities</h2><p className="mt-2 text-sm text-[#6B7280]">Complete the briefs assigned to you and submit a published link for administrator review. Compensation follows your signed programme terms.</p></div>
        {!workspace.tasks.length && <p className="rounded-2xl border border-[#E5E7EB] p-6 text-sm text-[#6B7280]">No activities have been assigned yet. New campaign and ambassador briefs will appear here.</p>}
        {workspace.tasks.map(task => {
          const submission = workspace.submissions.find(item => item.parentId === task.id);
          const delivery = deliveries[task.id] || { url: '', note: '' };
          return <article key={task.id} className="space-y-4 rounded-2xl border border-[#E5E7EB] p-5 sm:p-7">
            <div className="flex flex-wrap justify-between gap-2"><h3 className="text-lg font-bold">{task.title}</h3><span className="text-xs uppercase text-[#6B7280]">{task.status.replaceAll('_', ' ').toLowerCase()}</span></div>
            <p className="whitespace-pre-wrap text-sm">{task.body}</p>
            {task.reviewNote && <p className="text-sm text-[#6B7280]">Review: {task.reviewNote}</p>}
            {submission && <div className="space-y-2 text-sm"><a className="underline" href={submission.url} target="_blank" rel="noopener noreferrer">Open your submitted deliverable</a><p>{submission.body}</p><p>Review status: {submission.status.toLowerCase()}</p></div>}
            {['ASSIGNED', 'CHANGES_REQUESTED'].includes(task.status) && <form onSubmit={event => { event.preventDefault(); void command({ action: 'submit', taskId: task.id, version: task.version, ...delivery }); }} className="max-w-2xl space-y-3">
              <label className="block space-y-1 text-sm">Published deliverable URL<input className={partnerInput} type="url" required maxLength={1000} value={delivery.url} onChange={event => setDeliveries({ ...deliveries, [task.id]: { ...delivery, url: event.target.value } })} /></label>
              <label className="block space-y-1 text-sm">Delivery note<textarea className={partnerInput} required minLength={5} maxLength={3000} value={delivery.note} onChange={event => setDeliveries({ ...deliveries, [task.id]: { ...delivery, note: event.target.value } })} /></label>
              <button className={partnerButton} disabled={busy}>Submit for review</button>
            </form>}
          </article>;
        })}
      </section>}
    </>}
  </main>;
}
