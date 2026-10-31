import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';
import { usePartnerRecords } from '../../../lib/use-partner-records';
export const CreatorResources: React.FC = () => {
  const { records, error, loading, refresh } = usePartnerRecords('CREATOR');
  const resources = records.filter(record => record.kind === 'RESOURCE' && record.status === 'PUBLISHED' && /^https:\/\//.test(record.url));
  return <div className="space-y-6"><div className="border-b border-[#E5E7EB] pb-2"><h1 className="font-heading text-2xl font-extrabold">Creator Resources</h1><p className="text-sm text-[#6B7280]">Resources published by the brand team.</p></div>
    {loading && <p role="status">Loading resources…</p>}{error && <p role="alert">{error} <button onClick={() => void refresh()} className="underline">Retry</button></p>}
    {!loading && !error && !resources.length && <p className="rounded-3xl border p-6 text-sm">No resources have been published yet.</p>}
    <div className="grid gap-4 md:grid-cols-2">{resources.map(resource => <article key={resource.id} className="flex flex-col justify-between rounded-3xl border border-[#E5E7EB] bg-white p-6"><div><FileText className="mb-3 text-[#997A2E]" /><h2 className="font-bold">{resource.title}</h2><p className="my-3 whitespace-pre-wrap text-sm text-[#6B7280]">{resource.body}</p></div><a href={resource.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold">Open resource <ExternalLink size={14} /></a></article>)}</div>
  </div>;
};
