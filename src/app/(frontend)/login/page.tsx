'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Gamepad2,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  LogIn,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  RefreshCw,
  Clock,
  ArrowRight,
  Send,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type Tab = 'login' | 'register';

interface AuthContentProps {
  forcedTab?: Tab;
}

function AuthContent({ forcedTab }: AuthContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register, isAdmin, isLoggedIn } = useAuth();

  const queryTab = (searchParams.get('tab') as Tab) || undefined;
  const initialTab: Tab = forcedTab || queryTab || 'login';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // OTP Verification state
  const [regOtp, setRegOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0); // 10-minute expiry (600s)
  const [resendCooldown, setResendCooldown] = useState(0); // 60s cooldown
  const [otpSuccessMessage, setOtpSuccessMessage] = useState('');

  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reason = searchParams.get('reason');
  const redirectParam = searchParams.get('redirect');

  // If already logged in, redirect away
  useEffect(() => {
    if (reason === 'unauthorized') return;

    if (isAdmin) {
      router.replace('/dashboard');
    } else if (isLoggedIn) {
      router.replace(redirectParam && redirectParam !== '/login' && redirectParam !== '/dashboard' ? redirectParam : '/');
    }
  }, [isAdmin, isLoggedIn, reason, redirectParam, router]);

  // Handle Tab Change
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setError('');
    setSuccess('');
  };

  // Timer countdown effect for OTP expiry and resend cooldown
  useEffect(() => {
    if (!otpSent) return;
    const interval = setInterval(() => {
      setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpSent]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ── Handle Requesting / Sending 6-Digit Email OTP ─────────────────────────
  const handleSendOtp = useCallback(async () => {
    setError('');
    setSuccess('');
    setOtpSuccessMessage('');

    const trimmedName = regName.trim();
    const trimmedEmail = regEmail.trim().toLowerCase();
    const trimmedPass = regPassword.trim();
    const trimmedConfirm = regConfirmPassword.trim();

    if (!trimmedName) {
      setError('Please enter your full name before requesting a verification code.');
      return false;
    }

    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return false;
    }

    if (!trimmedPass) {
      setError('Please enter a password before requesting a verification code.');
      return false;
    }

    if (trimmedPass.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }

    if (trimmedPass !== trimmedConfirm) {
      setError('Passwords do not match. Please verify and try again.');
      return false;
    }

    setIsSendingOtp(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOtpSent(true);
        setOtpTimer(600); // 10 minutes (600s)
        setResendCooldown(60); // 60 seconds cooldown
        setOtpSuccessMessage(data.message || `Verification code sent to ${trimmedEmail}!`);
        return true;
      } else {
        setError(data.error || 'Failed to send verification code. Please try again.');
        return false;
      }
    } catch {
      setError('Network connection error while requesting verification code.');
      return false;
    } finally {
      setIsSendingOtp(false);
    }
  }, [regName, regEmail, regPassword, regConfirmPassword]);

  // ── Handle Sign In ────────────────────────────────────────────────────────
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const result = await login(loginEmail, loginPassword);
      if (result.success && result.user) {
        if (result.user.role === 'admin') {
          router.replace(redirectParam && redirectParam !== '/login' ? redirectParam : '/dashboard');
        } else {
          router.replace(redirectParam && redirectParam !== '/login' && redirectParam !== '/dashboard' ? redirectParam : '/');
        }
      } else {
        setError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Handle Registration ───────────────────────────────────────────────────
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // If OTP hasn't been sent yet, trigger OTP request first
    if (!otpSent) {
      await handleSendOtp();
      return;
    }

    const cleanOtp = regOtp.trim();
    if (!cleanOtp) {
      setError('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    if (!/^\d{6}$/.test(cleanOtp)) {
      setError('Verification code must be exactly 6 digits.');
      return;
    }

    if (otpTimer <= 0) {
      setError('Your verification code has expired. Please click Resend Code.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await register(regName, regEmail, regPassword, cleanOtp);
      if (result.success && result.user) {
        setSuccess(`Welcome, ${result.user.name}! Your account has been verified and created. Redirecting...`);
        setTimeout(() => {
          router.replace(redirectParam && redirectParam !== '/login' && redirectParam !== '/dashboard' ? redirectParam : '/');
        }, 1200);
      } else {
        setError(result.error || 'Registration failed. Please check the code and try again.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative overflow-hidden py-12 px-4 sm:px-6 transition-colors duration-300">
      {/* Animated background gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-purple-700/15 dark:bg-purple-700/20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-cyan-600/15 dark:bg-cyan-600/20 blur-3xl animate-pulse delay-700" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-indigo-700/10 blur-3xl" />
      </div>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(100,116,139,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(100,116,139,.4) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 transition-all">
          {/* Logo / Brand Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[2px] shadow-lg shadow-purple-500/30 mb-3">
              <div className="w-full h-full bg-slate-900 dark:bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Gamepad2 className="w-8 h-8 text-cyan-400" />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 dark:from-purple-400 dark:via-cyan-400 dark:to-pink-400 bg-clip-text text-transparent">
              A7med Arcade
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 text-center">
              {activeTab === 'login'
                ? 'Member Authentication Portal'
                : 'Verified Member Registration Portal'}
            </p>
          </div>

          {/* Alert: Admin Unauthorized */}
          {reason === 'unauthorized' && (
            <div className="flex items-start gap-3 p-3.5 mb-5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs sm:text-sm">
              <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-amber-500 dark:text-amber-400" />
              <span>Admin privileges required. Please sign in with the administrator account to access the Dashboard.</span>
            </div>
          )}

          {/* Alert: Storefront Auth Required */}
          {reason === 'auth_required' && (
            <div className="flex items-start gap-3 p-3.5 mb-5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs sm:text-sm animate-in fade-in">
              <Lock className="w-4 h-4 mt-0.5 shrink-0 text-cyan-500 dark:text-cyan-400" />
              <span>Sign-In Required: Guest access is disabled. Please sign in or create an account to access the platform storefront and games.</span>
            </div>
          )}

          {/* Alert: Download Auth Required */}
          {reason === 'download_auth' && (
            <div className="flex items-start gap-3 p-3.5 mb-5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-xs sm:text-sm animate-in fade-in">
              <Lock className="w-4 h-4 mt-0.5 shrink-0 text-cyan-500 dark:text-cyan-400" />
              <span>Mandatory Login: You must be logged in with a registered account to download game archives.</span>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-3 p-3.5 mb-5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs sm:text-sm animate-in fade-in">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="flex items-start gap-3 p-3.5 mb-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
              <span>{success}</span>
            </div>
          )}

          {/* Tab Switcher */}
          <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-950/80 p-1.5 border border-slate-200 dark:border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => handleTabChange('login')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'login'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('register')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'register'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </button>
          </div>

          {/* ── SIGN IN FORM ── */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    id="login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-2.5 sm:py-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white shadow-lg shadow-purple-500/20 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Arcade</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── CREATE ACCOUNT FORM WITH 6-DIGIT OTP ── */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="reg-name"
                  className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    id="reg-name"
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    disabled={otpSent}
                    autoComplete="name"
                    placeholder="Your Name"
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Email Address + Send Code CTA */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="reg-email"
                    className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider"
                  >
                    Email Address
                  </label>
                  {otpSent && (
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setRegOtp('');
                        setOtpSuccessMessage('');
                      }}
                      className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-medium"
                    >
                      Change email
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    id="reg-email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    disabled={otpSent}
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="reg-password"
                  className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5"
                >
                  Password (min. 6 characters)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    id="reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    disabled={otpSent}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-2.5 sm:py-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="reg-confirm"
                  className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    id="reg-confirm"
                    type={showRegPassword ? 'text' : 'password'}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    required
                    disabled={otpSent}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* ── STEP 2: 6-DIGIT OTP VERIFICATION SECTION ── */}
              {otpSent && (
                <div className="p-4 rounded-2xl bg-purple-500/5 dark:bg-purple-950/20 border border-purple-500/20 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                      <KeyRound className="w-4 h-4 text-cyan-500" />
                      <span>6-Digit Verification Code</span>
                    </div>

                    {/* Expiry Timer Badge */}
                    <div
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                        otpTimer > 120
                          ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/20'
                          : otpTimer > 0
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20 animate-pulse'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{otpTimer > 0 ? formatTime(otpTimer) : 'Expired'}</span>
                    </div>
                  </div>

                  {otpSuccessMessage && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      ✓ {otpSuccessMessage}
                    </p>
                  )}

                  <div className="relative">
                    <input
                      id="reg-otp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={regOtp}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setRegOtp(val);
                      }}
                      required
                      autoComplete="one-time-code"
                      placeholder="••••••"
                      className="w-full text-center text-xl sm:text-2xl font-mono tracking-[0.4em] font-extrabold py-3 px-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-purple-500/40 dark:border-cyan-500/40 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all shadow-inner"
                    />
                  </div>

                  {/* Resend Code Button & Notice */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500 dark:text-slate-400">Didn&apos;t receive it?</span>
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || isSendingOtp}
                      onClick={handleSendOtp}
                      className="inline-flex items-center gap-1.5 font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSendingOtp ? 'animate-spin' : ''}`} />
                      <span>
                        {isSendingOtp
                          ? 'Sending...'
                          : resendCooldown > 0
                          ? `Resend in ${resendCooldown}s`
                          : 'Resend Code'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* ── ACTION BUTTONS ── */}
              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSendingOtp}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white shadow-lg shadow-purple-500/25 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-3 hover:scale-[1.01] active:scale-[0.99]"
                >
                  {isSendingOtp ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Sending Verification Code…</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-cyan-300" />
                      <span>Send 6-Digit Verification Code</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || regOtp.length !== 6 || otpTimer <= 0}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white shadow-lg shadow-purple-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-3 hover:scale-[1.01] active:scale-[0.99]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Verifying &amp; Creating Account…</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-300" />
                      <span>Verify &amp; Create Account</span>
                    </>
                  )}
                </button>
              )}
            </form>
          )}

          {/* Security Notice Footer */}
          <div className="mt-8 pt-5 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
            <span>Protected by A7med Arcade Secure OTP Access</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}

export { AuthContent };
