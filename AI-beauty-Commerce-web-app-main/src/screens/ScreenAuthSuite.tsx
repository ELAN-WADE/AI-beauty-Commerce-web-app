import React, { useState, useRef, useEffect } from 'react';
import {
  Lock,
  Mail,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  KeyRound,
  User,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ScreenId } from '../types';

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
    setSimulatedUserRole
  } = useApp();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password' | 'reset-password' | 'create-new-password' | 'verify-email'>(
    initialMode === 'reset-password' ? 'reset-password' : initialMode
  );

  // Form states
  const [email, setEmail] = useState('amina.bello@example.com');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 4-Digit OTP PIN state for Reset Password & Email Verification
  const [otpDigits, setOtpDigits] = useState(['5', '7', '3', '9']);
  const pinInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  // Feedback & Loading
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(54);
  const [devTokenEcho, setDevTokenEcho] = useState<string | null>(null);

  // Countdown timer for OTP Resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle OTP 4-Box Key Navigation
  const handleDigitChange = (index: number, value: string) => {
    const char = value.slice(-1);
    if (!/^\d*$/.test(char)) return;

    const nextDigits = [...otpDigits];
    nextDigits[index] = char;
    setOtpDigits(nextDigits);

    if (char && index < 3) {
      pinInputRefs[index + 1].current?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      pinInputRefs[index - 1].current?.focus();
    }
  };

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
      const res = await register(email, password);
      if (res.success) {
        setSuccessMessage(res.message);
        setTimeout(() => {
          setMode('verify-email');
        }, 1000);
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
        if (res.devToken) {
          setDevTokenEcho(res.devToken);
          const digits = res.devToken.slice(0, 4).split('');
          if (digits.length === 4) setOtpDigits(digits);
        }
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

  const handleVerifyOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pin = otpDigits.join('');
    if (pin.length < 4) {
      setErrorMessage('Please enter all 4 digits.');
      return;
    }
    setErrorMessage('');
    setSuccessMessage('Code verified!');
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
    setBusy(true);
    try {
      const token = devTokenEcho || otpDigits.join('');
      const res = await resetPassword(token, password);
      if (res.success) {
        setSuccessMessage('Password successfully updated! Returning to login…');
        setTimeout(() => {
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
    const token = otpDigits.join('');
    setBusy(true);
    setErrorMessage('');
    try {
      const res = await verifyEmail(token);
      if (res.success) {
        setSuccessMessage(res.message);
        setTimeout(() => {
          navigateTo('account');
        }, 1000);
      } else {
        setErrorMessage(res.message);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F5] text-[#0F0F10] font-body flex flex-col justify-between selection:bg-[#D4AF37]/20 selection:text-[#997A2E] p-4 sm:p-6 lg:p-10">
      {/* Dev Role Quick Preview Switcher (Allows testing Admin/Creator/Distributor right away) */}
      <div className="max-w-md w-full mx-auto mb-4 bg-white/70 backdrop-blur-md rounded-2xl p-2.5 border border-white/80 shadow-xs flex items-center justify-between text-[11px]">
        <span className="font-mono text-[#6B7280] font-semibold flex items-center gap-1.5">
          <KeyRound className="w-3.5 h-3.5 text-[#D4AF37]" /> Demo Roles:
        </span>
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
            className="px-2.5 py-1 rounded-lg bg-[#FAF9F6] border border-[#E5E7EB] font-semibold text-[#0F0F10] hover:bg-white active:scale-95 transition-transform cursor-pointer"
          >
            Creator
          </button>
          <button
            type="button"
            onClick={() => {
              setSimulatedUserRole('DISTRIBUTOR');
              navigateTo('distributor-portal');
            }}
            className="px-2.5 py-1 rounded-lg bg-[#FAF9F6] border border-[#E5E7EB] font-semibold text-[#0F0F10] hover:bg-white active:scale-95 transition-transform cursor-pointer"
          >
            Distributor
          </button>
        </div>
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
        {/* VIEW 2: RESET PASSWORD / 4-DIGIT PIN (Figma Screen 2)   */}
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
                Please enter the 4 digit code sent to <span className="font-semibold text-[#0F0F10]">{email}</span>
              </p>
            </div>

            {/* Dev Helper Token Note */}
            {devTokenEcho && (
              <div className="mb-5 p-2.5 rounded-xl bg-[#FAF9F6] border border-[#D4AF37]/40 text-center">
                <span className="text-[11px] text-[#997A2E] font-mono">
                  Dev Echo Code: <strong className="text-sm tracking-widest">{devTokenEcho}</strong>
                </span>
              </div>
            )}

            {/* 4 Discrete Square Digit PIN Boxes */}
            <form onSubmit={handleVerifyOtpSubmit} className="space-y-6">
              <div className="flex justify-center items-center gap-3 sm:gap-4">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={pinInputRefs[index]}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(index, e)}
                    className="w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl font-mono font-bold text-[#0F0F10] bg-white rounded-2xl border-2 border-[#D1D5DB] focus:border-[#0F0F10] focus:ring-2 focus:ring-[#0F0F10]/10 focus:outline-none transition-all shadow-xs"
                  />
                ))}
              </div>

              {/* Resend Code Link */}
              <div className="text-center">
                <button
                  type="button"
                  disabled={resendCooldown > 0}
                  onClick={() => {
                    setResendCooldown(59);
                    requestPasswordReset(email);
                  }}
                  className={`text-xs font-semibold transition-colors cursor-pointer ${
                    resendCooldown > 0 ? 'text-[#9CA3AF] cursor-not-allowed' : 'text-[#0284C7] hover:text-[#0369A1]'
                  }`}
                >
                  Resend Code {resendCooldown > 0 ? `(${resendCooldown}s)` : ''}
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
                Verify
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

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
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
                <label className="block text-xs font-medium text-[#4B5563] mb-1">
                  Password (min 8 characters)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
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
                {busy ? 'Registering…' : 'Register Account'}
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
                Enter the 4-digit verification code sent to <span className="font-semibold text-[#0F0F10]">{email}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyEmailSubmit} className="space-y-6">
              <div className="flex justify-center items-center gap-3 sm:gap-4">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={pinInputRefs[index]}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(index, e)}
                    className="w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl font-mono font-bold text-[#0F0F10] bg-white rounded-2xl border-2 border-[#D1D5DB] focus:border-[#0F0F10] focus:ring-2 focus:ring-[#0F0F10]/10 focus:outline-none transition-all shadow-xs"
                  />
                ))}
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
