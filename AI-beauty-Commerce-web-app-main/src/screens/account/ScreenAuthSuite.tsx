import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  HelpCircle,
  KeyRound,
  User,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiFetch, resendVerificationEmail } from '../../lib/owned-api';
import { MfaSignIn } from '../../components/auth/MfaSignIn';
import { ScreenId } from '../../types';
import { finishSignIn as finishSignInTarget, isStaffAccount, readAuthIntent, rememberAuthIntent } from '../../lib/auth-flow';

export interface AuthSuiteProps {
  initialMode?: 'login' | 'signup' | 'forgot-password' | 'reset-password' | 'verify-email';
}

/**
 * Minimalistic Google Button
 * Clean, uncluttered, luxury styling: official Google logo + "Continue with Google"
 */
const GoogleMinimalButton: React.FC<{
  label?: string;
  onClick: () => void;
  loading?: boolean;
}> = ({ label = 'Continue with Google', onClick, loading }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    className="w-full py-3 px-4 rounded-xl border border-[#E5E7EB] hover:border-[#0F0F10] bg-white hover:bg-[#FAF9F6] text-[#0F0F10] text-sm font-semibold flex items-center justify-center gap-3 shadow-2xs hover:shadow-xs active:scale-[0.99] transition-all duration-150 cursor-pointer disabled:opacity-60"
  >
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
    </svg>
    <span className="text-sm font-semibold text-[#0F0F10] tracking-tight">
      {loading ? 'Connecting to Google…' : label}
    </span>
  </button>
);

export const ScreenAuthSuite: React.FC<AuthSuiteProps> = ({ initialMode = 'login' }) => {
  const {
    navigateTo,
    authUser,
    refreshAuth,
    completeMfaVerification,
    logout,
    authError,
    login,
    register,
    requestPasswordReset,
    resetPassword,
    verifyEmail,
    isLiveBackend,
    setSimulatedUserRole,
    loginWithGoogle,
    enterPreviewRole,
    exitPreviewRole,
    isPreviewMode,
    previewRole
  } = useApp();

  const finishSignIn = (user: Parameters<typeof finishSignInTarget>[0]) => finishSignInTarget(user, target => {
    const url = new URL(target, window.location.origin);
    const paths: Record<string, ScreenId> = { '/creators': 'creators', '/distributor': 'distributor-portal', '/catalogue': 'catalogue', '/account': 'account', '/orders': 'orders', '/cart': 'cart', '/checkout': 'checkout' };
    const screen = paths[url.pathname] || (url.pathname === '/' ? url.searchParams.get('screen') as ScreenId : null);
    if (!screen) { window.location.assign(target); return; }
    const destination = new URL('/', window.location.origin);
    destination.search = url.search;
    destination.searchParams.set('screen', screen);
    navigateTo(screen);
    window.history.replaceState({ screen }, '', destination.pathname + destination.search);
  });

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password' | 'reset-password' | 'create-new-password' | 'verify-email' | 'mfa'>(
    initialMode === 'reset-password' && new URLSearchParams(window.location.search).has('token') ? 'create-new-password' : initialMode
  );

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Secure token state for Reset Password & Email Verification (backend long tokens)
  // Legacy 4-digit demo OTP removed: backend issues 64-char hex tokens via email outbox.
  const [secureToken, setSecureToken] = useState(() => new URLSearchParams(window.location.search).get('token') ?? '');
  useEffect(() => {
    const saved = readAuthIntent();
    rememberAuthIntent(saved.intent, saved.returnTo ?? undefined);
    const params = new URLSearchParams(window.location.search);
    if (params.has('token')) { params.delete('token'); window.history.replaceState({}, '', window.location.pathname + (params.size ? `?${params}` : '')); }
  }, []);

  // Feedback & Loading
  const [busy, setBusy] = useState(false);
  const [busyGoogle, setBusyGoogle] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('mfa') === '1' && authUser && isStaffAccount(authUser.roles)) {
      if (authUser.mfaVerified) finishSignIn(authUser);
      else setMode('mfa');
    }
  }, [authUser?.id]);

  const handleGoogleClick = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setBusyGoogle(true);
    try {
      await loginWithGoogle(undefined, undefined, email.trim() || undefined);
    } catch (error) {
      setBusyGoogle(false);
      setErrorMessage(error instanceof Error ? error.message : 'Google sign-in is not configured.');
    } finally { setBusyGoogle(false); }
  };

  // OAuth restoration is handled centrally; never override its portal destination.

  // Resend cooldown supplements the server-side rate limit.
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Submit handlers
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setBusy(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        setSuccessMessage(res.message);
        if (res.user) {
          if (isStaffAccount(res.user.roles) && !res.user.mfaVerified) { setPassword(''); setMode('mfa'); }
          else finishSignIn(res.user);
        }
      } else {
        setErrorMessage(res.message);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    setBusy(true);
    try {
      const res = await register(email.trim(), password);
      if (res.success) {
        setSuccessMessage(res.message);
        setSecureToken('');
        setPassword('');
        setMode('verify-email');
      } else {
        setErrorMessage(res.message);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    setBusy(true);
    try {
      const res = await requestPasswordReset(email);
      if (res.success) {
        setSuccessMessage(res.message);
        setSecureToken('');
        setPassword('');
        setResendCooldown(59);
        setTimeout(() => {
          setMode('reset-password');
        }, 700);
      } else {
        setErrorMessage(res.message);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleResetTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const token = secureToken.trim();

    if (!/^[a-f0-9]{64}$/.test(token)) {
      setErrorMessage('Open the reset link in your email or paste its 64-character token.');
      return;
    }
    setErrorMessage('');
    setSuccessMessage('Choose a new password. The server will validate the reset link when you submit.');
    setTimeout(() => {
      setMode('create-new-password');
    }, 600);
  };

  const handleCreateNewPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    const token = (secureToken || '').trim();
    if (isLiveBackend && token.length < 16) {
      setErrorMessage('Missing reset token — request a new reset link.');
      return;
    }
    setBusy(true);
    try {
      const res = await resetPassword(token, password);
      if (res.success) {
        setSuccessMessage('Password successfully updated! Returning to login…');
        setSecureToken('');
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          window.history.replaceState({}, '', '/');
          setMode('login');
        }, 1200);
      } else {
        setErrorMessage(res.message);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = secureToken.trim();
    if (isLiveBackend && token.length < 16) {
      setErrorMessage('Paste the verification token from your email.');
      return;
    }
    setBusy(true);
    setErrorMessage('');
    try {
      const res = await verifyEmail(token);
      if (res.success) {
        setSuccessMessage(res.message);
        setSecureToken('');
        setPassword('');
        if (res.user) {
          if (isStaffAccount(res.user.roles) && !res.user.mfaVerified) setMode('mfa');
          else finishSignIn(res.user);
        } else setMode('login');
      } else {
        setErrorMessage(res.message);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async (verification: boolean) => {
    if (busy || resendCooldown > 0) return;
    if (!email.trim()) { setErrorMessage('Enter your email address to request a new link.'); return; }
    setBusy(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      if (verification) {
        await resendVerificationEmail(email);
        setSecureToken('');
        setSuccessMessage('Check your inbox or spam folder for a verification link or instructions for your existing account.');
      } else {
        const result = await requestPasswordReset(email);
        if (!result.success) throw new Error(result.message);
        setSuccessMessage(result.message);
        setSecureToken('');
      }
      setResendCooldown(60);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not resend. Please try again.');
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F5] text-[#0F0F10] font-body flex flex-col justify-between selection:bg-[#D4AF37]/20 selection:text-[#997A2E] p-4 sm:p-6 lg:p-10">

      {/* Main Centered Mobile/Desktop Card matching @uyais Figma Reference */}
      {authError && <p role="alert" className="mx-auto mb-4 max-w-md text-sm text-rose-700">{authError}</p>}
      <div className="max-w-md w-full mx-auto bg-white/85 backdrop-blur-xl border border-white/90 rounded-3xl p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.06)] relative transition-all">
        {/* Top Back Navigation Link */}
        <div className="flex items-center justify-between mb-4">
          {mode !== 'login' ? (
            <button
              type="button"
              onClick={() => {
                setErrorMessage('');
                setSuccessMessage('');
                if (mode === 'reset-password') setMode('forgot-password');
                else if (mode === 'create-new-password') setMode('reset-password');
                else setMode('login');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4B5563] hover:text-[#0F0F10] transition-colors cursor-pointer py-1.5 px-2 -ml-2 rounded-lg hover:bg-[#F3F4F6]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4B5563] hover:text-[#0F0F10] transition-colors cursor-pointer py-1.5 px-2 -ml-2 rounded-lg hover:bg-[#F3F4F6]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Shop</span>
            </button>
          )}

          <span className="text-[10px] font-mono tracking-widest text-[#997A2E] font-bold uppercase">
            DESLA!™ APOTHECARY
          </span>
        </div>

        {/* ======================================================== */}
        {/* VIEW 1: FORGOT PASSWORD (Exact recreation of Figma Screen 1) */}
        {/* ======================================================== */}
        {mode === 'forgot-password' && (
          <div>
            {/* Centered Circular Icon Badge */}
            <div className="flex justify-center mb-6 mt-2">
              <div className="w-20 h-20 rounded-full bg-[#FAF9F6] border border-[#D4AF37]/50 flex items-center justify-center shadow-inner">
                <ShieldCheck className="w-10 h-10 text-[#D4AF37] stroke-[1.8]" />
              </div>
            </div>

            {/* Typography & Subtitle */}
            <div className="text-center mb-7">
              <h1 className="text-2xl font-bold font-heading text-[#0F0F10] tracking-tight">
                Secure Account Recovery
              </h1>
              <p className="text-xs text-[#6B7280] mt-2 max-w-xs mx-auto leading-relaxed">
                Enter your account email address to receive a secure password reset link.
              </p>
            </div>

            <div className="space-y-4">
              <form className="space-y-3" onSubmit={handleForgotPasswordSubmit}><label className="block text-xs font-medium">Email address<input required type="email" autoComplete="email" className="mt-2 w-full rounded-xl border border-[#D1D5DB] px-4 py-3 text-base" value={email} onChange={e => setEmail(e.target.value)} /></label><button disabled={busy} className="w-full rounded-xl bg-[#0F0F10] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Sending…' : 'Send reset link'}</button></form>
              {errorMessage && <p role="alert" className="text-xs text-rose-700">{errorMessage}</p>}{successMessage && <p role="status" className="text-xs text-emerald-800">{successMessage}</p>}
              <GoogleMinimalButton
                label="Sign In with Google"
                onClick={handleGoogleClick}
                loading={busyGoogle}
              />

              <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] text-center space-y-1">
                <p className="text-[11px] font-semibold text-[#0F0F10]">
                  Need manual identity verification?
                </p>
                <p className="text-[11px] text-[#6B7280]">
                  Contact our security desk at <a href="mailto:security@desla.com" className="text-[#997A2E] underline font-medium">security@desla.com</a>.
                </p>
              </div>

              {/* Bottom Back to Login */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-[#6B7280] hover:text-[#0F0F10] font-medium transition-colors cursor-pointer"
                >
                  ← Back to Sign In
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: RESET PASSWORD / SECURE TOKEN (backend long token) */}
        {/* ======================================================== */}
        {mode === 'reset-password' && (
          <div>
            {/* Centered Circular Icon Badge (Envelope @) */}
            <div className="flex justify-center mb-6 mt-2">
              <div className="w-24 h-24 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center shadow-inner">
                <Mail className="w-10 h-10 text-[#4B5563] stroke-[1.8]" />
              </div>
            </div>

            {/* Typography */}
            <div className="text-center mb-7">
              <h1 className="text-2xl font-bold font-heading text-[#0F0F10] tracking-tight">
                Reset Password
              </h1>
              <p className="text-xs text-[#6B7280] mt-2 max-w-xs mx-auto leading-relaxed">
                Open the reset link in your email. It fills the token automatically, or you can paste the token below.
              </p>
            </div>

            {/* Secure token input */}
            <form onSubmit={handleResetTokenSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Secure reset token</label>
                <input
                  type="text"
                  value={secureToken}
                  onChange={(e) => setSecureToken(e.target.value.trim())}
                  id="email-verification-token"
                  autoComplete="off"
                  placeholder="Paste token from email"
                  className="w-full px-4 py-3 rounded-xl border border-[#D1D5DB] bg-white text-xs font-mono text-[#0F0F10] focus:outline-none focus:border-[#0F0F10] transition-all"
                />
                <p className="text-[11px] text-[#6B7280] mt-1">Tokens expire in 1 hour and are single-use.</p>
              </div>

              {/* Resend Code Link */}
              <div className="text-center">
                <button
                  type="button"
                  disabled={busy || resendCooldown > 0 || !email.trim()}
                  onClick={() => void handleResend(false)}
                  className={`text-xs font-semibold transition-colors cursor-pointer ${
                    resendCooldown > 0 ? 'text-[#9CA3AF] cursor-not-allowed' : 'text-[#0284C7] hover:text-[#0369A1]'
                  }`}
                >
                  Resend reset link {resendCooldown > 0 ? `(${resendCooldown}s)` : ''}
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                  {successMessage}
                </div>
              )}

              {/* Primary Pill Button */}
              <button
                type="submit"
                disabled={busy}
                className="w-full py-3.5 px-6 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-sm font-semibold tracking-wide shadow-md active:scale-[0.97] transition-all duration-150 cursor-pointer disabled:opacity-60"
              >
                Continue
              </button>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 3: CREATE NEW PASSWORD (Figma Screen 3)            */}
        {/* ======================================================== */}
        {mode === 'create-new-password' && (
          <div>
            {/* Centered Circular Icon Badge (Lock Checkmark) */}
            <div className="flex justify-center mb-6 mt-2">
              <div className="w-24 h-24 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center shadow-inner">
                <div className="relative">
                  <Lock className="w-10 h-10 text-[#4B5563] stroke-[1.8]" />
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 absolute -top-1 -right-1 fill-white" />
                </div>
              </div>
            </div>

            {/* Typography */}
            <div className="text-center mb-7">
              <h1 className="text-2xl font-bold font-heading text-[#0F0F10] tracking-tight">
                Create New Password
              </h1>
              <p className="text-xs text-[#6B7280] mt-2 max-w-xs mx-auto leading-relaxed">
                Your New Password Must Be Different From Previously Used Password
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateNewPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#D1D5DB] bg-white text-sm text-[#0F0F10] pr-11 focus:outline-none focus:border-[#0F0F10] focus:ring-1 focus:ring-[#0F0F10] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#D1D5DB] bg-white text-sm text-[#0F0F10] pr-11 focus:outline-none focus:border-[#0F0F10] focus:ring-1 focus:ring-[#0F0F10] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563] cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                  {successMessage}
                </div>
              )}

              {/* Primary Pill Button */}
              <button
                type="submit"
                disabled={busy}
                className="w-full py-3.5 px-6 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-sm font-semibold tracking-wide shadow-md active:scale-[0.97] transition-all duration-150 cursor-pointer disabled:opacity-60 mt-2"
              >
                {busy ? 'Updating Password…' : 'Continue'}
              </button>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 4: SIGN IN / LOGIN                                 */}
        {/* ======================================================== */}
        {mode === 'mfa' && authUser && <MfaSignIn key={authUser.id} user={authUser} request={apiFetch} onComplete={async user => { completeMfaVerification(user); finishSignIn(user); }} onRestart={async () => { await logout(); setMode('login'); }} />}
        {mode === 'login' && (
          <div>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold font-heading text-[#0F0F10] tracking-tight">
                Sign In to Desla!
              </h1>
              <p className="text-xs text-[#6B7280] mt-1.5">
                Access your apothecary formulations, orders &amp; AI skin telemetry.
              </p>
            </div>

            {/* Pill Tab Switcher */}
            <div className="flex bg-[#F3F4F6] p-1 rounded-full mb-6">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="flex-1 py-1.5 rounded-full text-xs font-bold transition-all bg-white text-[#0F0F10] shadow-xs cursor-pointer"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="flex-1 py-1.5 rounded-full text-xs font-semibold text-[#6B7280] hover:text-[#0F0F10] transition-all cursor-pointer"
              >
                Create Account
              </button>
            </div>

            {/* Minimalistic Google Sign-In */}
            <div className="space-y-4 mb-5">
              <GoogleMinimalButton
                label="Continue with Google"
                onClick={handleGoogleClick}
                loading={busyGoogle}
              />

              <div className="relative flex items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-3 text-[10px] text-[#9CA3AF] font-mono uppercase tracking-wider">Or email & password</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label htmlFor="sign-in-email" className="block text-xs font-medium text-[#4B5563] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="sign-in-email"
                  autoComplete="username"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#D1D5DB] bg-white text-sm text-[#0F0F10] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#0F0F10] focus:ring-1 focus:ring-[#0F0F10] transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="sign-in-password" className="text-xs font-medium text-[#4B5563]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('');
                      setSuccessMessage('');
                      setMode('forgot-password');
                    }}
                    className="text-xs font-semibold text-[#997A2E] hover:text-[#D4AF37] cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="sign-in-password"
                    autoComplete="current-password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#D1D5DB] bg-white text-sm text-[#0F0F10] pr-11 focus:outline-none focus:border-[#0F0F10] focus:ring-1 focus:ring-[#0F0F10] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                  {successMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3.5 px-6 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-sm font-semibold tracking-wide shadow-md active:scale-[0.97] transition-all duration-150 cursor-pointer disabled:opacity-60"
              >
                {busy ? 'Authenticating…' : 'Sign In'}
              </button>
              {isLiveBackend && <button type="button" disabled={busy} onClick={() => { setMode('verify-email'); setSecureToken(''); setErrorMessage(''); setSuccessMessage(''); }} className="w-full text-xs underline text-[#4B5563]">Need a new verification link?</button>}

              {/* Continue as Guest option */}
              <div className="pt-2 text-center border-t border-[#E5E7EB] mt-5">
                <button
                  type="button"
                  onClick={() => navigateTo('home')}
                  className="text-xs text-[#6B7280] hover:text-[#0F0F10] font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  Continue Shopping as Guest <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 5: CREATE ACCOUNT / SIGN UP                        */}
        {/* ======================================================== */}
        {mode === 'signup' && (
          <div>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold font-heading text-[#0F0F10] tracking-tight">
                Create Your Account
              </h1>
              <p className="text-xs text-[#6B7280] mt-1.5">
                Unlock natural skin tracking, order dispatch &amp; member benefits.
              </p>
            </div>

            {/* Pill Tab Switcher */}
            <div className="flex bg-[#F3F4F6] p-1 rounded-full mb-6">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="flex-1 py-1.5 rounded-full text-xs font-semibold text-[#6B7280] hover:text-[#0F0F10] transition-all cursor-pointer"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="flex-1 py-1.5 rounded-full text-xs font-bold transition-all bg-white text-[#0F0F10] shadow-xs cursor-pointer"
              >
                Create Account
              </button>
            </div>

            {/* Minimalistic Google Sign-Up */}
            <div className="space-y-4 mb-5">
              <GoogleMinimalButton
                label="Continue with Google"
                onClick={handleGoogleClick}
                loading={busyGoogle}
              />

              <div className="relative flex items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-3 text-[10px] text-[#9CA3AF] font-mono uppercase tracking-wider">Or register with email</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#D1D5DB] bg-white text-sm text-[#0F0F10] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#0F0F10] focus:ring-1 focus:ring-[#0F0F10] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1">
                  Password (at least 8 characters)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#D1D5DB] bg-white text-sm text-[#0F0F10] pr-11 focus:outline-none focus:border-[#0F0F10] focus:ring-1 focus:ring-[#0F0F10] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                  {successMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3.5 px-6 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-sm font-semibold tracking-wide shadow-md active:scale-[0.97] transition-all duration-150 cursor-pointer disabled:opacity-60"
              >
                {busy ? 'Creating Account…' : 'Create account'}
              </button>

              <div className="pt-2 text-center border-t border-[#E5E7EB] mt-5">
                <button
                  type="button"
                  onClick={() => navigateTo('home')}
                  className="text-xs text-[#6B7280] hover:text-[#0F0F10] font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  Continue Shopping as Guest <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 6: EMAIL VERIFICATION                               */}
        {/* ======================================================== */}
        {mode === 'verify-email' && (
          <div>
            <div className="flex justify-center mb-6 mt-2">
              <div className="w-24 h-24 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center shadow-inner">
                <ShieldCheck className="w-10 h-10 text-[#D4AF37] stroke-[1.8]" />
              </div>
            </div>

            <div className="text-center mb-7">
              <h1 className="text-2xl font-bold font-heading text-[#0F0F10] tracking-tight">
                {secureToken ? 'Verify Your Email' : 'Check Your Email'}
              </h1>
              <p className="text-xs text-[#6B7280] mt-2 max-w-xs mx-auto leading-relaxed">
                {secureToken ? 'Confirm your email to sign in and continue.' : 'New accounts receive a verification link. Already verified accounts receive sign-in instructions. Check your inbox and spam folder.'}
              </p>
            </div>

            <form onSubmit={handleVerifyEmailSubmit} className="space-y-6">
              <details open={secureToken ? true : undefined} className="rounded-xl border border-[#E5E7EB] p-3">
                <summary className="cursor-pointer text-xs text-[#4B5563]">Opened the email link, or have a verification token?</summary>
              <div className="mt-3">
                <label htmlFor="email-verification-token" className="block text-xs font-medium text-[#4B5563] mb-1.5">Verification token</label>
                <input
                  type="text"
                  value={secureToken}
                  onChange={(e) => setSecureToken(e.target.value.trim())}
                  id="email-verification-token"
                  autoComplete="off"
                  placeholder="Paste token from email"
                  className="w-full px-4 py-3 rounded-xl border border-[#D1D5DB] bg-white text-xs font-mono text-[#0F0F10] focus:outline-none focus:border-[#0F0F10] transition-all"
                />
                <p className="text-[11px] text-[#6B7280] mt-1">Tokens expire in 24 hours and are single-use.</p>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3.5 px-6 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-sm font-semibold tracking-wide shadow-md active:scale-[0.97] transition-all duration-150 cursor-pointer disabled:opacity-60"
              >
                {busy ? 'Verifying…' : 'Verify Email'}
              </button>
              </details>
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                  {successMessage}
                </div>
              )}


              {isLiveBackend && <div className="space-y-3">
                <label className="block text-xs text-[#4B5563]">Email address
                  <input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1 w-full px-4 py-3 rounded-xl border border-[#D1D5DB] bg-white text-sm" />
                </label>
                <button type="button" disabled={busy || resendCooldown > 0 || !email.trim()} onClick={() => void handleResend(true)} className="w-full text-xs underline text-[#4B5563] disabled:opacity-50">Send account email {resendCooldown > 0 ? `(${resendCooldown}s)` : ''}</button>
              </div>}
            </form>
            <div className="mt-6 space-y-3 border-t border-[#E5E7EB] pt-5 text-center text-xs">
              <p className="text-[#6B7280]">Already registered or used Google? You can sign in with that account.</p>
              <button type="button" onClick={() => { setMode('login'); setErrorMessage(''); setSuccessMessage(''); }} className="mr-5 font-semibold underline">Go to sign in</button>
              <button type="button" onClick={() => { setMode('forgot-password'); setErrorMessage(''); setSuccessMessage(''); }} className="underline">Reset password</button>
            </div>
          </div>
        )}
      </div>

      {/* Trust & Apothecary Regulatory Footer */}
      <div className="max-w-md w-full mx-auto mt-6 text-center text-[11px] text-[#6B7280]">
        <p>🔒 256-Bit SSL Encrypted • NAFDAC Certified Formulation Repository</p>
        <p className="mt-1 text-[10px] text-[#9CA3AF]">
          Health Before Beauty. Intention Before Trend. © 2026 Desla!™ African Apothecary.
        </p>
      </div>
    </div>
  );
};
