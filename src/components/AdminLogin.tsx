import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  RefreshCcw
} from 'lucide-react';
import { api } from '../services/api';
import { OneTapLogo } from './OneTapLogo';
import { ErrorAlert } from './ErrorAlert';

interface AdminLoginProps {
  onLoginSuccess: (token: string, admin: { id: string; email: string }) => void;
  onBackToStore: () => void;
}

type AdminStep = 'login' | 'forgot-email' | 'forgot-otp' | 'forgot-reset';

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onBackToStore
}) => {
  const [step, setStep] = useState<AdminStep>('login');

  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Forgot password flow
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // Resend OTP countdown
  const [resendCooldown, setResendCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startResendTimer = () => {
    setResendCooldown(30);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const resetAll = () => {
    setStep('login');
    setForgotEmail('');
    setOtpCode('');
    setNewPassword('');
    setForgotError('');
    setForgotSuccess('');
    setResendCooldown(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // ─── Login ───────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessNotice('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMsg('Please enter both your administrator email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.adminLogin(cleanEmail, cleanPassword);
      if (res && res.success && res.token) {
        onLoginSuccess(res.token, res.admin);
      } else {
        throw new Error('Authentication failed.');
      }
    } catch (err: any) {
      console.error('Admin login error:', err);
      setErrorMsg(err?.message || 'Invalid administrator credentials. Access denied.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Send OTP ─────────────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setForgotError('Please enter your admin email address.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await api.sendPasswordResetOtp(cleanEmail);
      if (res.success) {
        setForgotSuccess('A 6-digit OTP has been sent to your email.');
        setStep('forgot-otp');
        startResendTimer();
      } else {
        setForgotError(res.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err: any) {
      setForgotError(err?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  // ─── Resend OTP ───────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setForgotError('');
    setForgotSuccess('');
    setForgotLoading(true);
    try {
      const res = await api.sendPasswordResetOtp(forgotEmail.trim().toLowerCase());
      if (res.success) {
        setForgotSuccess('A new OTP has been sent to your email.');
        startResendTimer();
      } else {
        setForgotError(res.message || 'Failed to resend OTP.');
      }
    } catch (err: any) {
      setForgotError(err?.message || 'Failed to resend OTP.');
    } finally {
      setForgotLoading(false);
    }
  };

  // ─── Verify OTP ───────────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setForgotError('Please enter the 6-digit OTP sent to your email.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await api.verifyPasswordResetOtp(forgotEmail.trim().toLowerCase(), otpCode.trim());
      if (res.success) {
        setForgotSuccess('OTP verified! Set your new password below.');
        setStep('forgot-reset');
      } else {
        setForgotError(res.message || 'Invalid or expired OTP.');
      }
    } catch (err: any) {
      setForgotError(err?.message || 'Invalid or expired OTP.');
    } finally {
      setForgotLoading(false);
    }
  };

  // ─── Reset Password ───────────────────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    const cleanPassword = newPassword.trim();
    if (!cleanPassword || cleanPassword.length < 6) {
      setForgotError('Password must be at least 6 characters long.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await api.resetPasswordWithOtp(
        forgotEmail.trim().toLowerCase(),
        otpCode.trim(),
        cleanPassword
      );
      if (res.success) {
        setSuccessNotice('Password reset successfully! You can now login with your new password.');
        resetAll();
      } else {
        setForgotError(res.message || 'Failed to reset password.');
      }
    } catch (err: any) {
      setForgotError(err?.message || 'Failed to reset password.');
    } finally {
      setForgotLoading(false);
    }
  };

  // ─── Shared card wrapper ─────────────────────────────────────────────────
  const renderHeader = (title: string, subtitle: string) => (
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <button
        type="button"
        onClick={step === 'login' ? onBackToStore : resetAll}
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#64748B] hover:text-[#111827] mb-6 cursor-pointer group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
        <span>{step === 'login' ? 'Back to Storefront' : 'Back to Login'}</span>
      </button>

      <div className="flex items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-xl border border-[#E2E8F0] bg-white p-0.5 flex items-center justify-center shadow-2xs">
          <OneTapLogo className="w-full h-full" />
        </div>
        <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">
          OneTap<span className="text-[#6D5DFB]">Link</span>{' '}
          <span className="text-lg font-bold text-[#64748B]">Admin</span>
        </h2>
      </div>
      <p className="mt-2 text-center text-xs text-[#64748B]">{subtitle}</p>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP: Login
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'login') {
    return (
      <div id="admin-login-page" className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        {renderHeader('Admin Login', 'Private administrative login for authorized admins.')}

        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-[#E2E8F0] shadow-sm">
            {errorMsg && (
              <ErrorAlert
                title="Access Denied"
                message={errorMsg}
                onDismiss={() => setErrorMsg('')}
                className="mb-5"
              />
            )}
            {successNotice && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successNotice}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-[#111827] uppercase tracking-wider mb-1.5">
                  Admin Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-email-input"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#6D5DFB] bg-[#F8FAFC]"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-[#111827] uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#6D5DFB] bg-[#F8FAFC]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#94A3B8] hover:text-[#111827] transition-colors cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>

                {/* Forgot Password link — red, below password, above login */}
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotError('');
                      setForgotSuccess('');
                      setStep('forgot-email');
                    }}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <div className="pt-1">
                <button
                  id="admin-login-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-[#111827] hover:bg-black text-white shadow-sm transition-all duration-150 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Logging in...</span>
                    </>
                  ) : (
                    <>
                      <span>Login</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP: Enter Email for OTP
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'forgot-email') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        {renderHeader('Reset Password', 'Enter your admin email to receive a 6-digit OTP.')}

        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-[#E2E8F0] shadow-sm">
            {forgotError && (
              <ErrorAlert
                title="Error"
                message={forgotError}
                onDismiss={() => setForgotError('')}
                className="mb-5"
              />
            )}
            {forgotSuccess && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#111827] uppercase tracking-wider mb-1.5">
                  Admin Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Enter your admin email"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#6D5DFB] bg-[#F8FAFC]"
                  />
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-[#111827] hover:bg-black text-white shadow-sm transition-all duration-150 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {forgotLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Send OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP: Enter OTP
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'forgot-otp') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        {renderHeader('Verify OTP', `Enter the 6-digit code sent to ${forgotEmail}`)}

        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-[#E2E8F0] shadow-sm">
            {forgotError && (
              <ErrorAlert
                title="Error"
                message={forgotError}
                onDismiss={() => setForgotError('')}
                className="mb-5"
              />
            )}
            {forgotSuccess && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#111827] uppercase tracking-wider mb-1.5">
                  6-Digit OTP Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#6D5DFB] bg-[#F8FAFC] tracking-widest text-center font-mono"
                  />
                </div>

                {/* Resend OTP Timer — red color */}
                <div className="mt-2 flex items-center justify-center">
                  {resendCooldown > 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-full px-3 py-1">
                      <RefreshCcw className="w-3 h-3" />
                      Resend OTP in {resendCooldown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={forgotLoading}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    >
                      <RefreshCcw className="w-3 h-3" />
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={forgotLoading || otpCode.length !== 6}
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-[#111827] hover:bg-black text-white shadow-sm transition-all duration-150 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {forgotLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP: Set New Password
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {renderHeader('Set New Password', 'Choose a strong new password for your admin account.')}

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-[#E2E8F0] shadow-sm">
          {forgotError && (
            <ErrorAlert
              title="Error"
              message={forgotError}
              onDismiss={() => setForgotError('')}
              className="mb-5"
            />
          )}
          {forgotSuccess && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{forgotSuccess}</span>
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#111827] uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 6 chars)"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#6D5DFB] bg-[#F8FAFC]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#94A3B8] hover:text-[#111827] transition-colors cursor-pointer"
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={forgotLoading || newPassword.trim().length < 6}
                className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-[#111827] hover:bg-black text-white shadow-sm transition-all duration-150 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {forgotLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
