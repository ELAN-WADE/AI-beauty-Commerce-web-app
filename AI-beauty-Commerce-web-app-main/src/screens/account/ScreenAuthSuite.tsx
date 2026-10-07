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
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { resendVerificationEmail } from '../../lib/owned-api';
import { ScreenId } from '../../types';

export interface AuthSuiteProps {
  initialMode?: 'login' | 'signup' | 'forgot-password' | 'reset-password' | 'verify-email';
}

export const ScreenAuthSuite: React.FC<AuthSuiteProps> = ({ initialMode = 'login' }) => {
  const {
    navigateTo,
    authUser,
    login,
    register,
    requestPasswordReset,
    resetPassword,
    verifyEmail,
    isLiveBackend,
    setSimulatedUserRole,
    loginAsDemoRole,
    enterPreviewRole,
    exitPreviewRole,
    isPreviewMode,
    previewRole
  } = useApp();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password' | 'reset-password' | 'create-new-password' | 'verify-email'>(
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
    if (window.location.search.includes('token=')) window.history.replaceState({}, '', window.location.pathname);
  }, []);

  // Feedback & Loading
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [devTokenEcho, setDevTokenEcho] = useState<string | null>(null);

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
        setTimeout(() => {
          navigateTo('home');
        }, 800);
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
      const targetEmail = email.trim() || 'amina.bello@example.com';
      loginAsDemoRole('CUSTOMER');
      setSuccessMessage('Welcome! Your account is active.');
      setTimeout(() => {
        navigateTo('account');
      }, 500);
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
        setDevTokenEcho(res.devToken ?? null);
        setSecureToken(res.devToken ?? '');
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
    if (!isLiveBackend) {
      setErrorMessage('');
      setSuccessMessage('Demo code accepted — set a new password.');
      setTimeout(() => setMode('create-new-password'), 400);
      return;
    }
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
    const token = (secureToken || devTokenEcho || '').trim();
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
        setDevTokenEcho(null);
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
    const token = secureToken.trim() || 'demo-bypass';
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
        setDevTokenEcho(null);
        setTimeout(() => {
          window.history.replaceState({}, '', '/');
          setMode('login');
        }, 1000);
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
        setSuccessMessage('If this email is awaiting verification, a new link will arrive shortly.');
      } else {
        const result = await requestPasswordReset(email);
        if (!result.success) throw new Error(result.message);
        setSuccessMessage(result.message);
        setDevTokenEcho(result.devToken ?? null);
        setSecureToken(result.devToken ?? '');
      }
      setResendCooldown(60);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not resend. Please try again.');
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F5] text-[#0F0F10] font-body flex flex-col justify-between selection:bg-[#D4AF37]/20 selection:text-[#997A2E] p-4 sm:p-6 lg:p-10">
      {/* Role shortcuts: real sign-in in dev+live, mock/preview otherwise. */}
      <div className="max-w-md w-full mx-auto mb-4 bg-white/70 backdrop-blur-md rounded-2xl p-2.5 border border-white/80 shadow-xs flex items-center justify-between text-[11px]">
        <span className="font-mono text-[#6B7280] font-semibold flex items-center gap-1.5">
          <KeyRound className="w-3.5 h-3.5 text-[#D4AF37]" /> Demo Roles:
        </span>
        {isLiveBackend && import.meta.env.DEV ? (
          <div className="flex items-center gap-1">
            {([
              { label: 'Admin', email: 'admin@desla.local', password: 'AdminPass123', primary: true, target: 'admin-console' },
              { label: 'Creator', email: 'creator@desla.local', password: 'CreatorPass123', primary: false, target: 'creators' },
              { label: 'Distributor', email: 'distributor@desla.local', password: 'DistributorPass123', primary: false, target: 'distributor-portal' },
            ] as const).map((role) => (
              <button
                key={role.label}
                type="button"
                disabled={busy}
                title={`Sign in as ${role.email} and open the dashboard`}
                onClick={() => {
                  void (async () => {
                    setBusy(true);
                    setErrorMessage('');
                    setSuccessMessage('');
                    try {
                      const res = await login(role.email, role.password);
                      if (res.success) navigateTo(role.target as ScreenId);
                      else setErrorMessage(res.message);
                    } finally {
                      setBusy(false);
                    }
                  })();
                }}
                className={
                  role.primary
                    ? 'px-2.5 py-1 rounded-lg bg-[#0F0F10] text-[#D4AF37] font-bold hover:bg-[#1F1F22] active:scale-95 transition-transform cursor-pointer'
                    : 'px-2.5 py-1 rounded-lg bg-[#FAF9F6] border border-[#E5E7EB] font-semibold text-[#0F0F10] hover:bg-white active:scale-[0.97] transition-all cursor-pointer'
                }
              >
                {role.label}
              </button>
            ))}
          </div>
        ) : !isLiveBackend ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setSimulatedUserRole('SUPER_ADMIN');
              navigateTo('admin-console');
            }}
            className="px-2.5 py-1 rounded-lg bg-[#0F0F10] text-[#D4AF37] font-bold hover:bg-[#1F1F22] active:scale-95 transition-transform cursor-pointer"
          >
            Admin View
          </button>
          <button
            type="button"
            onClick={() => {
              setSimulatedUserRole('CREATOR');
              navigateTo('creators');
            }}
            className="px-2.5 py-1 rounded-lg bg-[#FAF9F6] border border-[#E5E7EB] font-semibold text-[#0F0F10] hover:bg-white active:scale-[0.97] transition-all cursor-pointer"
          >
            Creator
          </button>
          <button
            type="button"
            onClick={() => {
              setSimulatedUserRole('DISTRIBUTOR');
              navigateTo('distributor-portal');
            }}
            className="px-2.5 py-1 rounded-lg bg-[#FAF9F6] border border-[#E5E7EB] font-semibold text-[#0F0F10] hover:bg-white active:scale-[0.97] transition-all cursor-pointer"
          >
            Distributor
          </button>
        </div>
        ) : (
        <div className="flex items-center gap-1">
          {isPreviewMode ? (
            <button
              type="button"
              onClick={() => exitPreviewRole()}
              className="px-2.5 py-1 rounded-lg bg-[#0F0F10] text-[#D4AF37] font-bold cursor-pointer"
            >
              Exit preview{previewRole ? ` (${previewRole})` : ''}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  enterPreviewRole('SUPER_ADMIN');
                  navigateTo('admin-console');
                }}
                className="px-2.5 py-1 rounded-lg bg-[#0F0F10] text-[#D4AF37] font-bold hover:bg-[#1F1F22] active:scale-95 transition-transform cursor-pointer"
              >
                Preview Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  enterPreviewRole('CREATOR');
                  navigateTo('creators');
                }}
                className="px-2.5 py-1 rounded-lg bg-[#FAF9F6] border border-[#E5E7EB] font-semibold text-[#0F0F10] hover:bg-white active:scale-[0.97] transition-all cursor-pointer"
              >
                Preview Creator
              </button>
              <button
                type="button"
                onClick={() => {
                  enterPreviewRole('DISTRIBUTOR');
                  navigateTo('distributor-portal');
                }}
                className="px-2.5 py-1 rounded-lg bg-[#FAF9F6] border border-[#E5E7EB] font-semibold text-[#0F0F10] hover:bg-white active:scale-[0.97] transition-all cursor-pointer"
              >
                Preview Distributor
              </button>
            </>
          )}
        </div>
        )}
      </div>

      {/* Main Centered Mobile/Desktop Card matching @uyais Figma Reference */}
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
              <div className="w-24 h-24 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center shadow-inner">
                <div className="relative">
                  <Lock className="w-10 h-10 text-[#4B5563] stroke-[1.8]" />
                  <HelpCircle className="w-4 h-4 text-[#D4AF37] absolute -top-1 -right-1 fill-white" />
                </div>
              </div>
            </div>

            {/* Typography & Subtitle */}
            <div className="text-center mb-7">
              <h1 className="text-2xl font-bold font-heading text-[#0F0F10] tracking-tight">
                Forgot Password
              </h1>
              <p className="text-xs text-[#6B7280] mt-2 max-w-xs mx-auto leading-relaxed">
                Please enter your email address to reset your password
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="johndoe@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#D1D5DB] bg-white text-sm text-[#0F0F10] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#0F0F10] focus:ring-1 focus:ring-[#0F0F10] transition-all"
                  />
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
                className="w-full py-3.5 px-6 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-sm font-semibold tracking-wide shadow-md active:scale-[0.97] transition-all duration-150 cursor-pointer disabled:opacity-60"
              >
                {busy ? 'Sending Code…' : 'Continue'}
              </button>

              {/* Bottom Back to Login */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-[#6B7280] hover:text-[#0F0F10] font-medium transition-colors cursor-pointer"
                >
                  Back to Login
                </button>
              </div>
            </form>
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

            {/* Dev Helper Token Note */}
            {devTokenEcho && (
              <div className="mb-5 p-2.5 rounded-xl bg-[#FAF9F6] border border-[#D4AF37]/40 text-center break-all">
                <span className="text-[11px] text-[#997A2E] font-mono">
                  Dev token: <strong className="text-xs">{devTokenEcho}</strong>
                </span>
              </div>
            )}

            {/* Secure token input */}
            <form onSubmit={handleResetTokenSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Secure reset token</label>
                <input
                  type="text"
                  value={secureToken}
                  onChange={(e) => setSecureToken(e.target.value.trim())}
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

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="amina.bello@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#D1D5DB] bg-white text-sm text-[#0F0F10] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#0F0F10] focus:ring-1 focus:ring-[#0F0F10] transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-[#4B5563]">
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
                Unlock clinical skin tracking, order dispatch &amp; member benefits.
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

            {/* INSTANT 1-CLICK DEMO ACCESS (No Auth Required) */}
            <div className="mb-6 p-4 rounded-2xl bg-white border border-[#D4AF37]/50 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#997A2E] flex items-center gap-1.5">
                  <Sparkles size={13} className="text-[#D4AF37]" />
                  <span>Instant 1-Click Demo Access</span>
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">Active</span>
              </div>
              <p className="text-[11px] text-[#4B5563] leading-relaxed">
                Click a role below to gain immediate access with verified privileges:
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    loginAsDemoRole('CUSTOMER');
                    navigateTo('account');
                  }}
                  className="py-2.5 px-2 rounded-xl bg-[#0F0F10] text-[#D4AF37] hover:bg-[#27272A] text-[11px] font-bold text-center active:scale-[0.97] transition-all cursor-pointer shadow-2xs"
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    loginAsDemoRole('CREATOR');
                    navigateTo('creators');
                  }}
                  className="py-2.5 px-2 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] hover:border-[#D4AF37] text-[#0F0F10] text-[11px] font-bold text-center active:scale-[0.97] transition-all cursor-pointer shadow-2xs"
                >
                  Creator Studio
                </button>
                <button
                  type="button"
                  onClick={() => {
                    loginAsDemoRole('DISTRIBUTOR');
                    navigateTo('distributor-portal');
                  }}
                  className="py-2.5 px-2 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] hover:border-[#D4AF37] text-[#0F0F10] text-[11px] font-bold text-center active:scale-[0.97] transition-all cursor-pointer shadow-2xs"
                >
                  Distributor Hub
                </button>
              </div>
            </div>

            <div className="relative flex py-2 items-center mb-4">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-3 text-[10px] text-[#9CA3AF] font-mono uppercase tracking-wider">Or Register Custom Profile</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="amina.bello@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#D1D5DB] bg-white text-sm text-[#0F0F10] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#0F0F10] focus:ring-1 focus:ring-[#0F0F10] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1">
                  Password (optional)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Optional password (instant access)"
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
                {busy ? 'Creating Account…' : 'Create & Enter Instant Account'}
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
                Verify Your Email
              </h1>
              <p className="text-xs text-[#6B7280] mt-2 max-w-xs mx-auto leading-relaxed">
                {secureToken ? 'Your email link is ready. Confirm below to verify your address.' : 'Open the verification link in your inbox, or paste its token below.'}
              </p>
            </div>

            <form onSubmit={handleVerifyEmailSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Verification token</label>
                <input
                  type="text"
                  value={secureToken}
                  onChange={(e) => setSecureToken(e.target.value.trim())}
                  placeholder="Paste token from email"
                  className="w-full px-4 py-3 rounded-xl border border-[#D1D5DB] bg-white text-xs font-mono text-[#0F0F10] focus:outline-none focus:border-[#0F0F10] transition-all"
                />
                <p className="text-[11px] text-[#6B7280] mt-1">Tokens expire in 24 hours and are single-use.</p>
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
                {busy ? 'Verifying…' : 'Verify Email'}
              </button>
              {isLiveBackend && <div className="space-y-3">
                <label className="block text-xs text-[#4B5563]">Email address for a new link
                  <input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1 w-full px-4 py-3 rounded-xl border border-[#D1D5DB] bg-white text-sm" />
                </label>
                <button type="button" disabled={busy || resendCooldown > 0 || !email.trim()} onClick={() => void handleResend(true)} className="w-full text-xs underline text-[#4B5563] disabled:opacity-50">Resend verification link {resendCooldown > 0 ? `(${resendCooldown}s)` : ''}</button>
              </div>}
            </form>
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
