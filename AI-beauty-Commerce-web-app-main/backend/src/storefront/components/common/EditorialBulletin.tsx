import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/owned-api';

export function EditorialBulletin() {
  const [updates, setUpdates] = useState<{ id: string; title: string; body: string; url: string }[]>([]);
  useEffect(() => { let cancelled = false; apiFetch<{ updates: typeof updates }>('/api/editorial').then(data => { if (!cancelled) setUpdates(data.updates); }).catch(() => { /* Optional editorial content has no local fallback. */ }); return () => { cancelled = true; }; }, []);
  if (!updates.length) return null;
  return <section aria-label="Brand updates" className="mx-auto max-w-7xl space-y-5 border-t border-[#E5E7EB] px-6 py-10"><p className="text-xs uppercase tracking-widest text-[#997A2E]">From the Desla studio</p>{updates.map(update => <article key={update.id} className="max-w-3xl space-y-3"><h2 className="font-heading text-2xl font-bold">{update.title}</h2><p className="whitespace-pre-wrap text-sm text-[#6B7280]">{update.body}</p>{update.url && <a href={update.url} rel="noreferrer" target="_blank" className="text-sm underline">Read more</a>}</article>)}</section>;
}
