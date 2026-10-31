import React, { useState, useEffect } from 'react';
import {
  Video,
  Search,
  Plus,
  Eye,
  ShoppingBag,
  MoreVertical,
  Edit2,
  Copy,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Check,
  X
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { fetchPartnerWorkspace, writePartnerWorkspace } from '../../../lib/owned-api';
import { FilterTabs } from '../shared/FilterTabs';
import { StatusBadge } from '../shared/StatusBadge';
import { EmptyStateCard } from '../shared/EmptyStateCard';

export interface CreatorContentLibraryProps {
  onOpenCreate: () => void;
}

export const CreatorContentLibrary: React.FC<CreatorContentLibraryProps> = ({
  onOpenCreate
}) => {
  const { isLiveBackend } = useApp();
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(isLiveBackend);
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'drafts' | 'pending-review'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [contentItems, setContentItems] = useState<any[]>([]);

  useEffect(() => {
    if (!isLiveBackend && !process.env.NEXT_PUBLIC_API_URL) return;
    let cancelled = false;
    fetchPartnerWorkspace('CREATOR').then(data => {
      if (cancelled) return;
      setContentItems(data.records.filter((r: any) => r.kind === 'CONTENT' && r.status !== 'ARCHIVED').map((r: any) => ({ record: r, id: r.id, title: r.title, type: 'Creator content', status: r.status === 'APPROVED' ? 'published' : r.status === 'DRAFT' || r.status === 'REJECTED' ? 'draft' : 'pending-review', views: '—', orders: '—', commission: '—', lastEdited: `${r.status} · ${new Date(r.updatedAt).toLocaleDateString()}${r.reviewNote ? ` · Review: ${r.reviewNote}` : ''}`, thumbnail: '', shareUrl: r.data?.communityPostId ? `${window.location.origin}/?screen=community` : '' })));
    }).catch(error => { if (!cancelled) { setContentItems([]); setToastMessage(error.message); } }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isLiveBackend, revision]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyLink = (id: string, url: string) => {
    if (!url) { showToast('This content is awaiting publication.'); return; }
    navigator.clipboard?.writeText(url);
    setCopiedId(id);
    showToast('Direct shoppable routine link copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteItem = async (id: string, title: string) => {
    if (isLiveBackend) {
      const record = contentItems.find(item => item.id === id)?.record;
      if (!record || !['DRAFT', 'REJECTED'].includes(record.status)) { showToast('Only drafts or rejected content can be archived.'); return; }
      try { await writePartnerWorkspace({ action: 'archive', kind: 'CREATOR', id, version: record.version }); setRevision(value => value + 1); showToast('Draft archived.'); }
      catch (error) { showToast(error instanceof Error ? error.message : 'Could not archive draft.'); }
      return;
    }
    setContentItems((prev) => prev.filter((it) => it.id !== id));
    showToast(`"${title}" archived from content library.`);
  };

  const filteredItems = contentItems.filter((item) => {
    if (activeTab === 'published' && item.status !== 'published') return false;
    if (activeTab === 'drafts' && item.status !== 'draft') return false;
    if (activeTab === 'pending-review' && item.status !== 'pending-review') return false;
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (loading) return <p role="status">Loading your content library…</p>;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {editing && <section role="dialog" aria-label="Edit content draft" className="rounded-3xl border border-[#E5E7EB] bg-white p-6 space-y-4">
        <h2 className="font-bold">Edit content draft</h2>
        <label className="block">Title<input aria-label="Draft title" className="block w-full border rounded-xl p-3" value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} /></label>
        <label className="block">Content<textarea aria-label="Draft content" className="block w-full border rounded-xl p-3" rows={6} value={editing.body} onChange={e => setEditing({ ...editing, body: e.target.value })} /></label>
        <label className="block">Hosted media URL<input aria-label="Draft media URL" type="url" className="block w-full border rounded-xl p-3" value={editing.url} onChange={e => setEditing({ ...editing, url: e.target.value })} /></label>
        {editing.reviewNote && <p>Review: {editing.reviewNote}</p>}
        <div className="flex gap-4">{(['DRAFT', 'SUBMITTED'] as const).map(status => <button key={status} disabled={saving} className="rounded-xl bg-[#0F0F10] text-white px-4 py-3 disabled:opacity-50" onClick={async () => {
          setSaving(true);
          try { await writePartnerWorkspace({ action: 'save', kind: 'CREATOR', type: 'CONTENT', id: editing.id, version: editing.version, status, title: editing.title, body: editing.body, url: editing.url, productIds: editing.data?.productIds || [] }); setEditing(null); setRevision(value => value + 1); showToast(status === 'DRAFT' ? 'Draft updated.' : 'Content submitted for review.'); }
          catch (error) { showToast(error instanceof Error ? error.message : 'Could not save draft.'); }
          finally { setSaving(false); }
        }}>{status === 'DRAFT' ? 'Save changes' : 'Submit for review'}</button>)}<button disabled={saving} onClick={() => setEditing(null)}>Cancel</button></div>
      </section>}
      {/* Toast */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-[#0F0F10] text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-between shadow-lg animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2.5 text-xs font-mono">
            <CheckCircle2 size={16} />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-white/60 hover:text-white cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
            Content Management
          </span>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10]">
            My Content Library
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
            Manage your published regimens, video reels, reviews, and drafts.
          </p>
        </div>

        <button
          onClick={onOpenCreate}
          className="px-5 py-2.5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-bold shadow-xs active:scale-[0.97] transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus size={14} className="text-[#D4AF37]" />
          <span>Author New Routine</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-3 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search routines, reviews, or natural topics…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-[#E5E7EB] bg-white text-xs placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#D4AF37]"
          />
        </div>
        <FilterTabs
          tabs={[
            { id: 'all', label: 'All Items', count: contentItems.length },
            { id: 'published', label: 'Published', count: contentItems.filter((i) => i.status === 'published').length },
            { id: 'drafts', label: 'Drafts', count: contentItems.filter((i) => i.status === 'draft').length },
            { id: 'pending-review', label: 'Awaiting review', count: contentItems.filter((i) => i.status === 'pending-review').length }
          ]}
          activeTab={activeTab}
          onChange={(t) => setActiveTab(t as typeof activeTab)}
        />
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <EmptyStateCard
          icon={<Video size={24} />}
          title="No content matching this view"
          description="Try selecting a different filter tab or create a new routine to publish."
          actionLabel="Create Routine in Studio"
          onAction={onOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className="rounded-3xl border border-[#E5E7EB] bg-white overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-44 w-full bg-[#FAF9F6] overflow-hidden">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <StatusBadge status={item.status} variant="minimal" />
                  </div>
                  <div className="absolute top-3 right-3 bg-[#0F0F10]/80 backdrop-blur-md px-2.5 py-0.5 rounded-full text-white text-[10px] font-mono">
                    {item.type}
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <h3 className="font-heading font-bold text-base text-[#0F0F10] line-clamp-2">
                    {item.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-[#6B7280]">
                    <span className="flex items-center gap-1 font-mono">
                      <Eye size={13} />
                      <span>{item.views} views</span>
                    </span>
                    <span className="font-mono text-[11px] text-[#9CA3AF]">
                      {item.lastEdited}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-1.5 text-[#0F0F10] font-bold">
                      <ShoppingBag size={13} className="text-[#997A2E]" />
                      <span>{item.orders} orders</span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-[#0F0F10]">{item.commission}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 py-3 border-t border-[#E5E7EB] bg-[#FAF9F6]/50 flex items-center justify-between">
                <button
                  onClick={isLiveBackend ? () => ['DRAFT', 'REJECTED'].includes(item.record.status) ? setEditing({ ...item.record }) : showToast('Submitted content is locked while it is reviewed.') : onOpenCreate}
                  className="text-xs font-bold text-[#0F0F10] hover:text-[#997A2E] flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 size={12} />
                  <span>Edit in Studio</span>
                </button>
                <div className="flex items-center gap-1 text-[#6B7280]">
                  <button
                    onClick={() => handleCopyLink(item.id, item.shareUrl)}
                    className="p-1.5 rounded-full hover:bg-white text-[#4B5563] cursor-pointer"
                    title="Copy share link"
                  >
                    {copiedId === item.id ? (
                      <Check size={13} className="text-emerald-600" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id, item.title)}
                    className="p-1.5 rounded-full hover:bg-white text-rose-600 cursor-pointer"
                    title="Archive item"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
