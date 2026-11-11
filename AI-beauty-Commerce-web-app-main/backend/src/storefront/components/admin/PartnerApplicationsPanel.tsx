import { ProgrammeApplicationsPanel } from './ProgrammeApplicationsPanel';
import React, { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../../lib/owned-api';

type Kind = 'creators' | 'distributors';
type Status = 'pending' | 'approved' | 'rejected';
type Application = {
  id: string; kind: Kind; userId: string | null; name: string; email: string | null;
  status: Status; createdAt: string; reviewNote: string; emailVerifiedAt: string | null;
  handle?: string; platform?: string; niche?: string; businessName?: string;
  city?: string; state?: string; address?: string; phone?: string;
};
export type ApplicationCounts = Record<Status, number>;
export type ApplicationQueue = { applications: Application[]; counts: ApplicationCounts };
const input = 'w-full rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm';

const getSuggestedCode = (r: Application) => {
  const base = (r.handle || r.name || 'GLOW').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8) || 'CREATOR';
  return `${base}10`;
};

export const PartnerApplicationsPanel: React.FC<{ onReviewed: () => void }> = ({ onReviewed }) => {
  const [kind, setKind] = useState<'all' | Kind>('all');
  const [status, setStatus] = useState<Status>('pending');
  const [rows, setRows] = useState<Application[]>([]);
  const [counts, setCounts] = useState({ creators: 0, distributors: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [codes, setCodes] = useState<Record<string, string>>({});
  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [creators, distributors] = await Promise.all([
        apiFetch<ApplicationQueue>(`/api/admin/creators?status=${status}`),
        apiFetch<ApplicationQueue>(`/api/admin/distributors?status=${status}`),
      ]);
      setRows([...creators.applications.map(row => ({ ...row, kind: 'creators' as const })), ...distributors.applications.map(row => ({ ...row, kind: 'distributors' as const }))].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setCounts({ creators: creators.counts.pending, distributors: distributors.counts.pending });
    } catch (error) { setRows([]); setError(error instanceof Error ? error.message : 'Could not load applications.'); }
    finally { setLoading(false); }
  }, [status]);
  useEffect(() => { void refresh(); }, [refresh]);
  const review = async (row: Application, approve: boolean) => {
    if (!approve && !notes[row.id]?.trim()) { setError('Add a review note explaining the rejection.'); return; }
    setBusy(row.id); setError(''); setNotice('');
    const effectiveCode = (codes[row.id]?.trim() || getSuggestedCode(row)).toUpperCase();
    try {
      await apiFetch(`/api/admin/${row.kind}/applications/${row.id}/review`, {
        method: 'POST', body: JSON.stringify({ approve, note: notes[row.id]?.trim() || (approve ? 'Application approved.' : 'Application declined.'), ...(row.kind === 'creators' && approve ? { promoCode: effectiveCode, discountPercent: 10, commissionRate: 15 } : {}) }),
      });
      setNotice(`${row.name}'s ${row.kind === 'creators' ? 'creator' : 'distributor'} application ${approve ? 'approved' : 'rejected'}.`);
      await refresh(); onReviewed();
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not review this application.'); }
    finally { setBusy(null); }
  };
  const visible = rows.filter(row => kind === 'all' || row.kind === kind);
  return <section aria-label="Partner application reviews" className="space-y-5">
    <ProgrammeApplicationsPanel/>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="font-heading text-2xl font-bold">Partner Applications</h2><p className="mt-1 text-sm text-[#71717A]">Review account-linked creator and distributor requests. Approval grants partner access, provisions the segregated wallet ledger, and activates distributor locations.</p></div>
      <button type="button" disabled={loading || Boolean(busy)} onClick={() => void refresh()} className="rounded-full border px-4 py-2 text-sm cursor-pointer hover:bg-black/5">Refresh applications</button>
    </div>
    <p className="text-sm">Pending: {counts.creators} creator requests · {counts.distributors} distributor requests</p>
    <div className="flex flex-wrap gap-3">
      <label className="text-sm">Partner type<select aria-label="Application partner type" value={kind} onChange={event => setKind(event.target.value as typeof kind)} className={input}><option value="all">All partners</option><option value="creators">Creators</option><option value="distributors">Distributors</option></select></label>
      <label className="text-sm">Review status<select aria-label="Application review status" value={status} onChange={event => setStatus(event.target.value as Status)} className={input}>{(['pending', 'approved', 'rejected'] as const).map(value => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select></label>
    </div>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}
    {loading ? <p role="status">Loading applications…</p> : !error && !visible.length ? <p className="rounded-2xl border bg-white p-8 text-sm text-[#71717A]">No {status} applications. New submitted requests will appear here.</p> : visible.map(row => {
      const suggested = getSuggestedCode(row);
      const effectiveCode = codes[row.id]?.trim() || suggested;
      const canApprove = !busy && row.userId && row.emailVerifiedAt && (row.kind !== 'creators' || /^[A-Za-z0-9]{3,40}$/.test(effectiveCode));
      return (
        <article key={row.id} aria-label={`${row.name} ${row.kind === 'creators' ? 'creator' : 'distributor'} application`} className="space-y-4 rounded-2xl border border-[#EAE8E3] bg-white p-5 shadow-xs">
          <div className="flex flex-wrap justify-between gap-2"><div><h3 className="font-bold">{row.name}</h3><p className="text-sm text-[#6B7280]">{row.kind === 'creators' ? 'Creator' : 'Distributor'} · {row.email || 'No linked account'}</p></div><span className="text-xs uppercase font-mono px-2.5 py-1 rounded-full bg-[#FAF9F6] border border-[#E5E7EB]">{row.status}</span></div>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">{Object.entries(row.kind === 'creators' ? { Platform: row.platform, Handle: row.handle, Niche: row.niche } : { Business: row.businessName, City: row.city, State: row.state, Address: row.address, Phone: row.phone }).map(([label, value]) => <div key={label}><dt className="text-[#71717A] text-xs">{label}</dt><dd className="font-medium text-[#0F0F10]">{value || 'Not provided'}</dd></div>)}<div><dt className="text-[#71717A] text-xs">Submitted</dt><dd className="font-medium text-[#0F0F10]">{new Date(row.createdAt).toLocaleString()}</dd></div></dl>
          {row.status === 'pending' ? <>
            {!row.userId && <p className="text-sm text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200">This older request has no linked account. Ask the applicant to sign in and submit again before granting access.</p>}
            {row.kind === 'creators' && <label className="block text-sm">Creator promo code<input aria-label={`Promo code for ${row.name}`} className={input} value={codes[row.id] ?? ''} onChange={event => setCodes(current => ({ ...current, [row.id]: event.target.value.toUpperCase() }))} maxLength={40} placeholder={`Suggested: ${suggested}`} /></label>}
            <label className="block text-sm">Review note<textarea aria-label={`Review note for ${row.name}`} className={input} value={notes[row.id] ?? ''} onChange={event => setNotes(current => ({ ...current, [row.id]: event.target.value }))} maxLength={500} placeholder={row.kind === 'creators' ? 'e.g. Approved with 15% commission' : 'e.g. Hub location verified'} /></label>
            <div className="flex flex-wrap gap-3">
              <button type="button" disabled={!canApprove} onClick={() => void review(row, true)} className="rounded-full bg-[#0F0F10] px-5 py-2.5 text-sm text-white disabled:opacity-40 cursor-pointer hover:bg-[#27272A] transition-colors">Approve {row.kind === 'creators' ? `creator (${effectiveCode})` : 'distributor'}</button>
              <button type="button" disabled={Boolean(busy)} onClick={() => void review(row, false)} className="rounded-full border border-[#E5E7EB] bg-white px-5 py-2.5 text-sm text-rose-700 disabled:opacity-40 cursor-pointer hover:bg-rose-50 transition-colors">Reject application</button>
            </div>
          </> : <p className="text-sm text-[#6B7280]">Review note: {row.reviewNote || 'No note recorded.'}</p>}
        </article>
      );
    })}
  </section>;
};
