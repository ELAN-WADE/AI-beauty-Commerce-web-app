import React, { useEffect, useState } from 'react';
import { apiFetch, type AdminUserRow } from '../../lib/owned-api';
export function AdminAccessPanel() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const refresh = async () => { const result = await apiFetch<{users: AdminUserRow[]}>('/api/admin/users?limit=100'); setUsers(result.users); };
  useEffect(() => { void refresh().catch(error => setNotice(error.message)); }, []);
  async function change(userId: string, role: string, remove: boolean) {
    setBusy(true); setNotice('');
    try { await apiFetch(`/api/admin/users/${userId}/roles${remove ? `?role=${encodeURIComponent(role)}` : ''}`, { method: remove ? 'DELETE' : 'POST', ...(remove ? {} : { body: JSON.stringify({ role }) }) }); await refresh(); setNotice('Access updated. It will be checked on the next request.'); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Access update failed.'); }
    finally { setBusy(false); }
  }
  return <section className="rounded-3xl border bg-white p-5 space-y-4" aria-label="Staff access management">
    <h3 className="font-bold">Staff access management</h3>
    <p className="text-sm text-gray-600">Staff handles fulfilment; Inventory Manager handles stock; Support reads customer orders. Admin manages operations. Super Admin can grant roles.</p>
    {notice && <p role="status" className="text-sm">{notice}</p>}
    {users.map(user => <div key={user.id} className="border-t py-3 space-y-2">
      <p className="text-sm font-semibold">{user.email}</p>
      <div className="flex flex-wrap gap-2">{user.roles.map(role => <button disabled={busy} key={role} onClick={() => void change(user.id, role, true)} className="rounded-full border px-3 py-1 text-xs" title={`Revoke ${role}`}>{role} ×</button>)}</div>
      <div className="flex gap-2"><select aria-label={`Grant role to ${user.email}`} value={roles[user.id] || 'STAFF'} onChange={e => setRoles({...roles, [user.id]: e.target.value})} className="rounded-xl border px-3 py-2 text-sm">{['STAFF','INVENTORY_MANAGER','SUPPORT','ADMIN','SUPER_ADMIN'].map(role => <option key={role}>{role}</option>)}</select>
      <button disabled={busy} onClick={() => void change(user.id, roles[user.id] || 'STAFF', false)} className="rounded-full bg-black px-4 py-2 text-xs text-white">Grant role</button></div>
    </div>)}
  </section>;
}
