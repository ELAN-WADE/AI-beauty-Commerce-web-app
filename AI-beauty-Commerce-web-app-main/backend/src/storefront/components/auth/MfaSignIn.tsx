import React, { useState } from 'react';
import type { AuthUser } from '../../lib/owned-api';

interface Props {
  user: AuthUser;
  request: <T>(path: string, init?: RequestInit) => Promise<T>;
  onComplete: (user: AuthUser) => Promise<void>;
}

/** Second-factor step inside the existing sign-in card. API permissions remain authoritative. */
export function MfaSignIn({ user, request, onComplete }: Props) {
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [secret, setSecret] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [verifiedUser, setVerifiedUser] = useState<AuthUser | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const enrolling = !user.mfaEnabled;
  const field = 'w-full px-4 py-3 rounded-xl border border-[#D1D5DB] bg-white text-sm text-[#0F0F10] focus:outline-none focus:border-[#0F0F10]';
  const button = 'w-full py-3.5 px-6 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-sm font-semibold shadow-md cursor-pointer disabled:opacity-60';

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      if (enrolling && !secret) {
        const result = await request<{ secret: string }>('/api/auth/mfa/setup', { method: 'POST', body: JSON.stringify({ password }) });
        setSecret(result.secret); setPassword('');
        return;
      }
      const result = await request<{ recoveryCodes?: string[] }>(`/api/auth/mfa/${enrolling ? 'confirm' : 'verify'}`, { method: 'POST', body: JSON.stringify({ code: code.trim() }) });
      const me = await request<AuthUser>('/api/auth/me');
      if (!me.mfaVerified) throw new Error('Your session could not be verified. Please try again.');
      setCode(''); setSecret('');
      if (result.recoveryCodes?.length) { setRecoveryCodes(result.recoveryCodes); setVerifiedUser(me); }
      else await onComplete(me);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Verification failed. Please try again.'); }
    finally { setBusy(false); }
  }

  return <div>
    <div className="text-center mb-6">
      <h1 className="text-2xl font-bold font-heading text-[#0F0F10] tracking-tight">{recoveryCodes.length ? 'Save Your Recovery Codes' : enrolling ? 'Set Up Administrator Verification' : 'Verify Administrator Sign-In'}</h1>
      <p className="text-xs text-[#6B7280] mt-2">{recoveryCodes.length ? 'Store these one-use codes somewhere safe. They let you sign in if you lose your authenticator.' : enrolling ? `Set up an authenticator for ${user.email}. No email is sent; the account syncing your authenticator app can be different.` : `Use the authenticator entry you created for ${user.email}. No email is sent; the account syncing your authenticator app can be different.`}</p>
    </div>
    {recoveryCodes.length && verifiedUser ? <div className="space-y-4">
      <div aria-label="Recovery codes" className="grid grid-cols-2 gap-2 rounded-xl bg-[#FAF9F6] p-4 text-xs font-mono">{recoveryCodes.map(value => <code key={value}>{value}</code>)}</div>
      <button type="button" disabled={busy} className={button} onClick={async () => {
        setBusy(true); setError('');
        try { await onComplete(verifiedUser); } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not continue.'); }
        finally { setBusy(false); }
      }}>I saved my codes — continue</button>
    </div> : <form className="space-y-4" onSubmit={submit}>
      {enrolling && !secret ? <label className="block text-xs font-medium text-[#4B5563]">Confirm your password
        <input className={`${field} mt-2`} type="password" autoComplete="current-password" required maxLength={128} value={password} onChange={event => setPassword(event.target.value)} />
      </label> : <>
        {secret && <div className="space-y-2 text-xs text-[#4B5563]">
          <p>Add a time-based account in Google Authenticator, Microsoft Authenticator, or another authenticator app using this setup key:</p>
          <code aria-label="Authenticator setup key" className="block break-all rounded-xl border border-[#E5E7EB] bg-[#FAF9F6] p-3 font-mono select-all">{secret}</code>
        </div>}
        <label className="block text-xs font-medium text-[#4B5563]">{enrolling ? 'Authenticator code' : 'Authenticator or recovery code'}
          <input className={`${field} mt-2 font-mono`} autoComplete="one-time-code" required maxLength={17} pattern={enrolling ? '[0-9]{6}' : '(?:[0-9]{6}|[a-zA-Z0-9]{8}-[a-zA-Z0-9]{8})'} value={code} onChange={event => setCode(event.target.value)} />
        </label>
      </>}
      <button type="submit" disabled={busy} className={button}>{busy ? 'Verifying…' : enrolling && !secret ? 'Set up authenticator' : 'Verify session'}</button>
    </form>}
    {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</p>}
  </div>;
}
