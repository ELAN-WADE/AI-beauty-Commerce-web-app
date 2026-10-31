import React, { useEffect, useState } from 'react';
import { ArrowLeft, Lock, Sparkles, Store, ShieldAlert, LogIn, ChevronRight, UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PartnerApplication } from '../partner/PartnerApplication';
import { getDesignPreviewPortal } from '../../lib/portal-preview';
import { isStaffAccount } from '../../lib/auth-flow';

import { AdminSignIn } from './AdminSignIn';
import { MfaSignIn } from './MfaSignIn';
import { apiFetch } from '../../lib/owned-api';

interface RequireRoleProps {
  allowedRoles: string[];
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const GoogleMinimalButton: React.FC<{
  label?: string;
  onClick: () => void;
  loading?: boolean;
}> = ({ label = 'Continue with Google', onClick, loading }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    className="w-full py-3.5 px-4 rounded-xl border border-[#E5E7EB] hover:border-[#0F0F10] bg-white hover:bg-[#FAF9F6] text-[#0F0F10] text-sm font-semibold flex items-center justify-center gap-3 shadow-2xs hover:shadow-xs active:scale-[0.99] transition-all duration-150 cursor-pointer disabled:opacity-60"
  >
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
    </svg>
    <span className="text-sm font-semibold text-[#0F0F10] tracking-tight">
      {loading ? 'Connecting with Google…' : label}
    </span>
  </button>
);

export const RequireRole: React.FC<RequireRoleProps> = ({
  allowedRoles,
  children,
  title,
  description,
}) => {
  const { authUser, authLoading, authError, refreshAuth, navigateTo, loginWithGoogle, previewRole, enterPreviewRole, logout } = useApp();
  const [connecting, setConnecting] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const staffOnly = !allowedRoles.includes('CREATOR') && !allowedRoles.includes('DISTRIBUTOR') && isStaffAccount(allowedRoles);
  const needsMfa = Boolean(authUser && staffOnly && isStaffAccount(authUser.roles) && !authUser.mfaVerified);
  const designPortal = mounted ? getDesignPreviewPortal() : null;
  if (!staffOnly && designPortal && allowedRoles.includes(designPortal)) {
    return <>
      <div role="note" className="bg-[#FAF9F6] border-b border-[#E5E7EB] px-4 py-2 text-center text-xs text-[#6B7280]">
        {designPortal.charAt(0) + designPortal.slice(1).toLowerCase()} design preview · No sign-in required · Empty layout · Live actions disabled
        <button className="ml-4 underline" onClick={() => { const url = new URL(window.location.href); url.searchParams.delete('preview'); window.location.assign(url.toString()); }}>Exit preview</button>
      </div>
      {children}
    </>;
  }

  if (staffOnly && !authUser && !authLoading) return <AdminSignIn />;

  if (needsMfa && authUser) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] p-6">
      <div className="w-full max-w-md rounded-3xl border bg-white p-8">
        <MfaSignIn key={authUser.id} user={authUser} request={apiFetch} onComplete={async () => { await refreshAuth(); }} />
      </div>
    </div>;
  }

  if (authLoading && !authUser) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#E5E7EB] border-t-[#D4AF37] animate-spin mb-4" />
        <p className="text-xs font-mono uppercase tracking-wider text-[#6B7280]">
          Verifying Natural RBAC Session…
        </p>
      </div>
    );
  }

  const userRoles = authUser?.roles || [];
  const hasRealAccess =
    staffOnly && userRoles.includes('SUPER_ADMIN') ||
    userRoles.some((role) => allowedRoles.includes(role));

  // If previewRole was explicitly chosen via dev tools
  const hasPreviewAccess = Boolean(
    false
  );

  if (hasRealAccess) {
    return <>{children}</>;
  }

  if (hasPreviewAccess) {
    return (
      <>
        <div className="sticky top-0 z-40 bg-[#0F0F10] text-white px-4 py-2 flex items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            <span>
              <strong className="text-[#D4AF37]">Developer Preview</strong> as {previewRole} — layout preview.
            </span>
          </div>
          <button
            onClick={() => navigateTo('home')}
            className="shrink-0 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium cursor-pointer transition-colors"
          >
            Return to Storefront
          </button>
        </div>
        {children}
      </>
    );
  }

  // Determine portal kind
  const isCreator = allowedRoles.includes('CREATOR');
  const isDistributor = allowedRoles.includes('DISTRIBUTOR');
  const isAdmin = !isCreator && !isDistributor && (allowedRoles.includes('ADMIN') || allowedRoles.includes('SUPER_ADMIN'));

  const portalBadge = isCreator
    ? 'Desla! Creator Collective'
    : isDistributor
    ? 'Desla! Distributor Network'
    : 'Executive RBAC Security';

  const portalTitle = title || (
    isCreator
      ? 'Creator Affiliate Studio'
      : isDistributor
      ? 'Distributor City Hub'
      : 'Restricted Operations Console'
  );

  const portalDescription = description || (
    isCreator
      ? 'Sign in with your Google account to access your live commission wallet, custom referral codes, PR sample dispatches, and campaign collaborations.'
      : isDistributor
      ? 'Sign in with your Google account to access regional city hub inventory, customer order pickup codes, and factory lab restocks.'
      : 'Administration operations require verified executive credentials and MFA. Self-service elevation via Google OAuth is disabled.'
  );

  const targetRole = isCreator ? 'CREATOR' : isDistributor ? 'DISTRIBUTOR' : 'CUSTOMER';

  if (authUser && !isAdmin) return <div className="min-h-screen bg-[#FAF9F6] p-6"><div className="mx-auto max-w-2xl space-y-5"><h1 className="text-2xl font-bold">Apply for your {targetRole.toLowerCase()} workspace</h1><p className="text-sm text-[#6B7280]">Signed in as {authUser.email}. Partner access opens after your application is approved.</p><PartnerApplication kind={isCreator ? 'CREATOR' : 'DISTRIBUTOR'} /><div className="flex gap-4 text-sm underline"><button onClick={() => window.location.reload()}>Check approval status</button><button onClick={() => navigateTo('home')}>Return to storefront</button><button onClick={() => void logout()}>Sign out</button></div></div></div>;

  const handleGoogleSignIn = async () => {
    setConnecting(true);
    const redirectUrl = typeof window !== 'undefined' ? window.location.href : 'http://localhost:3000';
    try { await loginWithGoogle(redirectUrl, targetRole, authUser?.email); }
    finally { setConnecting(false); }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0F0F10] font-body flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-md w-full bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.06)] text-center">
        {/* Portal Icon */}
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xs border transition-transform hover:scale-105 duration-200">
          {isCreator ? (
            <div className="w-full h-full rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 text-[#997A2E] flex items-center justify-center">
              <Sparkles className="w-7 h-7 stroke-[1.8]" />
            </div>
          ) : isDistributor ? (
            <div className="w-full h-full rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-800 flex items-center justify-center">
              <Store className="w-7 h-7 stroke-[1.8]" />
            </div>
          ) : (
            <div className="w-full h-full rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
              <Lock className="w-7 h-7 stroke-[1.8]" />
            </div>
          )}
        </div>

        {/* Portal Headers */}
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#997A2E] font-bold block mb-1">
          {portalBadge}
        </span>
        <h2 className="text-2xl font-bold font-heading text-[#0F0F10] mb-2 tracking-tight">
          {portalTitle}
        </h2>
        <p className="text-xs text-[#6B7280] leading-relaxed mb-6">
          {portalDescription}
        </p>

        {/* Authenticated Customer Context Banner */}
        {authUser && !hasRealAccess && (
          <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-[#E5E7EB] text-left text-xs mb-5 flex items-start gap-3">
            <UserCheck className="w-4 h-4 text-[#0F4A38] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-[#4B5563]">
                Logged in as <strong className="text-[#0F0F10] truncate block">{authUser.email}</strong>
              </p>
              <p className="text-[10px] text-[#6B7280] mt-0.5">
                Authorize with Google to link your verified {targetRole.toLowerCase()} workspace.
              </p>
            </div>
          </div>
        )}

        {/* Primary Action */}
        {authError && <p role="alert" className="mb-4 text-sm text-rose-700">{authError}</p>}
        {!isAdmin ? (
          <div className="space-y-3 mb-6">
            <GoogleMinimalButton
              label={`Continue with Google as ${targetRole === 'CREATOR' ? 'Creator' : 'Distributor'}`}
              onClick={handleGoogleSignIn}
              loading={connecting}
            />

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-[#E5E7EB]" />
              <span className="flex-shrink mx-3 text-[10px] uppercase tracking-wider text-[#9CA3AF] font-medium">
                Or
              </span>
              <div className="flex-grow border-t border-[#E5E7EB]" />
            </div>

            <button
              onClick={() => navigateTo('login')}
              className="w-full py-3 px-4 rounded-xl border border-[#E5E7EB] hover:border-[#0F0F10] bg-white text-[#0F0F10] text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#FAF9F6] active:scale-[0.99] transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-[#6B7280]" />
              Sign In with Email &amp; Password
            </button>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-left text-xs text-amber-900 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Super Admin operations are protected by corporate credentials and hardware MFA. OAuth elevation is strictly disabled.
              </p>
            </div>

            <button
              onClick={() => navigateTo('login')}
              className="w-full py-3.5 rounded-xl bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-bold shadow-sm active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4 text-[#D4AF37]" />
              Executive Staff Sign In
            </button>
          </div>
        )}

        {/* Return & Dev links */}
        <div className="pt-4 border-t border-[#F3F4F6] flex flex-col gap-2">
          <button
            onClick={() => navigateTo('home')}
            className="w-full py-2.5 rounded-full text-[#6B7280] hover:text-[#0F0F10] text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Storefront
          </button>

          {false && !isAdmin && (
            <div className="mt-2 text-center">
              <button
                onClick={() => enterPreviewRole(targetRole)}
                className="text-[10px] text-[#9CA3AF] hover:text-[#4B5563] underline cursor-pointer transition-colors"
              >
                Inspect UI with mock data (Demo preview)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
