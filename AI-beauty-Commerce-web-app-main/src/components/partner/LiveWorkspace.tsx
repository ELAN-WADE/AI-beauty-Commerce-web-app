import React, { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '../../lib/owned-api';
import { useApp } from '../../context/AppContext';
import { PartnerLivePanel } from './PartnerLivePanel';
import { WholesalePanel } from './WholesalePanel';

type RecordRow = { id: string; ownerId: string | null; kind: string; title: string; body: string; reviewNote?: string; url: string; status: string; version: number; updatedAt: string; data: { productIds?: string[] } };
const inputClass = 'w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#0F0F10]';
const buttonClass = 'rounded-xl bg-[#0F0F10] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50';
const labels: Record<string, string> = { overview: 'Workspace overview', create: 'Create content', content: 'Content library', campaigns: 'Campaigns', 'pr-room': 'PR room', storefront: 'Storefront', links: 'Referral links', earnings: 'Earnings', notifications: 'Activity', resources: 'Resources', support: 'Support', settings: 'Workspace settings', orders: 'Assigned orders', inventory: 'Inventory', restock: 'Restock', sales: 'Sales', territory: 'Territory', reports: 'Reports' };

export function LiveWorkspace({ kind, view, onNavigate }: { kind: 'CREATOR' | 'DISTRIBUTOR'; view: string; onNavigate: (view: string) => void }) {
  const { products, authUser, navigateTo, logout } = useApp();
  const [rows, setRows] = useState<RecordRow[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ title: '', body: '', url: '', productIds: [] as string[] });
  const [edit, setEdit] = useState<RecordRow | null>(null);
  const key = useRef('');
  const [profile, setProfile] = useState({ name: '', handle: '', address: '', phone: '', operatingHours: '' });
  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [workspace, data] = await Promise.all([apiFetch<{ records: RecordRow[] }>(`/api/partner/workspace?kind=${kind}`), apiFetch<any>(`/api/partner?kind=${kind}`)]);
      setRows(workspace.records); setDashboard(data);
      setProfile({ name: data.profile.name, handle: data.profile.handle ?? '', address: data.profile.address ?? '', phone: data.profile.phone ?? '', operatingHours: data.profile.operatingHours ?? '' });
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load workspace.'); setDashboard(null); }
    finally { setLoading(false); }
  }, [kind]);
  useEffect(() => { void refresh(); }, [refresh, authUser?.id]);
  useEffect(() => { setNotice(''); setEdit(null); setForm({ title: '', body: '', url: '', productIds: [] }); key.current = ''; }, [view]);
  const run = async (payload: Record<string, unknown>) => {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    key.current ||= crypto.randomUUID();
    try {
      await apiFetch('/api/partner/workspace', { method: 'POST', headers: { 'Idempotency-Key': key.current }, body: JSON.stringify({ ...payload, ...(payload.action === 'save' && edit ? { type: edit.kind } : {}), kind }) });
      key.current = ''; setNotice('Saved to your workspace.'); setEdit(null); setForm({ title: '', body: '', url: '', productIds: [] }); await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save. Your changes are still here.'); }
    finally { setBusy(false); }
  };
  const change = (field: string, value: unknown) => { key.current = ''; setForm(f => ({ ...f, [field]: value })); };
  const routes = kind === 'CREATOR' ? ['create', 'content', 'campaigns', 'pr-room', 'storefront', 'links', 'earnings', 'notifications', 'resources', 'support', 'settings'] : ['orders', 'inventory', 'restock', 'sales', 'earnings', 'territory', 'reports', 'support', 'settings'];
  const owned = rows.filter(r => r.ownerId === authUser?.id);
  const publicRows = rows.filter(r => !r.ownerId);
  const shown = view === 'content' ? owned.filter(r => r.kind === 'CONTENT') : view === 'campaigns' ? rows.filter(r => ['CAMPAIGN', 'CAMPAIGN_ENTRY'].includes(r.kind)) : view === 'pr-room' ? rows.filter(r => ['PR_BOX', 'PR_REQUEST'].includes(r.kind)) : view === 'resources' ? publicRows.filter(r => r.kind === 'RESOURCE') : view === 'support' ? owned.filter(r => r.kind === 'SUPPORT') : view === 'storefront' ? owned.filter(r => r.kind === 'STOREFRONT') : [...owned, ...publicRows.filter(r => r.kind === 'ANNOUNCEMENT')];
  const formView = ['create', 'support', 'storefront'].includes(view) || !!edit;
  const operations = ['overview', 'orders', 'inventory', 'sales', 'earnings', 'links', 'reports', 'territory'].includes(view);
  const exportReport = () => {
    const csv = ['Reference,Status,Total NGN', ...(dashboard?.orders ?? []).map((o: any) => `${o.orderNumber},${o.status},${o.totalKobo / 100}`)].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = 'assigned-orders.csv'; a.click(); URL.revokeObjectURL(url);
  };
  return <section className="space-y-6 font-body">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E7EB] pb-6"><div><p className="text-xs uppercase tracking-widest text-[#997A2E]">Desla · {kind.toLowerCase()} · live workspace</p><h1 className="mt-2 text-3xl font-heading font-bold">{labels[view] ?? view}</h1><p className="mt-1 text-sm text-[#6B7280]">{dashboard?.profile.name ?? authUser?.email}</p></div><div className="flex gap-3"><button onClick={() => navigateTo('home')} className="text-sm underline">Storefront</button><button onClick={() => void logout()} className="text-sm underline">Sign out</button><button disabled={loading || busy} onClick={() => void refresh()} className={buttonClass}>Refresh</button></div></header>
    <nav aria-label="Workspace pages" className="flex flex-wrap gap-2">{['overview', ...routes].map(route => <button key={route} aria-current={view === route ? 'page' : undefined} onClick={() => onNavigate(route)} className={`rounded-full border px-4 py-2 text-xs font-semibold ${view === route ? 'bg-[#0F0F10] text-white' : 'border-[#E5E7EB]'}`}>{labels[route]}</button>)}</nav>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}{notice && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}
    {loading ? <p role="status">Loading live workspace…</p> : !dashboard ? <p>Workspace data is unavailable. Refresh to retry.</p> : <>
      {view === 'overview' && <div className="grid gap-4 sm:grid-cols-3">{[['Submitted requests', owned.filter(r => r.status === 'SUBMITTED').length], ['Open opportunities', publicRows.filter(r => ['CAMPAIGN', 'PR_BOX'].includes(r.kind)).length], ['Orders', dashboard.metrics?.ordersCount ?? dashboard.orders?.length ?? 0]].map(([title, count]) => <div key={title} className="rounded-2xl bg-[#FAF9F6] p-6"><p className="text-xs text-[#6B7280]">{title}</p><strong className="mt-2 block text-3xl tabular-nums">{count}</strong></div>)}</div>}
      {view === 'settings' && <form className="max-w-xl space-y-4" onSubmit={e => { e.preventDefault(); void run({ action: 'profile', ...profile }); }}>{Object.entries(profile).filter(([field]) => kind === 'DISTRIBUTOR' || ['name', 'handle'].includes(field)).map(([field, value]) => <label key={field} className="block text-sm capitalize">{field}<input required={field === 'name'} maxLength={field === 'address' ? 300 : 120} className={`${inputClass} mt-2`} value={value} onChange={e => { key.current = ''; setProfile(p => ({ ...p, [field]: e.target.value })); }} /></label>)}<button disabled={busy} className={buttonClass}>Save settings</button></form>}
      {formView && <form className="max-w-2xl space-y-4 rounded-2xl border border-[#E5E7EB] p-5" onSubmit={e => { e.preventDefault(); void run({ action: 'save', type: view === 'support' ? 'SUPPORT' : view === 'storefront' ? 'STOREFRONT' : 'CONTENT', ...form, ...(edit ? { id: edit.id, version: edit.version } : {}), status: view === 'support' ? 'SUBMITTED' : 'DRAFT' }); }}><h2 className="text-xl font-bold">{edit ? 'Edit draft' : view === 'support' ? 'Open a support ticket' : view === 'storefront' ? 'Curate a product collection' : 'Write your next post'}</h2><label className="block text-sm">Title<input required minLength={2} maxLength={160} className={`${inputClass} mt-2`} value={form.title} onChange={e => change('title', e.target.value)} /></label><label className="block text-sm">Details<textarea required maxLength={5000} rows={5} className={`${inputClass} mt-2`} value={form.body} onChange={e => change('body', e.target.value)} /></label><label className="block text-sm">Reference / deliverable URL (optional)<input type="url" pattern="https://.*" maxLength={1000} className={`${inputClass} mt-2`} value={form.url} onChange={e => change('url', e.target.value)} /></label>{view !== 'support' && <label className="block text-sm">Tag catalogue products<select multiple className={`${inputClass} mt-2 min-h-28`} value={form.productIds} onChange={e => change('productIds', Array.from(e.target.selectedOptions, o => o.value))}>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}<div className="flex gap-3"><button disabled={busy} className={buttonClass}>{view === 'support' ? 'Send ticket' : 'Save draft'}</button>{view !== 'support' && <button type="button" disabled={busy || form.title.trim().length < 2 || !form.body.trim()} className={buttonClass} onClick={() => void run({ action: 'save', type: view === 'storefront' ? 'STOREFRONT' : 'CONTENT', ...form, ...(edit ? { id: edit.id, version: edit.version } : {}), status: 'SUBMITTED' })}>Submit for review</button>}</div></form>}
      {view === 'reports' && <button onClick={exportReport} className={buttonClass}>Download assigned orders CSV</button>}
      {view === 'storefront' && dashboard.profile.promoCode && <a className="inline-block text-sm underline" target="_blank" rel="noreferrer" href={`/?screen=creator-storefront&ref=${encodeURIComponent(dashboard.profile.promoCode)}`}>Open your approved public collection</a>}
      {shown.filter(row => row.reviewNote).map(row => <aside key={`note-${row.id}`} className="rounded-xl bg-[#FAF9F6] p-4 text-sm"><strong>{row.title} · {row.status}</strong><p>{row.reviewNote}</p></aside>)}
      {view === 'campaigns' && <label className="block text-sm">Deliverable URL<input type="url" pattern="https://.*" className={`${inputClass} mt-2`} value={form.url} onChange={e => change('url', e.target.value)} /></label>}
      {view === 'campaigns' && owned.filter(row => row.kind === 'CAMPAIGN_ENTRY' && ['APPROVED', 'REJECTED'].includes(row.status)).map(row => <button key={`deliver-${row.id}`} disabled={busy || !form.url.startsWith('https://')} className={buttonClass} onClick={() => void run({ action: 'deliver', id: row.id, version: row.version, url: form.url, body: form.body })}>Submit deliverable: {row.title}</button>)}
      {['campaigns', 'pr-room'].includes(view) && <label className="block text-sm">Application pitch / PR delivery details<textarea className={`${inputClass} mt-2`} rows={3} value={form.body} onChange={e => change('body', e.target.value)} /></label>}
      {view === 'territory' && <article className="rounded-2xl bg-[#FAF9F6] p-6"><h2 className="text-xl font-bold">{dashboard.location?.name}</h2><p>{dashboard.location?.address}</p><p>{dashboard.location?.city}, {dashboard.location?.state}</p><p>{dashboard.location?.operatingHours}</p><p>{dashboard.location?.isActive ? 'Active location' : 'Location awaiting activation'}</p></article>}
      {view === 'restock' && <WholesalePanel />}
      {operations && <PartnerLivePanel kind={kind} view={view} />}
      {!['settings', 'restock', 'orders', 'inventory', 'sales', 'earnings', 'links', 'reports', 'territory'].includes(view) && <div className="grid gap-4 md:grid-cols-2">{shown.length === 0 && <p className="text-sm text-[#6B7280]">No records yet. New work and updates will appear here.</p>}{shown.map(row => <article key={row.id} className="space-y-3 rounded-2xl border border-[#E5E7EB] p-5"><p className="text-xs uppercase tracking-wider text-[#997A2E]">{row.kind.replace(/_/g, ' ')} · {row.status}</p><h2 className="text-xl font-heading font-bold">{row.title}</h2><p className="whitespace-pre-wrap text-sm text-[#6B7280]">{row.body}</p><p className="text-xs text-[#6B7280]">Updated {new Date(row.updatedAt).toLocaleString()}</p>{row.url && <a href={row.url} target="_blank" rel="noreferrer" className="inline-block text-sm underline">Open reference</a>}{!row.ownerId && ['CAMPAIGN', 'PR_BOX'].includes(row.kind) && <button disabled={busy} className={buttonClass} onClick={() => void run({ action: 'apply', publicationId: row.id, title: row.title, body: form.body, url: form.url, productIds: [] })}>Apply / request</button>}{row.ownerId && ['DRAFT', 'REJECTED'].includes(row.status) && ['CONTENT', 'STOREFRONT'].includes(row.kind) && <button className={buttonClass} onClick={() => { setEdit(row); setForm({ title: row.title, body: row.body, url: row.url, productIds: row.data.productIds ?? [] }); key.current = ''; }}>Edit draft</button>}</article>)}</div>}
    </>}
  </section>;
}
