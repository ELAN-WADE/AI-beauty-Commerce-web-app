import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiFetch } from '../../lib/owned-api';
import { DeslaAuthShell } from './DeslaAuthShell';

export function AdminSignIn() {
  const { refreshAuth, loginWithGoogle, authError } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await apiFetch('/api/auth/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      setPassword('');
      await refreshAuth();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Administrator sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  const googleSignIn = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await loginWithGoogle(window.location.origin + window.location.pathname, 'ADMIN');
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    'mt-1 w-full h-11 px-3.5 rounded-[10px] border border-[#DDD7CC] hover:border-[#C5BDB0] bg-white/90 focus:bg-white text-sm text-[#111111] placeholder:text-[#9A948A] focus:outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#B89248]/25 transition-all [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#FFFFFF] [&:-webkit-autofill]:[-webkit-text-fill-color:#111111]';

  return (
    <DeslaAuthShell
      artworkSrc="/artwork/distributor-onboarding-editorial.webp"
      artworkAlt="Desla Beauty minimalist apothecary editorial interior"
      eyebrow="Desla Operations"
      headline="Welcome to Desla"
      subheadline="Executive operations console."
      supportingCopy="Restricted workspace for order governance, catalog stewardship, and partner approvals."
      showSkinScanFeature={true}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#B89248]">
            Desla! Operations
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#6E6A63] hover:text-[#111111] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Return to store</span>
          </a>
        </div>

        <div>
          <h1 className="text-2xl font-semibold font-heading text-[#111111] tracking-tight">
            Administrator sign in
          </h1>
          <p className="text-xs text-[#6E6A63] mt-1 leading-relaxed">
            Use your configured administrator account. Staff verification is required before operations open.
          </p>
        </div>

        {(error || authError) && (
          <p role="alert" className="px-3.5 py-2.5 rounded-[10px] bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error || authError}
          </p>
        )}

        <form onSubmit={submit} className="space-y-3.5">
          <div>
            <label htmlFor="admin-email-input" className="block text-xs font-medium text-[#4A4742]">
              Administrator email
            </label>
            <input
              id="admin-email-input"
              required
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="admin-password-input" className="block text-xs font-medium text-[#4A4742]">
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password-input"
                required
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={`${inputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 p-1 text-[#8E887F] hover:text-[#111111] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            disabled={busy}
            className="group w-full h-11 px-5 rounded-[10px] bg-[#111111] hover:bg-[#242426] text-white text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-55"
          >
            {busy ? (
              <>
                <LoaderCircle className="w-4 h-4 animate-spin text-[#E6C77A]" aria-hidden="true" />
                <span>Signing in…</span>
              </>
            ) : (
              <>
                <span>Sign in as administrator</span>
                <ArrowRight className="w-4 h-4 text-[#E6C77A] transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <button
          type="button"
          disabled={busy}
          onClick={() => void googleSignIn()}
          className="w-full h-11 px-4 rounded-[10px] border border-[#DDD7CC] hover:border-[#111111] bg-white/90 hover:bg-white text-sm font-medium text-[#111111] transition-all cursor-pointer disabled:opacity-50"
        >
          Continue with administrator Google account
        </button>
      </div>
    </DeslaAuthShell>
  );
}
