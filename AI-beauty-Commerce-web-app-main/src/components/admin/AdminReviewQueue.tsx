import React, { useState } from 'react';
export function AdminReviewQueue({ records, review }: { records: any[]; review: (id: string, status: string, note: string) => unknown }) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const pending = records.filter(r => r.ownerId && (['SUBMITTED', 'DELIVERABLE_SUBMITTED'].includes(r.status) || r.kind === 'PR_REQUEST' && ['APPROVED', 'DISPATCHED'].includes(r.status)));
  return <section className="rounded-3xl border bg-white p-5 space-y-4" aria-label="Partner review queue">
    <h3 className="font-bold">Partner review queue</h3>
    {!pending.length && <p className="text-sm text-gray-500">No partner requests awaiting review.</p>}
    {pending.map(record => <article key={record.id} className="rounded-2xl border p-4 space-y-3">
      <h4 className="font-semibold">{record.title}</h4><p className="text-xs">{record.kind} · {record.status}</p>
      <p className="text-sm whitespace-pre-wrap">{record.body}</p>
      {record.url && <a href={record.url} target="_blank" rel="noreferrer" className="text-sm underline">Open submission</a>}
      <input aria-label={`Review note for ${record.title}`} placeholder="Review note or actual courier tracking reference" value={notes[record.id] || ''} onChange={e => setNotes({ ...notes, [record.id]: e.target.value })} className="w-full rounded-xl border p-3 text-sm" />
      <div className="flex flex-wrap gap-2">{(record.kind === 'SUPPORT' ? ['RESOLVED'] : record.status === 'APPROVED' ? record.kind === 'PR_REQUEST' ? ['DISPATCHED'] : [] : record.status === 'DISPATCHED' ? ['DELIVERED'] : ['APPROVED', 'REJECTED']).map(status => <button key={status} disabled={(notes[record.id]?.trim().length || 0) < 3} onClick={() => void review(record.id, status, notes[record.id].trim())} className="rounded-full bg-black text-white px-4 py-2 text-xs disabled:opacity-40">{status}</button>)}</div>
    </article>)}
  </section>;
}
