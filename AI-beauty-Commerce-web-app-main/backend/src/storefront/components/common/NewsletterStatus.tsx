'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/owned-api';

export default function NewsletterStatus() {
  const [action, setAction] = useState('confirm');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setAction(params.get('action') === 'unsubscribe' ? 'unsubscribe' : 'confirm');
    setToken(new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '');
    window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
  }, []);
  const submit = async () => {
    setBusy(true); setError('');
    try { await apiFetch(`/api/newsletter/${action}`, { method: 'POST', body: JSON.stringify({ token }) }); setDone(true); }
    catch (error) { setError(error instanceof Error ? error.message : 'Please try again.'); }
    finally { setBusy(false); }
  };
  return <main className="min-h-screen bg-[#FAF9F6] p-6 flex items-center justify-center"><section className="max-w-md w-full space-y-5 rounded-2xl border bg-white p-8 text-[#0F0F10]">
    <p className="text-xs uppercase tracking-widest">Desla! · The Formulation Journal</p>
    <h1 className="text-2xl font-semibold">{done ? action === 'confirm' ? 'Subscription confirmed' : 'You’re unsubscribed' : action === 'confirm' ? 'Confirm your invitation' : 'Unsubscribe from the Journal'}</h1>
    <p>{done ? action === 'confirm' ? 'You’re on the list. Your welcome email includes an unsubscribe link.' : 'You will no longer receive the Formulation Journal.' : action === 'confirm' ? 'Confirm that you want to receive product news and the Formulation Journal by email.' : 'Confirm below to stop receiving the Formulation Journal.'}</p>
    {!done && <button disabled={busy || !token} onClick={() => void submit()} className="rounded-full bg-black px-6 py-3 text-white disabled:opacity-50">{busy ? 'Updating…' : action === 'confirm' ? 'Confirm subscription' : 'Unsubscribe'}</button>}
    {!token && !done && <p role="alert">Open the complete link from your latest Journal email.</p>}
    {error && <p role="alert" className="text-rose-700">{error}</p>}
    <a href="/" className="block underline">Return to the shop</a>
  </section></main>;
}
