import { ProgrammeTerms } from './ProgrammeTerms';
import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, LogIn, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiFetch } from '../../lib/owned-api';
import { programmeDefinitions, programmePath } from '../../lib/partner-programmes';
import { PartnerProgrammeSelector } from './shell/PartnerProgrammeSelector';
import { partnerInput, partnerButton } from './PartnerApplication';
import { DeslaAuthShell } from '../auth/DeslaAuthShell';

type RecordItem = { id: string; parentId: string | null; title: string; body: string; url: string; status: string; reviewNote: string; version: number };
type Membership = { commissionBps:number; id: string; name: string; profileUrl: string; motivation: string; status: string; reviewNote: string; version: number; agreement: string; agreementVersion: number; acceptedAgreementVersion: number };
type Workspace = { earnings?:{code:string;commissionBps:number;wallet:{pendingKobo:number;availableKobo:number;heldKobo:number}}|null; membership: Membership | null; canOperate: boolean; tasks: RecordItem[]; submissions: RecordItem[] };
const programme = 'INFLUENCER' as const;

export function InfluencerProgramme() {
  const { authUser, requestCustomerSignIn, loginWithGoogle, navigateTo } = useApp();
  if (!authUser) {
    return (
      <DeslaAuthShell
        artworkSrc="/artwork/creator-login-editorial.webp"
        artworkAlt="Desla Beauty ambassador filming a skincare routine in warm studio light"
        artworkPosition="object-top"
        eyebrow="Desla Ambassador"
        headline="Welcome to Desla"
        subheadline="Influence, inspire, and grow with us."
        supportingCopy="Use your existing Desla account to apply, track your ambassador campaigns, and manage reviewed deliverables."
        showSkinScanFeature={true}
        onSkinScanClick={() => navigateTo('ai-scan')}
      >
        <div className="flex items-center justify-between mb-5">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6E6A63] hover:text-[#111111] transition-colors cursor-pointer py-1 -ml-1 px-1.5 rounded-md hover:bg-[#F5F2EB]"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back to Shop</span>
          </button>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-[#B89248]">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Ambassador</span>
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <h1 className="text-[22px] sm:text-2xl font-semibold font-heading text-[#111111] tracking-tight leading-snug">
              Influencer / Ambassador
            </h1>
            <p className="text-xs sm:text-[13px] font-normal text-[#6E6A63] leading-relaxed mt-1.5">
              Use your existing account to apply, review your application, or open your approved workspace.
            </p>
          </div>

          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={() => loginWithGoogle(window.location.origin + programmePath(programme), 'CUSTOMER')}
              className="w-full h-11 px-4 rounded-[10px] border border-[#DDD7CC] hover:border-[#111111] bg-white/90 hover:bg-white text-[#111111] text-sm font-medium flex items-center justify-center gap-2.5 active:scale-[0.99] transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89248] focus-visible:ring-offset-2"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[#EAE5DC]" />
              <span className="shrink-0 mx-3 text-[10px] uppercase tracking-[0.14em] text-[#9A948A] font-medium">
                Or email
              </span>
              <div className="flex-grow border-t border-[#EAE5DC]" />
            </div>

            <button
              type="button"
              onClick={() => requestCustomerSignIn(programmePath(programme))}
              className="group w-full h-11 px-4 rounded-[10px] bg-[#111111] hover:bg-[#242426] text-white text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89248] focus-visible:ring-offset-2"
            >
              <LogIn className="w-4 h-4 text-[#E6C77A]" aria-hidden="true" />
              <span>Sign in with email</span>
              <ArrowRight className="w-4 h-4 text-[#E6C77A] transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </DeslaAuthShell>
    );
  }
  return <ProgrammeWorkspace key={authUser.id} />;
}

function ProgrammeWorkspace() {
  const { authUser, refreshAuth, navigateTo } = useApp();
  const [view, setView] = useState('overview');
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
  return <div className="min-h-[100dvh] bg-[#FBF9F5] text-[#111111]">
    {/* Compact Mobile Sticky Header */}
    <div className="md:hidden sticky top-0 z-30 bg-[#FFFFFF]/95 backdrop-blur-xl border-b border-[#EAE5DC] px-4 py-2.5 pt-[calc(0.625rem+env(safe-area-inset-top,0px))] flex items-center justify-between gap-2">
      <button type="button" onClick={() => navigateTo('home')} className="inline-flex items-center gap-2 cursor-pointer">
        <img src="/desla_logo_dark.svg" alt="Desla!" className="h-5 w-auto block object-contain" />
        <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#8C6D28]">Ambassador</span>
      </button>
      <div className="flex items-center gap-2">
        <button type="button" disabled={loading || busy} onClick={refresh} className="h-8 px-3 rounded-full border border-[#DDD7CC] bg-white text-[11px] font-medium text-[#111111] cursor-pointer">Refresh</button>
        <button type="button" onClick={() => navigateTo('home')} className="h-8 px-3 rounded-full bg-[#111111] text-white text-[11px] font-medium cursor-pointer">Shop</button>
      </div>
    </div>

    <main className="mx-auto max-w-7xl p-4 pb-24 text-[#0F0F10] sm:p-6 lg:p-10">
    <PartnerProgrammeSelector key={revision} kind="INFLUENCER" />
    <header className="mb-6 sm:mb-8 flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.18em] text-[#8C6D28] font-semibold">{programmeDefinitions.INFLUENCER.title}</p><h1 className="mt-1 sm:mt-2 font-heading text-xl sm:text-3xl font-semibold">Influencer / Ambassador</h1><p className="mt-1.5 text-xs sm:text-sm text-[#6B7280]">Your campaigns, brand activities and reviewed deliverables.</p></div>
      <div className="hidden md:flex gap-4"><button type="button" disabled={loading || busy} onClick={refresh} className="min-h-11 text-sm underline cursor-pointer">Refresh workspace</button><button type="button" onClick={() => navigateTo('home')} className="min-h-11 text-sm underline cursor-pointer">Storefront</button></div>
    </header>
    {workspace?.canOperate && <nav aria-label="Ambassador workspace" className="mb-5 sm:mb-6 flex gap-1.5 overflow-x-auto no-scrollbar border-b border-[#EAE5DC] pb-3">{['overview', 'campaigns', 'submissions', 'earnings', 'resources', 'support'].map(item => <button key={item} type="button" aria-current={view === item ? 'page' : undefined} onClick={() => setView(item)} className={`h-9 sm:min-h-11 shrink-0 rounded-full px-4 sm:px-5 text-xs sm:text-sm font-medium capitalize transition-colors cursor-pointer ${view === item ? 'bg-[#111111] text-white shadow-sm' : 'bg-white border border-[#E7E1D6] text-[#5C5850]'}`}>{item}</button>)}</nav>}
    {(!workspace?.canOperate || view === 'resources') && (
      view === 'resources' ? <ProgrammeTerms kind="INFLUENCER" /> : (
        <details className="mb-5 rounded-2xl border border-[#E7E1D6] bg-white p-4">
          <summary className="text-xs font-semibold text-[#111111] cursor-pointer select-none">Programme terms &amp; commission guidelines</summary>
          <div className="mt-3"><ProgrammeTerms kind="INFLUENCER" /></div>
        </details>
      )
    )}
    {workspace?.canOperate && view === 'overview' && <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4" aria-label="Programme overview">{[['Assigned activities', workspace.tasks.length], ['Submitted deliverables', workspace.submissions.length], ['Awaiting review', workspace.submissions.filter(item => item.status === 'SUBMITTED').length]].map(([label, value]) => <div key={label} className="rounded-2xl border border-[#EAE5DC] bg-white p-4 sm:p-5"><p className="text-xs sm:text-sm text-[#6B7280]">{label}</p><p className="mt-1.5 text-2xl sm:text-3xl font-semibold tabular-nums">{value}</p></div>)}</section>}
    {workspace?.canOperate && view === 'submissions' && <section className="mb-6 space-y-4"><h2 className="font-heading text-2xl">Your submissions</h2>{!workspace.submissions.length && <p className="text-sm text-[#6B7280]">Submit an assigned campaign to see its review here.</p>}{workspace.submissions.map(item => <article key={item.id} className="space-y-2 rounded-2xl border p-5"><h3 className="font-heading">{item.title}</h3><p className="text-sm">{item.status.replaceAll('_', ' ').toLowerCase()}</p><p className="text-sm">{item.body}</p>{item.reviewNote && <p className="rounded-xl bg-[#FBF5E8] p-3 text-sm">Admin review: {item.reviewNote}</p>}<a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm underline">View deliverable</a></article>)}</section>}
    {workspace?.canOperate && view === 'support' && <section className="mb-6 space-y-3 rounded-2xl border p-6"><h2 className="font-heading text-2xl">Programme support</h2><p className="text-sm text-[#6B7280]">Contact the Desla team about briefs, review notes, agreements or payout questions. Include your programme reference: {workspace.membership?.id}.</p><a className="inline-block min-h-11 text-sm underline" href="https://wa.me/2348148120642" target="_blank" rel="noopener noreferrer">Contact programme support</a></section>}
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
      {workspace.canOperate && ['overview', 'earnings'].includes(view) && workspace.earnings && <section className="mb-6 space-y-3 rounded-2xl border border-[#E5E7EB] p-5" aria-label="Referral performance and earnings"><h2 className="text-xl font-medium">Referral earnings</h2><p className="text-sm">Your commission: {workspace.earnings.commissionBps/100}%</p><p className="break-all text-sm">Partner code: <strong>{workspace.earnings.code}</strong></p><a className="break-all text-sm underline" href={'/catalogue?ref='+encodeURIComponent(workspace.earnings.code)}>Open your referral link</a><p className="text-sm">Pending: {(workspace.earnings.wallet.pendingKobo/100).toLocaleString('en-NG',{style:'currency',currency:'NGN'})} - Available: {(workspace.earnings.wallet.availableKobo/100).toLocaleString('en-NG',{style:'currency',currency:'NGN'})}</p><p className="text-xs text-[#6B7280]">Verified paid sales earn pending commission. Delivery, the hold period and any refunds determine cleared earnings. Bank payments require payout review.</p></section>}
      {workspace.canOperate && ['overview', 'campaigns'].includes(view) && <section className="space-y-5" aria-label="Influencer and ambassador assignments">
        <div><h2 className="font-heading text-2xl font-semibold">Campaigns & brand activities</h2><p className="mt-2 text-sm text-[#6B7280]">Complete the briefs assigned to you and submit a published link for administrator review. Compensation follows your signed programme terms.</p></div>
        {!workspace.tasks.length && <p className="rounded-2xl border border-[#E5E7EB] p-6 text-sm text-[#6B7280]">No activities have been assigned yet. New campaign and ambassador briefs will appear here.</p>}
        {workspace.tasks.map(task => {
          const submission = workspace.submissions.find(item => item.parentId === task.id);
          const delivery = deliveries[task.id] || { url: '', note: '' };
          return <article key={task.id} className="space-y-4 rounded-2xl border border-[#E5E7EB] p-5 sm:p-7">
            <div className="flex flex-wrap justify-between gap-2"><h3 className="text-lg font-medium">{task.title}</h3><span className="text-xs uppercase text-[#6B7280]">{task.status.replaceAll('_', ' ').toLowerCase()}</span></div>
            <p className="whitespace-pre-wrap text-sm">{task.body}</p>
            {task.reviewNote && <p className="text-sm text-[#6B7280]">Review: {task.reviewNote}</p>}
            {submission && <div className="space-y-2 text-sm"><a className="underline" href={submission.url} target="_blank" rel="noopener noreferrer">Open your submitted deliverable</a><p>{submission.body}</p><p>Review status: {submission.status.toLowerCase()}</p>{submission.reviewNote && <p className="rounded-xl bg-[#FBF5E8] p-3">Admin review: {submission.reviewNote}</p>}</div>}
            {['ASSIGNED', 'CHANGES_REQUESTED'].includes(task.status) && <form onSubmit={event => { event.preventDefault(); void command({ action: 'submit', taskId: task.id, version: task.version, ...delivery }); }} className="max-w-2xl space-y-3">
              <label className="block space-y-1 text-sm">Published deliverable URL<input className={partnerInput} type="url" required maxLength={1000} value={delivery.url} onChange={event => setDeliveries({ ...deliveries, [task.id]: { ...delivery, url: event.target.value } })} /></label>
              <label className="block space-y-1 text-sm">Delivery note<textarea className={partnerInput} required minLength={5} maxLength={3000} value={delivery.note} onChange={event => setDeliveries({ ...deliveries, [task.id]: { ...delivery, note: event.target.value } })} /></label>
              <button className={partnerButton} disabled={busy}>Submit for review</button>
            </form>}
          </article>;
        })}
      </section>}
    </>}
  </main>
  </div>;
}
