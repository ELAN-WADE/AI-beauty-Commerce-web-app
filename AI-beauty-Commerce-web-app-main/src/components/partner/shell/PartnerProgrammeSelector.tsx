import React, { useEffect, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { apiFetch } from '../../../lib/owned-api';

import { isAdditionalProgramme, programmePath, type ProgrammeRole as Kind } from '../../../lib/partner-programmes';
type Programme = { kind: Kind; label: string; status: 'approved' | 'pending' | 'rejected' | 'unavailable' | 'not_applied' | 'agreement_required' };

/** Switches existing workspaces with the same identity; never grants a role. */
export function PartnerProgrammeSelector({ kind }: { kind: Kind }) {
  const { authUser, refreshAuth, navigateTo } = useApp();
  const owner = authUser?.id;
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{ owner: string; programmes: Programme[] } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!owner) return;
    const controller = new AbortController();
    let active = true;
    setError('');
    void apiFetch<{ programmes: Programme[] }>('/api/partner/programmes', { signal: controller.signal })
      .then(data => { if (active) setResult({ owner, programmes: data.programmes }); })
      .catch(() => { if (active) { setResult(null); setError('Could not load your programmes.'); } });
    return () => { active = false; controller.abort(); };
  }, [owner, revision]);
  useEffect(() => {
    const refresh = () => setRevision(value => value + 1);
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);
  if (!owner) return null;
  const programmes = result?.owner === owner ? result.programmes : [];
  const approved = programmes.filter(programme => programme.status === 'approved');
  const current = approved.find(programme => programme.kind === kind);
  const others = programmes.filter(programme => programme.kind !== kind && programme.status !== 'approved');
  const open = async (target: Kind) => {
    if (busy) return;
    setBusy(true);
    try {
      await refreshAuth();
      if (isAdditionalProgramme(target)) window.location.assign(programmePath(target));
      else navigateTo(target === 'CREATOR' ? 'creators' : 'distributor-portal');
    } catch { setError('Could not refresh your access. Please try again.'); }
    finally { setBusy(false); }
  };
  return <nav aria-label="Partner programmes" className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
    <label className="flex min-w-0 items-center gap-2">
      <span className="text-xs text-[#6B7280]">Programme</span>
      <select aria-label="Current partner programme" value={current ? kind : ''}
        disabled={busy || approved.length === 0} onChange={event => void open(event.target.value as Kind)}
        className="min-h-11 max-w-full rounded-xl border border-[#E5E7EB] bg-white px-3 text-base sm:text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#997A2E] disabled:opacity-60">
        {!current && <option value="">{error ? 'Programmes unavailable' : programmes.length ? 'Access not approved' : 'Loading programmes...'}</option>}
        {approved.map(programme => <option key={programme.kind} value={programme.kind}>{programme.label}</option>)}
      </select>
    </label>
    {others.map(other => <button key={other.kind} type="button" disabled={busy} onClick={() => void open(other.kind)}
      className="min-h-11 text-xs text-[#6B7280] underline underline-offset-4 hover:text-[#0F0F10] disabled:opacity-60">
      {other.status === 'not_applied' ? `Apply for ${other.label}` : other.status === 'pending' ? `${other.label} application pending` : other.status === 'agreement_required' ? `Accept ${other.label} agreement` : `Review ${other.label} application`}
    </button>)}
    {busy && <span role="status" className="text-xs text-[#6B7280]">Opening programme...</span>}
    {error && <span role="alert" className="text-xs text-rose-700">{error} <button type="button" onClick={() => setRevision(value => value + 1)} className="min-h-11 underline">Retry</button></span>}
  </nav>;
}
