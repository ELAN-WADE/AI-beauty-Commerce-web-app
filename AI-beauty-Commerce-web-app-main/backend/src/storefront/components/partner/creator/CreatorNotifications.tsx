import React from 'react';
import { Bell } from 'lucide-react';
import { usePartnerRecords } from '../../../lib/use-partner-records';
export const CreatorNotifications: React.FC = () => {
  const { records, loading, error, refresh } = usePartnerRecords('CREATOR');
  const notifications = records.filter(record => (record.kind === 'ANNOUNCEMENT' && record.status === 'PUBLISHED') || (record.ownerId && ['APPROVED','REJECTED'].includes(record.status)));
  return <div className="space-y-6"><h1 className="font-heading text-2xl font-extrabold">Notifications</h1>{loading && <p role="status">Loading activity…</p>}{error && <p role="alert">{error} <button className="underline" onClick={() => void refresh()}>Retry</button></p>}{!loading && !error && !notifications.length && <p className="rounded-3xl border p-6 text-sm">No announcements or review updates yet.</p>}<div className="space-y-3">{notifications.map(record => <article key={record.id} className="rounded-2xl border bg-white p-5"><Bell size={18} /><h2 className="mt-2 font-bold">{record.title}</h2><p className="mt-2 whitespace-pre-wrap text-sm">{record.kind === 'ANNOUNCEMENT' ? record.body : record.reviewNote || record.status}</p><time className="mt-2 block text-xs text-[#71717A]">{new Date(record.updatedAt).toLocaleString()}</time></article>)}</div></div>;
};
