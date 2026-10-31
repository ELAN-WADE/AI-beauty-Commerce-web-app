import React, { useState } from 'react';
import { usePartnerRecords } from '../../lib/use-partner-records';
import { writePartnerWorkspace } from '../../lib/owned-api';

export function PartnerKitRequests({ kind }: { kind: 'CREATOR' | 'DISTRIBUTOR' }) {
  const { records, loading, error, refresh } = usePartnerRecords(kind);
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState('');
  const [notice, setNotice] = useState('');
  const kits = records.filter(record => record.kind === 'PR_BOX' && !record.ownerId);
  const requests = records.filter(record => record.kind === 'PR_REQUEST' && record.ownerId);
  const request = async (kit: typeof records[number]) => {
    if (saving || address.trim().length < 10) { setNotice('Enter your delivery address and phone number before requesting a kit.'); return; }
    setSaving(kit.id); setNotice('');
    try {
      await writePartnerWorkspace({ action: 'apply', kind, publicationId: kit.id, title: kit.title, body: address.trim(), url: '', productIds: [] });
      setNotice('Your kit request was submitted for admin review.'); await refresh();
    } catch (error) { setNotice(error instanceof Error ? error.message : 'The request was not saved. Try again.'); }
    finally { setSaving(''); }
  };
  return <section aria-label="Partner PR kits" className="space-y-4 rounded-3xl border border-[#E5E7EB] bg-white p-5">
    <h2 className="font-heading text-xl font-bold">Partner PR kits</h2>
    {loading && <p role="status" className="text-sm">Loading published kits…</p>}
    {error && <p role="alert" className="text-sm text-rose-700">{error}<button onClick={() => void refresh()} className="ml-3 underline">Retry</button></p>}
    {!loading && !error && !kits.length && <p className="text-sm text-[#6B7280]">No PR kits are currently published for your workspace.</p>}
    {!!kits.length && <label className="block text-sm">Delivery address and phone<textarea aria-label="Kit delivery address and phone" value={address} onChange={event => setAddress(event.target.value)} maxLength={1000} className="mt-2 w-full rounded-xl border p-3" /></label>}
    {kits.map(kit => {
      const existing = requests.find(request => request.parentId === kit.id);
      const remaining = kit.data?.details?.spotsLeft;
      return <article key={kit.id} className="space-y-3 rounded-2xl border p-4"><h3 className="font-semibold">{kit.title}</h3><p className="whitespace-pre-wrap text-sm">{kit.body}</p>
        {typeof remaining === 'number' && <p className="text-xs">{remaining} allocations available</p>}
        {existing ? <p role="status" className="text-sm">Request status: {existing.status}{existing.reviewNote ? ' · ' + existing.reviewNote : ''}</p> : <button disabled={!!saving || remaining === 0} onClick={() => void request(kit)} className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving === kit.id ? 'Saving request…' : 'Request kit for review'}</button>}
      </article>;
    })}
    {notice && <p role="status" className="text-sm">{notice}</p>}
  </section>;
}

