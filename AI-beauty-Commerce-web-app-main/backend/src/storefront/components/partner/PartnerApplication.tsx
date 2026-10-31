import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import type { ApplicationReceipt } from '../../lib/owned-api';
import { apiFetch } from '../../lib/owned-api';
import { Sparkles, Store, CheckCircle2 } from 'lucide-react';

export const partnerInput = 'w-full min-w-0 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]';
export const partnerButton = 'inline-flex items-center justify-center min-h-11 rounded-full bg-[#0F0F10] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#997A2E] cursor-pointer hover:bg-[#27272A] transition-colors';
export const money = (kobo: number) => (kobo / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });

const GoogleMinimalButton: React.FC<{
  label?: string;
  onClick: () => void;
}> = ({ label = 'Continue with Google', onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full py-3.5 px-4 rounded-xl border border-[#E5E7EB] hover:border-[#0F0F10] bg-white hover:bg-[#FAF9F6] text-[#0F0F10] text-sm font-semibold flex items-center justify-center gap-3 shadow-2xs hover:shadow-xs active:scale-[0.99] transition-all duration-150 cursor-pointer"
  >
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
    </svg>
    <span className="text-sm font-semibold text-[#0F0F10] tracking-tight">
      {label}
    </span>
  </button>
);

export const PartnerApplication: React.FC<{ kind: 'DISTRIBUTOR' | 'CREATOR' }> = ({ kind }) => {
  const { authUser, isLiveBackend, registerCreator, registerDistributor, selectedCity, loginWithGoogle, refreshAuth } = useApp();
  const [form, setForm] = useState({ name: authUser?.profile?.displayName || '', businessName: '', city: selectedCity, state: '', address: '', phone: authUser?.profile?.phone || '', handle: '', niche: '', platform: 'Instagram' as 'Instagram' | 'TikTok' | 'YouTube' });
  useEffect(() => { setForm(current => ({ ...current, name: current.name || authUser?.profile?.displayName || '', phone: current.phone || authUser?.profile?.phone || '' })); }, [authUser?.id]);
  const [receipt, setReceipt] = useState<ApplicationReceipt | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const loadStatus = useCallback(async () => {
    if (!authUser) return;
    setChecking(true);
    try {
      const { application } = await apiFetch<{ application: ApplicationReceipt | null }>(`/api/partner/application-status?kind=${kind}`);
      setReceipt(application); setError('');
      if (application?.status === 'approved') await refreshAuth();
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not load application status.'); }
    finally { setChecking(false); }
  }, [kind, authUser?.id, refreshAuth]);
  useEffect(() => {
    void loadStatus();
    const refresh = () => { void loadStatus(); };
    window.addEventListener('focus', refresh);
    const timer = window.setInterval(refresh, 30000);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [loadStatus]);

  const isDistributor = kind === 'DISTRIBUTOR';
  const roleLabel = isDistributor ? 'Distributor' : 'Creator';

  const handleInstantGoogleJoin = () => {
    const returnUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/${isDistributor ? 'distributor' : 'creators'}`
      : 'http://localhost:3000';
    loginWithGoogle(returnUrl, kind, authUser?.email);
  };

  const field = (name: Exclude<keyof typeof form, 'platform'>, label: string, type = 'text') => (
    <label className="block space-y-1.5 text-sm">
      <span>{label}</span>
      <input
        required={name !== 'businessName'}
        type={type}
        maxLength={name === 'address' ? 300 : 120}
        value={form[name]}
        onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
        className={partnerInput}
      />
    </label>
  );

  if (receipt && receipt.status !== 'rejected') {
    return (
      <section role="status" className="rounded-2xl border border-[#D4AF37]/40 bg-white p-6 space-y-3 max-w-xl">
        <div className="flex items-center gap-2 text-emerald-700">
          <CheckCircle2 size={20} />
          <h2 className="font-heading text-xl font-bold">{receipt.status === 'approved' ? 'Application Approved' : 'Application Received'}</h2>
        </div>
        <p className="text-sm text-[#6B7280]">
          {receipt.status === 'approved' ? 'Your account has been approved. Refresh your access to open the workspace.' : `Your ${roleLabel.toLowerCase()} application is waiting for administrator review.`}
        </p>
        <p className="text-xs font-mono bg-[#FAF9F6] p-2.5 rounded-lg border border-[#E5E7EB] break-all">
          Reference ID: {receipt.id}
        </p>
        {receipt.reviewNote && <p className="text-sm">Review note: {receipt.reviewNote}</p>}
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        <button type="button" disabled={checking} onClick={() => void loadStatus()} className={partnerButton}>{checking ? 'Checking…' : 'Check application status'}</button>
      </section>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {receipt?.status === 'rejected' && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">Your previous application was declined. {receipt.reviewNote || 'Update your details and submit a new application.'}</p>}
      {/* 1. Fast Track Instant Onboarding via Google OAuth */}
      {!authUser && <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 sm:p-7 space-y-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-[#997A2E] flex items-center justify-center">
            {isDistributor ? <Store size={20} /> : <Sparkles size={20} />}
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-[#0F0F10]">
              Sign in to apply as a {roleLabel}
            </h2>
            <p className="text-xs text-[#6B7280]">
              Use your Google account, then submit your details for partner review.
            </p>
          </div>
        </div>

        <GoogleMinimalButton
          label={`Continue with Google to Join as ${roleLabel}`}
          onClick={handleInstantGoogleJoin}
        />
      </section>}

      {/* Divider */}
      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-[#E5E7EB]" />
        <span className="flex-shrink mx-4 text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">
          Or Submit Detailed Application
        </span>
        <div className="flex-grow border-t border-[#E5E7EB]" />
      </div>

      {/* 2. Traditional Form Application */}
      <form
        onSubmit={async e => {
          e.preventDefault();
          if (!authUser?.emailVerified) { setError('Sign in with a verified email before submitting your application.'); return; }
          setBusy(true);
          setError('');
          try {
            const result = isDistributor
              ? await registerDistributor({
                  name: form.name,
                  businessName: form.businessName,
                  city: form.city,
                  state: form.state,
                  address: form.address,
                  phone: form.phone,
                  whatsapp: form.phone.replace(/\D/g, '')
                })
              : await registerCreator({
                  name: form.name,
                  handle: form.handle,
                  niche: form.niche,
                  platform: form.platform
                });
            setReceipt(result);
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not submit application.');
          } finally {
            setBusy(false);
          }
        }}
        className="rounded-2xl border border-[#E5E7EB] bg-white p-5 sm:p-7 space-y-5 shadow-xs"
      >
        <div>
          <h3 className="font-heading text-base font-bold text-[#0F0F10]">
            Manual {roleLabel} Review Form
          </h3>
          <p className="mt-1 text-xs text-[#6B7280]">
            Provide your business credentials. We review applications linked to {authUser?.email ?? 'your account'}.
          </p>
        </div>

        <fieldset disabled={busy || !authUser?.emailVerified} className="grid gap-4 sm:grid-cols-2">
          {field('name', 'Full name')}
          {isDistributor ? (
            <>
              {field('businessName', 'Business name (optional)')}
              {field('city', 'City')}
              {field('state', 'State')}
              {field('address', 'Business address')}
              {field('phone', 'Phone', 'tel')}
            </>
          ) : (
            <>
              {field('handle', 'Social handle (e.g. @glowbyzara)')}
              {field('niche', 'Content focus (e.g. Natural skincare)')}
              <label className="space-y-1.5 text-sm">
                <span>Primary Platform</span>
                <select
                  value={form.platform}
                  onChange={e => setForm(f => ({ ...f, platform: e.target.value as typeof f.platform }))}
                  className={partnerInput}
                >
                  {['Instagram', 'TikTok', 'YouTube'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>
            </>
          )}
        </fieldset>

        {error && <p role="alert" className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200">{error}</p>}

        <div className="flex items-center justify-between pt-2">
          <button
            type="submit"
            disabled={busy || !isLiveBackend || !authUser?.emailVerified}
            className={partnerButton}
          >
            {busy ? 'Submitting…' : 'Submit Manual Application'}
          </button>
        </div>
      </form>
    </div>
  );
};
