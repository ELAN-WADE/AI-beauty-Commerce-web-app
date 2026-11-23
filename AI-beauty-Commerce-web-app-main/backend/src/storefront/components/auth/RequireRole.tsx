import { PartnerProgrammeSelector } from '../partner/shell/PartnerProgrammeSelector';
import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, LoaderCircle, Lock, LogIn, ShieldAlert, Store, UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PartnerApplication } from '../partner/PartnerApplication';
import { getDesignPreviewPortal } from '../../lib/portal-preview';
import { isStaffAccount } from '../../lib/auth-flow';
import { DeslaAuthShell, DeslaWatermark } from './DeslaAuthShell';

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
    className="w-full h-11 px-4 rounded-[10px] border border-[#DDD7CC] hover:border-[#111111] bg-white/90 hover:bg-white text-[#111111] text-sm font-medium flex items-center justify-center gap-2.5 active:scale-[0.99] transition-all duration-150 cursor-pointer disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89248] focus-visible:ring-offset-2"
  >
    {loading ? (
      <LoaderCircle className="w-4 h-4 animate-spin text-[#B89248]" aria-hidden="true" />
    ) : (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
      </svg>
    )}
    <span className="text-sm font-medium text-[#111111] tracking-tight">
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
  const { authUser, authLoading, authError, completeMfaVerification, navigateTo, loginWithGoogle, logout } = useApp();
  const [connecting, setConnecting] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const staffOnly = !allowedRoles.includes('CREATOR') && !allowedRoles.includes('DISTRIBUTOR') && isStaffAccount(allowedRoles);
  const needsMfa = Boolean(authUser && staffOnly && isStaffAccount(authUser.roles) && !authUser.mfaVerified);
  const designPortal = mounted ? getDesignPreviewPortal() : null;

  if (!staffOnly && designPortal && allowedRoles.includes(designPortal)) {
    return (
      <>
        <div role="note" className="bg-[#FBF9F5] border-b border-[#EAE5DC] px-4 py-2 text-center text-xs text-[#6E6A63]">
          {designPortal.charAt(0) + designPortal.slice(1).toLowerCase()} design preview · No sign-in required · Empty layout · Live actions disabled
          <button
            className="ml-4 underline font-medium text-[#111111]"
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.delete('preview');
              window.location.assign(url.toString());
            }}
          >
            Exit preview
          </button>
        </div>
        {children}
      </>
    );
  }

  if (authLoading && !authUser) {
    return (
      <div className="min-h-[100svh] bg-[#FBF9F5] flex flex-col items-center justify-center p-6 text-center">
        <img
          src="/desla_logo_dark.svg"
          alt="Desla!"
          className="h-6 w-auto mb-5 block object-contain select-none"
        />
        <div className="w-7 h-7 rounded-full border-2 border-[#EAE5DC] border-t-[#B89248] animate-spin mb-3" />
        <p className="text-xs font-medium uppercase tracking-wider text-[#6E6A63]">
          Verifying workspace session…
        </p>
      </div>
    );
  }

  if (staffOnly && !authUser && !authLoading) return <AdminSignIn />;

  if (needsMfa && authUser) {
    return (
      <div className="relative min-h-[100svh] flex flex-col justify-start sm:justify-center items-center bg-[#FBF9F5] px-4 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:p-6">
        <DeslaWatermark />
        <div className="relative z-10 w-full max-w-[460px] rounded-[22px] border border-[#E7E1D6] bg-[#FBF9F5] p-6 sm:p-8 shadow-[0_24px_64px_-24px_rgba(17,17,17,0.12)]">
          <div className="flex justify-center mb-5">
            <img src="/desla_logo_dark.svg" alt="Desla!" className="h-6 w-auto block object-contain select-none" />
          </div>
          <MfaSignIn
            key={authUser.id}
            user={authUser}
            request={apiFetch}
            onComplete={async (user) => { completeMfaVerification(user); }}
            onRestart={logout}
          />
        </div>
      </div>
    );
  }

  const userRoles = authUser?.roles || [];
  const hasRealAccess =
    (staffOnly && userRoles.includes('SUPER_ADMIN')) ||
    userRoles.some((role) => allowedRoles.includes(role));

  if (hasRealAccess) {
    return <>{children}</>;
  }

  const isCreator = allowedRoles.includes('CREATOR');
  const isDistributor = allowedRoles.includes('DISTRIBUTOR');
  const isAdmin = !isCreator && !isDistributor && (allowedRoles.includes('ADMIN') || allowedRoles.includes('SUPER_ADMIN'));

  const portalBadge = isCreator
    ? 'Desla Creator Studio'
    : isDistributor
    ? 'Desla Distributor Network'
    : 'Executive Security';

  const portalTitle =
    title ||
    (isCreator
      ? 'Creator Affiliate Studio'
      : isDistributor
      ? 'Distributor City Hub'
      : 'Restricted Operations Console');

  const portalDescription =
    description ||
    (isCreator
      ? 'Sign in with your verified account to access your commission wallet, custom referral codes, PR sample dispatches, and campaign briefs.'
      : isDistributor
      ? 'Sign in with your verified account to manage regional city hub stock, order collection codes, and wholesale restock orders.'
      : 'Administration operations require verified executive credentials and MFA. Self-service elevation via Google OAuth is disabled.');

  const targetRole = isCreator ? 'CREATOR' : isDistributor ? 'DISTRIBUTOR' : 'CUSTOMER';
  const editorialImage = isCreator ? '/artwork/creator-login-editorial.webp' : '/artwork/distributor-onboarding-editorial.webp';
  const editorialAlt = isCreator
    ? 'Beauty creator filming a skincare routine with a Desla Beauty serum in a warm sunlit studio'
    : 'Desla Beauty minimalist apothecary showroom and distributor fulfilment table';
  const editorialHeadline = isCreator ? 'Welcome to Desla Studio' : 'Welcome to Desla Hubs';
  const editorialSubheadline = isCreator
    ? 'Create, share, and earn with intention.'
    : 'Local beauty hubs, fulfilled with care.';
  const editorialCaption = isCreator
    ? 'Authentic beauty storytelling paired with transparent, server-verified attribution.'
    : 'Curated local city hubs delivering authentic formulations with same-day precision.';

  // Signed-in customer applying for Creator / Distributor onboarding
  if (authUser && !isAdmin) {
    return (
      <div className="relative min-h-[100svh] bg-[#FBF9F5] text-[#111111] font-body pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-[calc(2rem+env(safe-area-inset-bottom,0px))] px-4 sm:py-6 sm:px-6 lg:px-8">
        <DeslaWatermark />
        <div className="relative z-10 mx-auto max-w-[950px] grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-7 items-start">
          <div className="lg:col-span-5 lg:sticky lg:top-8">
            <div className="relative overflow-hidden rounded-[22px] border border-[#EAE5DC] bg-[#F3EEE3] shadow-[0_18px_48px_-20px_rgba(17,17,17,0.14)]">
              <img
                src={editorialImage}
                alt={editorialAlt}
                width={960}
                height={1200}
                decoding="async"
                className="w-full h-[210px] sm:h-[250px] lg:h-[520px] object-cover object-top"
              />
              <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-between pointer-events-none">
                <img src="/desla_logo_dark.svg" alt="Desla!" className="h-6 w-auto self-start block object-contain select-none" />
                <div className="rounded-2xl bg-[#1C1712]/70 lg:bg-[#1C1712]/[0.42] lg:backdrop-blur-md border border-white/[0.20] p-3.5 sm:p-4 shadow-[0_12px_32px_-14px_rgba(17,17,17,0.28)]">
                  <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#F3DFAC] block">
                    {portalBadge}
                  </span>
                  <p className="text-xs font-normal text-white/95 mt-1 leading-relaxed">
                    {editorialCaption}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-5">
            <PartnerProgrammeSelector kind={isCreator ? 'CREATOR' : 'DISTRIBUTOR'} />
            <div className="space-y-1">
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-[#111111]">
                Apply for your {targetRole.toLowerCase()} workspace
              </h1>
              <p className="text-sm text-[#6E6A63] font-normal">
                Signed in as <span className="font-medium text-[#111111]">{authUser.email}</span>. Partner access opens after your application is approved.
              </p>
            </div>
            <PartnerApplication kind={isCreator ? 'CREATOR' : 'DISTRIBUTOR'} />
            <div className="flex flex-wrap gap-5 pt-2 text-xs font-medium text-[#4A4742]">
              <button type="button" className="underline hover:text-[#111111] cursor-pointer" onClick={() => window.location.reload()}>
                Check approval status
              </button>
              <button type="button" className="underline hover:text-[#111111] cursor-pointer" onClick={() => navigateTo('home')}>
                Return to storefront
              </button>
              <button type="button" className="underline hover:text-[#111111] cursor-pointer" onClick={() => void logout()}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleGoogleSignIn = async () => {
    setConnecting(true);
    const redirectUrl = typeof window !== 'undefined' ? window.location.href : 'http://localhost:3000';
    try {
      await loginWithGoogle(redirectUrl, targetRole, authUser?.email);
    } finally {
      setConnecting(false);
    }
  };

  // Unauthenticated Partner Login (Compact Luxury Two-Column Composition)
  if (!isAdmin) {
    return (
      <DeslaAuthShell
        artworkSrc={editorialImage}
        artworkAlt={editorialAlt}
        artworkPosition={isCreator ? 'object-[50%_30%] lg:object-top' : 'object-[50%_68%] lg:object-center'}
        eyebrow={portalBadge}
        headline={editorialHeadline}
        subheadline={editorialSubheadline}
        supportingCopy={editorialCaption}
        showSkinScanFeature={false}
        onSkinScanClick={() => navigateTo('ai-scan')}
      >
        <div className="flex items-center justify-between mb-5">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6E6A63] hover:text-[#111111] transition-colors cursor-pointer py-1 -ml-1 px-1.5 rounded-md hover:bg-[#F5F2EB]"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back to Shop</span>
          </button>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-[#B89248]">
            {isCreator ? <UserCheck className="w-3.5 h-3.5" aria-hidden="true" /> : <Store className="w-3.5 h-3.5" aria-hidden="true" />}
            <span>{isCreator ? 'Creator' : 'Distributor'}</span>
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <h1 className="text-[22px] sm:text-2xl font-semibold font-heading text-[#111111] tracking-tight leading-snug">
              {portalTitle}
            </h1>
            <p className="text-xs sm:text-[13px] font-normal text-[#6E6A63] leading-relaxed mt-1.5">
              {portalDescription}
            </p>
          </div>

          {authError && (
            <p role="alert" className="px-3.5 py-2.5 rounded-[10px] bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {authError}
            </p>
          )}

          <div className="space-y-3 pt-1">
            <GoogleMinimalButton
              label={`Continue with Google as ${isCreator ? 'Creator' : 'Distributor'}`}
              onClick={handleGoogleSignIn}
              loading={connecting}
            />

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[#EAE5DC]" />
              <span className="shrink-0 mx-3 text-[10px] uppercase tracking-[0.14em] text-[#9A948A] font-medium">
                Or email
              </span>
              <div className="flex-grow border-t border-[#EAE5DC]" />
            </div>

            <button
              type="button"
              onClick={() => navigateTo('login')}
              className="group w-full h-11 px-4 rounded-[10px] bg-[#111111] hover:bg-[#242426] text-white text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89248] focus-visible:ring-offset-2"
            >
              <LogIn className="w-4 h-4 text-[#E6C77A]" aria-hidden="true" />
              <span>Sign In with Email &amp; Password</span>
              <ArrowRight className="w-4 h-4 text-[#E6C77A] transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </DeslaAuthShell>
    );
  }

  // Restricted Admin fallback
  return (
    <div className="relative min-h-[100svh] bg-[#FBF9F5] text-[#111111] font-body flex flex-col justify-start sm:justify-center items-center px-4 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:p-6">
      <DeslaWatermark />
      <div className="relative z-10 max-w-md w-full bg-[#FBF9F5] border border-[#E7E1D6] rounded-[22px] p-6 sm:p-8 shadow-[0_24px_64px_-24px_rgba(17,17,17,0.12)] text-center">
        <div className="flex justify-center mb-5">
          <img src="/desla_logo_dark.svg" alt="Desla!" className="h-6 w-auto block object-contain select-none" />
        </div>
        <div className="w-11 h-11 rounded-xl bg-white/80 border border-[#E7E1D6] text-[#111111] flex items-center justify-center mx-auto mb-4">
          <Lock className="w-5 h-5 text-[#B89248]" aria-hidden="true" />
        </div>
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#B89248] block mb-1">
          {portalBadge}
        </span>
        <h2 className="text-xl font-semibold font-heading text-[#111111] mb-1.5 tracking-tight">
          {portalTitle}
        </h2>
        <p className="text-xs font-normal text-[#6E6A63] leading-relaxed mb-5">
          {portalDescription}
        </p>
        {authError && <p role="alert" className="mb-4 text-xs text-rose-700">{authError}</p>}
        <div className="space-y-3 mb-5">
          <div className="p-3 rounded-xl bg-[#FBF9F5] border border-[#EAE5DC] text-left text-xs text-[#4A4742] flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-[#B89248] shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-[11px] leading-relaxed font-normal">
              Executive operations are protected by corporate credentials and TOTP MFA. OAuth elevation is strictly disabled.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('login')}
            className="w-full h-11 rounded-[10px] bg-[#111111] hover:bg-[#242426] text-white text-xs font-medium shadow-xs active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4 text-[#E6C77A]" aria-hidden="true" />
            <span>Executive Staff Sign In</span>
          </button>
        </div>
        <div className="pt-3 border-t border-[#F0ECE4]">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="w-full py-2 text-[#6E6A63] hover:text-[#111111] text-xs font-medium transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Return to Storefront</span>
          </button>
        </div>
      </div>
    </div>
  );
};
