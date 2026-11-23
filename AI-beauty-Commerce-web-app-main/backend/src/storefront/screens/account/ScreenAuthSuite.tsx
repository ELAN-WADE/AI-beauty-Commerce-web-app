import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiFetch, resendVerificationEmail } from '../../lib/owned-api';
import { MfaSignIn } from '../../components/auth/MfaSignIn';
import { DeslaAuthShell, DeslaAuthTabs } from '../../components/auth/DeslaAuthShell';
import { DESLA_EASE_OUT } from '../../components/motion/DeslaMotion';
import { finishSignIn, isStaffAccount, readAuthIntent, rememberAuthIntent } from '../../lib/auth-flow';

export interface AuthSuiteProps {
  initialMode?: 'login' | 'signup' | 'forgot-password' | 'reset-password' | 'verify-email';
}

const INPUT_CLASS =
  'w-full h-11 px-3.5 rounded-[10px] border border-[#DDD7CC] hover:border-[#C5BDB0] bg-white/90 focus:bg-white text-base sm:text-sm text-[#111111] placeholder:text-[#9A948A] focus:outline-none focus:border-[#111111] focus:ring-2 focus:ring-[#B89248]/25 transition-all duration-150 [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#FFFFFF] [&:-webkit-autofill]:[-webkit-text-fill-color:#111111]';

const SUBMIT_BTN_CLASS =
  'group w-full h-11 px-5 rounded-[10px] bg-[#111111] hover:bg-[#242426] active:scale-[0.99] text-white text-sm font-medium tracking-tight shadow-sm flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89248] focus-visible:ring-offset-2';

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
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
      </svg>
    )}
    <span className="text-sm font-medium text-[#111111] tracking-tight">
      {loading ? 'Connecting to Google…' : label}
    </span>
  </button>
);

export const ScreenAuthSuite: React.FC<AuthSuiteProps> = ({ initialMode = 'login' }) => {
  const {
    navigateTo,
    authUser,
    completeMfaVerification,
    logout,
    authError,
    login,
    register,
    requestPasswordReset,
    resetPassword,
    verifyEmail,
    isLiveBackend,
    loginWithGoogle,
  } = useApp();

  const prefersReduced = useReducedMotion();

  const [mode, setMode] = useState<
    'login' | 'signup' | 'forgot-password' | 'reset-password' | 'create-new-password' | 'verify-email' | 'mfa'
  >(
    initialMode === 'reset-password' &&
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).has('token')
      ? 'create-new-password'
      : initialMode
  );

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Secure token state for Reset Password & Email Verification (backend long tokens)
  const [secureToken, setSecureToken] = useState(() =>
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') ?? '' : ''
  );

  useEffect(() => {
    const saved = readAuthIntent();
    rememberAuthIntent(saved.intent, saved.returnTo ?? undefined);
    const params = new URLSearchParams(window.location.search);
    if (params.has('token')) {
      params.delete('token');
      window.history.replaceState({}, '', window.location.pathname + (params.size ? `?${params}` : ''));
    }
  }, []);

  // Feedback & Loading
  const [busy, setBusy] = useState(false);
  const [busyGoogle, setBusyGoogle] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('mfa') === '1' &&
      authUser &&
      isStaffAccount(authUser.roles)
    ) {
      if (authUser.mfaVerified) finishSignIn(authUser);
      else setMode('mfa');
    }
  }, [authUser?.id]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const switchAuthTab = (next: 'login' | 'signup') => {
    setErrorMessage('');
    setSuccessMessage('');
    setMode(next);
  };

  const handleGoogleClick = async () => {
    if (busy || busyGoogle) return;
    setErrorMessage('');
    setSuccessMessage('');
    setBusyGoogle(true);
    try {
      await loginWithGoogle(undefined, undefined, email.trim() || undefined);
    } finally {
      setBusyGoogle(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setErrorMessage('');
    setSuccessMessage('');
    setBusy(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        setSuccessMessage(res.message);
        if (res.user) {
          if (isStaffAccount(res.user.roles) && !res.user.mfaVerified) {
            setPassword('');
            setMode('mfa');
          } else {
            finishSignIn(res.user);
          }
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
    if (busy) return;
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
    if (busy) return;
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
    if (busy) return;
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
        setSuccessMessage('Password successfully updated! Returning to sign in…');
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
    if (busy) return;
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
        } else {
          setMode('login');
        }
      } else {
        setErrorMessage(res.message);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async (verification: boolean) => {
    if (busy || resendCooldown > 0) return;
    if (!email.trim()) {
      setErrorMessage('Enter your email address to request a new link.');
      return;
    }
    setBusy(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      if (verification) {
        await resendVerificationEmail(email);
        setSecureToken('');
        setSuccessMessage(
          'Check your inbox or spam folder for a verification link or instructions for your existing account.'
        );
      } else {
        const result = await requestPasswordReset(email);
        if (!result.success) throw new Error(result.message);
        setSuccessMessage(result.message);
        setSecureToken('');
      }
      setResendCooldown(60);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not resend. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <DeslaAuthShell
      artworkSrc="/artwork/customer-auth-editorial.webp"
      artworkAlt="Desla Beauty amber glass facial serum and botanical cream on sunlit travertine"
      artworkPosition="object-[50%_76%] lg:object-[50%_92%]"
      headline="Welcome to Desla"
      subheadline="Beauty, reimagined around you."
      supportingCopy="Discover your personal beauty essentials, curated collections, and a shopping experience tailored to you."
      showSkinScanFeature={true}
      onSkinScanClick={() => navigateTo('ai-scan')}
      topAlert={
        authError ? (
          <p
            role="alert"
            className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700"
          >
            {authError}
          </p>
        ) : undefined
      }
      footerNote={
        <p className="inline-flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#B89248]" aria-hidden="true" />
          <span>256-Bit SSL Encrypted · Desla Beauty</span>
        </p>
      }
    >
      {/* Compact Top Navigation Row */}
      <div className="flex items-center justify-between mb-4">
        {mode !== 'login' && mode !== 'signup' ? (
          <button
            type="button"
            onClick={() => {
              setErrorMessage('');
              setSuccessMessage('');
              if (mode === 'reset-password') setMode('forgot-password');
              else if (mode === 'create-new-password') setMode('reset-password');
              else setMode('login');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6E6A63] hover:text-[#111111] transition-colors cursor-pointer py-1 -ml-1 px-1.5 rounded-md hover:bg-[#F5F2EB]"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6E6A63] hover:text-[#111111] transition-colors cursor-pointer py-1 -ml-1 px-1.5 rounded-md hover:bg-[#F5F2EB]"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back to Shop</span>
          </button>
        )}

        <span className="text-[10px] font-medium tracking-[0.2em] text-[#B89248] uppercase">
          Client Access
        </span>
      </div>

      {/* Primary Sign In / Create Account Underline Switcher */}
      {(mode === 'login' || mode === 'signup') && (
        <DeslaAuthTabs active={mode} onChange={switchAuthTab} className="mb-5" />
      )}

      {/* VIEW: MFA */}
      {mode === 'mfa' && authUser && (
        <MfaSignIn
          key={authUser.id}
          user={authUser}
          request={apiFetch}
          onComplete={async (user) => {
            completeMfaVerification(user);
            finishSignIn(user);
          }}
          onRestart={async () => {
            await logout();
            setMode('login');
          }}
        />
      )}

      {/* VIEW: SIGN IN */}
      {mode === 'login' && (
        <motion.div
          key="auth-login"
          initial={prefersReduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.16, ease: DESLA_EASE_OUT }}
          className="space-y-4"
        >
          <div>
            <h1 className="text-[22px] font-semibold font-heading text-[#111111] tracking-tight leading-snug">
              Sign In to Desla
            </h1>
            <p className="text-xs text-[#6E6A63] mt-1">
              Access your formulations, orders, and personalized care routine.
            </p>
          </div>

          <GoogleMinimalButton
            label="Continue with Google"
            onClick={handleGoogleClick}
            loading={busyGoogle}
          />

          <div className="relative flex items-center py-0.5">
            <div className="flex-grow border-t border-[#EAE5DC]" />
            <span className="shrink-0 mx-3 text-[10px] text-[#9A948A] uppercase tracking-[0.14em] font-medium">
              Or email
            </span>
            <div className="flex-grow border-t border-[#EAE5DC]" />
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label htmlFor="sign-in-email" className="block text-xs font-medium text-[#4A4742] mb-1">
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
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="sign-in-password" className="text-xs font-medium text-[#4A4742]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setSuccessMessage('');
                    setMode('forgot-password');
                  }}
                  className="text-xs font-medium text-[#997A2E] hover:text-[#111111] transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="sign-in-password"
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${INPUT_CLASS} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8E887F] hover:text-[#111111] cursor-pointer transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div role="alert" className="px-3.5 py-2.5 rounded-[10px] bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div role="status" className="px-3.5 py-2.5 rounded-[10px] bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                {successMessage}
              </div>
            )}

            <button type="submit" disabled={busy || busyGoogle} className={SUBMIT_BTN_CLASS}>
              {busy ? (
                <>
                  <LoaderCircle className="w-4 h-4 animate-spin text-[#E6C77A]" aria-hidden="true" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 text-[#E6C77A] transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                </>
              )}
            </button>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F0ECE4] text-xs">
              {isLiveBackend ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setMode('verify-email');
                    setSecureToken('');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="text-[#6E6A63] hover:text-[#111111] underline underline-offset-4 cursor-pointer transition-colors"
                >
                  Resend verification link
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => navigateTo('home')}
                className="text-[#6E6A63] hover:text-[#111111] font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Continue as Guest</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* VIEW: CREATE ACCOUNT */}
      {mode === 'signup' && (
        <motion.div
          key="auth-signup"
          initial={prefersReduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.16, ease: DESLA_EASE_OUT }}
          className="space-y-4"
        >
          <div>
            <h1 className="text-[22px] font-semibold font-heading text-[#111111] tracking-tight leading-snug">
              Create Your Account
            </h1>
            <p className="text-xs text-[#6E6A63] mt-1">
              Save your essentials, track deliveries, and access member rituals.
            </p>
          </div>

          <GoogleMinimalButton
            label="Continue with Google"
            onClick={handleGoogleClick}
            loading={busyGoogle}
          />

          <div className="relative flex items-center py-0.5">
            <div className="flex-grow border-t border-[#EAE5DC]" />
            <span className="shrink-0 mx-3 text-[10px] text-[#9A948A] uppercase tracking-[0.14em] font-medium">
              Or register with email
            </span>
            <div className="flex-grow border-t border-[#EAE5DC]" />
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label htmlFor="sign-up-email" className="block text-xs font-medium text-[#4A4742] mb-1">
                Email Address
              </label>
              <input
                id="sign-up-email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label htmlFor="sign-up-password" className="block text-xs font-medium text-[#4A4742] mb-1">
                Password <span className="text-[#8E887F] font-normal">(at least 8 characters)</span>
              </label>
              <div className="relative">
                <input
                  id="sign-up-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${INPUT_CLASS} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8E887F] hover:text-[#111111] cursor-pointer transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div role="alert" className="px-3.5 py-2.5 rounded-[10px] bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div role="status" className="px-3.5 py-2.5 rounded-[10px] bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                {successMessage}
              </div>
            )}

            <button type="submit" disabled={busy || busyGoogle} className={SUBMIT_BTN_CLASS}>
              {busy ? (
                <>
                  <LoaderCircle className="w-4 h-4 animate-spin text-[#E6C77A]" aria-hidden="true" />
                  <span>Creating account…</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4 text-[#E6C77A] transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                </>
              )}
            </button>

            <div className="pt-2 text-center border-t border-[#F0ECE4]">
              <button
                type="button"
                onClick={() => navigateTo('home')}
                className="text-xs text-[#6E6A63] hover:text-[#111111] font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <span>Continue Shopping as Guest</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* VIEW: FORGOT PASSWORD */}
      {mode === 'forgot-password' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FBF9F5] border border-[#EAE5DC] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#B89248]" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-semibold font-heading text-[#111111] tracking-tight">
                Account Recovery
              </h1>
              <p className="text-xs text-[#6E6A63]">
                Enter your email to receive a secure password reset link.
              </p>
            </div>
          </div>

          <form className="space-y-3.5" onSubmit={handleForgotPasswordSubmit}>
            <div>
              <label htmlFor="recovery-email" className="block text-xs font-medium text-[#4A4742] mb-1">
                Email Address
              </label>
              <input
                id="recovery-email"
                required
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={INPUT_CLASS}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {errorMessage && (
              <p role="alert" className="px-3.5 py-2.5 rounded-[10px] bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {errorMessage}
              </p>
            )}
            {successMessage && (
              <p role="status" className="px-3.5 py-2.5 rounded-[10px] bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                {successMessage}
              </p>
            )}

            <button type="submit" disabled={busy} className={SUBMIT_BTN_CLASS}>
              {busy ? (
                <>
                  <LoaderCircle className="w-4 h-4 animate-spin text-[#E6C77A]" aria-hidden="true" />
                  <span>Sending link…</span>
                </>
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <ArrowRight className="w-4 h-4 text-[#E6C77A] transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <GoogleMinimalButton label="Sign In with Google" onClick={handleGoogleClick} loading={busyGoogle} />

          <div className="px-3.5 py-2.5 rounded-xl bg-[#FBF9F5] border border-[#EAE5DC] text-center">
            <p className="text-[11px] text-[#6E6A63]">
              Need manual verification? Contact{' '}
              <a href="mailto:security@desla.com" className="text-[#997A2E] underline font-medium">
                security@desla.com
              </a>
            </p>
          </div>
        </div>
      )}

      {/* VIEW: RESET PASSWORD TOKEN */}
      {mode === 'reset-password' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FBF9F5] border border-[#EAE5DC] flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-[#B89248]" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-semibold font-heading text-[#111111] tracking-tight">
                Reset Password
              </h1>
              <p className="text-xs text-[#6E6A63]">
                Open the link in your email or paste the 64-character token below.
              </p>
            </div>
          </div>

          <form onSubmit={handleResetTokenSubmit} className="space-y-3.5">
            <div>
              <label htmlFor="reset-token-input" className="block text-xs font-medium text-[#4A4742] mb-1">
                Secure Reset Token
              </label>
              <input
                type="text"
                value={secureToken}
                onChange={(e) => setSecureToken(e.target.value.trim())}
                id="reset-token-input"
                autoComplete="off"
                placeholder="Paste token from email"
                className={`${INPUT_CLASS} font-mono text-base sm:text-xs`}
              />
              <p className="text-[11px] text-[#767168] mt-1">Tokens expire in 1 hour and are single-use.</p>
            </div>

            {errorMessage && (
              <div role="alert" className="px-3.5 py-2.5 rounded-[10px] bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div role="status" className="px-3.5 py-2.5 rounded-[10px] bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                {successMessage}
              </div>
            )}

            <button type="submit" disabled={busy} className={SUBMIT_BTN_CLASS}>
              <span>Continue</span>
              <ArrowRight className="w-4 h-4 text-[#E6C77A] transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
            </button>

            <div className="text-center">
              <button
                type="button"
                disabled={busy || resendCooldown > 0 || !email.trim()}
                onClick={() => void handleResend(false)}
                className="text-xs font-medium text-[#997A2E] hover:text-[#111111] disabled:text-[#A39E95] disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Resend reset link {resendCooldown > 0 ? `(${resendCooldown}s)` : ''}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW: CREATE NEW PASSWORD */}
      {mode === 'create-new-password' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FBF9F5] border border-[#EAE5DC] flex items-center justify-center shrink-0 relative">
              <Lock className="w-4 h-4 text-[#111111]" aria-hidden="true" />
              <CheckCircle2 className="w-3.5 h-3.5 text-[#B89248] absolute -top-1 -right-1 bg-white rounded-full" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-semibold font-heading text-[#111111] tracking-tight">
                Create New Password
              </h1>
              <p className="text-xs text-[#6E6A63]">
                Choose a strong password different from your previous one.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateNewPasswordSubmit} className="space-y-3.5">
            <div>
              <label htmlFor="new-password-input" className="block text-xs font-medium text-[#4A4742] mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${INPUT_CLASS} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8E887F] hover:text-[#111111] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password-input" className="block text-xs font-medium text-[#4A4742] mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password-input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`${INPUT_CLASS} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8E887F] hover:text-[#111111] cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div role="alert" className="px-3.5 py-2.5 rounded-[10px] bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div role="status" className="px-3.5 py-2.5 rounded-[10px] bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                {successMessage}
              </div>
            )}

            <button type="submit" disabled={busy} className={SUBMIT_BTN_CLASS}>
              {busy ? (
                <>
                  <LoaderCircle className="w-4 h-4 animate-spin text-[#E6C77A]" aria-hidden="true" />
                  <span>Updating Password…</span>
                </>
              ) : (
                <>
                  <span>Update Password</span>
                  <ArrowRight className="w-4 h-4 text-[#E6C77A] transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* VIEW: EMAIL VERIFICATION */}
      {mode === 'verify-email' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FBF9F5] border border-[#EAE5DC] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#B89248]" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-semibold font-heading text-[#111111] tracking-tight">
                {secureToken ? 'Verify Your Email' : 'Check Your Email'}
              </h1>
              <p className="text-xs text-[#6E6A63]">
                {secureToken
                  ? 'Confirm your email to sign in and continue.'
                  : 'We sent a verification link or account instructions to your inbox.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleVerifyEmailSubmit} className="space-y-3.5">
            <details open={secureToken ? true : undefined} className="rounded-xl border border-[#EAE5DC] bg-[#FBF9F5]/60 p-3">
              <summary className="cursor-pointer text-xs font-medium text-[#4A4742]">
                Have a verification token?
              </summary>
              <div className="mt-3 space-y-2.5">
                <div>
                  <label htmlFor="email-verification-token" className="block text-xs font-medium text-[#4A4742] mb-1">
                    Verification token
                  </label>
                  <input
                    type="text"
                    value={secureToken}
                    onChange={(e) => setSecureToken(e.target.value.trim())}
                    id="email-verification-token"
                    autoComplete="off"
                    placeholder="Paste token from email"
                    className={`${INPUT_CLASS} font-mono text-base sm:text-xs`}
                  />
                  <p className="text-[11px] text-[#767168] mt-1">Tokens expire in 24 hours and are single-use.</p>
                </div>

                <button type="submit" disabled={busy} className={SUBMIT_BTN_CLASS}>
                  {busy ? (
                    <>
                      <LoaderCircle className="w-4 h-4 animate-spin text-[#E6C77A]" aria-hidden="true" />
                      <span>Verifying…</span>
                    </>
                  ) : (
                    <span>Verify Email</span>
                  )}
                </button>
              </div>
            </details>

            {errorMessage && (
              <div role="alert" className="px-3.5 py-2.5 rounded-[10px] bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div role="status" className="px-3.5 py-2.5 rounded-[10px] bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                {successMessage}
              </div>
            )}

            {isLiveBackend && (
              <div className="space-y-2.5">
                <label className="block text-xs font-medium text-[#4A4742]">
                  Email address
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={`${INPUT_CLASS} mt-1`}
                  />
                </label>
                <button
                  type="button"
                  disabled={busy || resendCooldown > 0 || !email.trim()}
                  onClick={() => void handleResend(true)}
                  className="w-full text-xs font-medium underline underline-offset-4 text-[#6E6A63] hover:text-[#111111] disabled:opacity-50 cursor-pointer"
                >
                  Send account email {resendCooldown > 0 ? `(${resendCooldown}s)` : ''}
                </button>
              </div>
            )}
          </form>

          <div className="pt-3 border-t border-[#F0ECE4] flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className="font-medium text-[#111111] underline underline-offset-4 cursor-pointer"
            >
              Go to Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('forgot-password');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className="text-[#6E6A63] hover:text-[#111111] underline underline-offset-4 cursor-pointer"
            >
              Reset password
            </button>
          </div>
        </div>
      )}
    </DeslaAuthShell>
  );
};
