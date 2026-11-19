import React, { useState } from 'react';
import { apiFetch } from '../../lib/owned-api';
import { partnerTerms, PARTNER_TERMS_VERSION, type PartnerTermsKind } from '../../lib/partner-terms';

export function ProgrammeTerms({ kind }: { kind: PartnerTermsKind }) {
  const [checked, setChecked] = useState(false), [saved, setSaved] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  return <details className="rounded-2xl border border-[#E5E7EB] bg-[#FAF9F6] p-5 text-sm">
    <summary className="min-h-11 cursor-pointer font-semibold">Programme terms & draft contract</summary>
    <p className="my-3 text-xs text-[#6B7280]">Interim draft · {PARTNER_TERMS_VERSION}. Your final approved commercial terms are provided separately.</p>
    <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap font-body text-sm leading-relaxed" tabIndex={0}>{partnerTerms(kind)}</pre>
    <p className="my-3 text-sm">Programme policy: accurate applications, honest advertising and disclosed partnerships, respectful conduct, secure handling of customer information, and compliance with approved commercial terms. Accepting these application policies does not sign the draft commercial contract.</p>
    <label className="my-4 flex items-start gap-3"><input type="checkbox" checked={checked} disabled={saved} onChange={e => setChecked(e.target.checked)} /><span>I have read and accept the programme application terms and conduct/privacy policies.</span></label>
    <button type="button" disabled={!checked || saved || busy} className="min-h-11 rounded-full bg-[#263127] px-5 text-white disabled:opacity-50" onClick={async () => { setBusy(true); setError(''); try { await apiFetch('/api/partner/policy', { method: 'POST', body: JSON.stringify({ kind, version: PARTNER_TERMS_VERSION, accepted: true }) }); setSaved(true); } catch (e) { setError(e instanceof Error ? e.message : 'Could not save acceptance.'); } finally { setBusy(false); } }}>{saved ? 'Acceptance saved' : busy ? 'Saving…' : 'Accept programme policies'}</button>
    {error && <p role="alert" className="mt-3 text-rose-700">{error}</p>}
    {saved && <p role="status" className="mt-3">Your acceptance is saved to your account. You can now submit your application.</p>}
    <a className="mt-4 inline-block min-h-11 underline" download={`Desla-${kind.toLowerCase()}-draft-agreement.txt`} href={'data:text/plain;charset=utf-8,' + encodeURIComponent(partnerTerms(kind))}>Download draft agreement</a>
  </details>;
}
