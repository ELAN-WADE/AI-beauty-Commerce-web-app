import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { apiFetch } from '../../lib/owned-api';

export function AdminSignIn() {
  const { refreshAuth, loginWithGoogle, authError } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError('');
    try {
      await apiFetch('/api/auth/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      setPassword(''); await refreshAuth();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Administrator sign-in failed.'); }
    finally { setBusy(false); }
  };
  const googleSignIn = async () => {
    if (busy) return; setBusy(true); setError('');
    try { await loginWithGoogle(window.location.origin + window.location.pathname, 'ADMIN'); }
    finally { setBusy(false); }
  };
  return <div className="min-h-screen bg-[#FAF9F6] p-6 flex items-center justify-center">
    <section className="w-full max-w-md space-y-5 rounded-3xl border border-[#E5E7EB] bg-white p-8">
      <p className="text-xs uppercase tracking-widest text-[#997A2E]">Desla! Operations</p>
      <h1 className="text-2xl font-bold">Administrator sign in</h1>
      <p className="text-sm text-[#6B7280]">Use your configured administrator account. Staff verification is required before operations open.</p>
      {(error || authError) && <p role="alert" className="text-sm text-rose-700">{error || authError}</p>}
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm">Administrator email<input required type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} className="mt-1 w-full rounded-xl border p-3" /></label>
        <label className="block text-sm">Password<input required type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} className="mt-1 w-full rounded-xl border p-3" /></label>
        <button disabled={busy} className="w-full rounded-full bg-black p-3 text-white disabled:opacity-50">{busy ? 'Signing in…' : 'Sign in as administrator'}</button>
      </form>
      <button disabled={busy} onClick={() => void googleSignIn()} className="w-full rounded-full border p-3 text-sm disabled:opacity-50">Continue with administrator Google account</button>
      <a href="/" className="block text-center text-xs underline">Return to store</a>
    </section>
  </div>;
}
