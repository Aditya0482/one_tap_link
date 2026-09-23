import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff,
  KeyRound,
  RotateCcw,
  Phone
} from 'lucide-react';
import { Template, User } from '../types';
import { api } from '../services/api';
import { ErrorAlert } from './ErrorAlert';
import { validateName, validateEmail, validatePassword, validateOtp, validateOptionalPhone } from '../utils/validators';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User, token?: string) => void;
  pendingTemplate?: Template | null;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  pendingTemplate
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [forgotStep, setForgotStep] = useState<'email' | 'otp'>('email');
  
  // Input fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // States & feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSimulated, setIsSimulated] = useState(false);

  // Field validation errors & touched tracking
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (field: string, val?: string) => {
    let err = '';
    if (field === 'name' && mode === 'signup') {
      err = validateName(val !== undefined ? val : name);
    } else if (field === 'email') {
      err = validateEmail(val !== undefined ? val : email);
    } else if (field === 'password' && mode !== 'forgot') {
      err = validatePassword(val !== undefined ? val : password);
    } else if (field === 'otp' && mode === 'forgot' && forgotStep === 'otp') {
      err = validateOtp(val !== undefined ? val : otp);
    } else if (field === 'newPassword' && mode === 'forgot' && forgotStep === 'otp') {
      err = validatePassword(val !== undefined ? val : newPassword, 'New password');
    }
    setFieldErrors(prev => ({ ...prev, [field]: err }));
    return err;
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field);
  };

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Helper to reset form
  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setShowPassword(false);
    setOtp('');
    setNewPassword('');
    setShowNewPassword(false);
    setError('');
    setSuccessNotice('');
    setForgotStep('email');
    setResendCooldown(0);
    setIsSimulated(false);
    setFieldErrors({});
    setTouched({});
  };

  // Reset when modal is reopened
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const switchMode = (newMode: 'signin' | 'signup' | 'forgot') => {
    setError('');
    setPassword('');
    setShowPassword(false);
    setOtp('');
    setNewPassword('');
    setShowNewPassword(false);
    setForgotStep('email');
    setMode(newMode);
    setFieldErrors({});
    setTouched({});
  };

  // Step 1 of Forgot Password: Send OTP to email
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const emailErr = validateEmail(email);
    setTouched(prev => ({ ...prev, email: true }));
    if (emailErr) {
      setFieldErrors(prev => ({ ...prev, email: emailErr }));
      setError(emailErr);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.sendPasswordResetOtp(email.trim());
      setIsSimulated(!!res.simulated);
      setForgotStep('otp');
      setResendCooldown(30);
      setSuccessNotice(`A 6-digit verification code has been sent to ${email.trim()}.`);
      setFieldErrors({});
      setTouched({});
    } catch (err: any) {
      console.error('Send OTP error:', err);
      setError(err.message || 'Failed to send verification code. Please check your email address.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 of Forgot Password: Verify OTP & set new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpErr = validateOtp(otp);
    const passErr = validatePassword(newPassword, 'New password');

    setTouched({ otp: true, newPassword: true });
    setFieldErrors({ otp: otpErr, newPassword: passErr });

    if (otpErr || passErr) {
      setError(otpErr || passErr);
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.resetPasswordWithOtp(email.trim(), otp.trim(), newPassword.trim());
      // Switch back to signin with success message
      setMode('signin');
      setForgotStep('email');
      setOtp('');
      setNewPassword('');
      setPassword('');
      setFieldErrors({});
      setTouched({});
      setSuccessNotice('Your password has been reset successfully! You can now sign in with your new password.');
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.message || 'Failed to reset password. Please verify the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Signin & Signup submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessNotice('');

    if (mode === 'forgot') {
      if (forgotStep === 'email') {
        return handleSendOtp(e);
      } else {
        return handleResetPassword(e);
      }
    }

    const errors: Record<string, string> = {};
    if (mode === 'signup') {
      const nameErr = validateName(name);
      if (nameErr) errors.name = nameErr;
      const phoneErr = validateOptionalPhone(phone);
      if (phoneErr) errors.phone = phoneErr;
    }
    const emailErr = validateEmail(email);
    if (emailErr) errors.email = emailErr;

    const passErr = validatePassword(password, 'Password');
    if (passErr) errors.password = passErr;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setTouched({ name: true, email: true, password: true, phone: true });
      setError('Please resolve the highlighted errors before submitting.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const res = await api.customerSignup({
          name: name.trim() || email.split('@')[0],
          email: email.trim(),
          password: password.trim(),
          phone: phone.trim()
        });
        if (res.token) {
          localStorage.setItem('onetap_customer_token', res.token);
          localStorage.setItem('onetap_customer_user', JSON.stringify(res.user));
        }
        // Clear any stale purchases cache from a previous user on this device
        localStorage.removeItem('onetaplink_customer_purchases');
        resetForm();
        onSuccess(res.user, res.token);
        onClose();
      } else {
        const res = await api.customerLogin({
          email: email.trim(),
          password: password.trim()
        });
        if (res.token) {
          localStorage.setItem('onetap_customer_token', res.token);
          localStorage.setItem('onetap_customer_user', JSON.stringify(res.user));
        }
        // Clear any stale purchases cache from a previous user on this device
        localStorage.removeItem('onetaplink_customer_purchases');
        resetForm();
        onSuccess(res.user, res.token);
        onClose();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication could not be completed. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl border border-[#E2E8F0] shadow-2xl overflow-hidden relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-[#64748B] hover:text-[#111827] rounded-lg hover:bg-[#F1F5F9] transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-[#F1F5F9] bg-[#F8FAFC]">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#6D5DFB]/10 text-[#6D5DFB] text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>OneTapLink Account</span>
          </div>

          <h2 className="text-xl font-extrabold text-[#111827] tracking-tight">
            {mode === 'signin' && 'Sign in to your account'}
            {mode === 'signup' && 'Create your account'}
            {mode === 'forgot' && forgotStep === 'email' && 'Reset your password'}
            {mode === 'forgot' && forgotStep === 'otp' && 'Verify & Set New Password'}
          </h2>

          <p className="mt-1 text-xs text-[#64748B] leading-relaxed">
            {mode === 'forgot' && forgotStep === 'email' && (
              <span>Enter your registered email address to receive a secure 6-digit verification code.</span>
            )}
            {mode === 'forgot' && forgotStep === 'otp' && (
              <span>Enter the 6-digit code sent to your email along with your new password.</span>
            )}
            {mode !== 'forgot' && pendingTemplate && (
              <span>
                Sign in to complete purchase of <strong className="text-[#111827]">{pendingTemplate.title}</strong> and unlock instant access.
              </span>
            )}
            {mode !== 'forgot' && !pendingTemplate && (
              <span>Access your purchased templates and digital downloads anytime under My Purchases.</span>
            )}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {pendingTemplate && mode !== 'forgot' && (
            <div className="p-3.5 rounded-xl bg-[#6D5DFB]/10 border border-[#6D5DFB]/25 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
                <img 
                  src={pendingTemplate.thumbnail_url || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80'} 
                  alt={pendingTemplate.title} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80';
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-[#6D5DFB] uppercase tracking-wider block">
                  Account Required To Purchase
                </span>
                <p className="text-xs font-bold text-[#111827] truncate">
                  {pendingTemplate.title}
                </p>
                <p className="text-[11px] text-[#64748B]">
                  Price: <span className="font-bold text-[#111827]">₹{pendingTemplate.sale_price ?? pendingTemplate.price}</span> • Sign in below to proceed to checkout
                </p>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {successNotice && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800 font-medium animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p>{successNotice}</p>
                {isSimulated && (
                  <p className="mt-1 text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200">
                    💡 <strong>Notice:</strong> Resend API key is not yet set in Railway Variables. Check your server console for the code, or configure <code>RESEND_API_KEY</code> on Railway for real emails.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <ErrorAlert
              title="Account Notice"
              message={error}
              onDismiss={() => setError('')}
              className="my-1"
            />
          )}

          {/* ========================================================================= */}
          {/* FORGOT PASSWORD - STEP 2: ENTER OTP & NEW PASSWORD */}
          {/* ========================================================================= */}
          {mode === 'forgot' && forgotStep === 'otp' ? (
            <form onSubmit={handleResetPassword} className="space-y-3.5 text-left">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                    Resetting Password For
                  </span>
                  <p className="text-xs font-bold text-[#111827] truncate">{email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setForgotStep('email'); setError(''); }}
                  className="text-xs font-semibold text-[#6D5DFB] hover:underline cursor-pointer shrink-0 ml-2"
                >
                  Change Email
                </button>
              </div>

              {/* 6-Digit OTP Input */}
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setOtp(val);
                      if (touched.otp) validateField('otp', val);
                    }}
                    onBlur={() => handleBlur('otp')}
                    placeholder="123456"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                      touched.otp && fieldErrors.otp
                        ? 'border-red-500 ring-2 ring-red-500/20'
                        : 'border-[#E2E8F0] focus:border-[#6D5DFB] focus:ring-2 focus:ring-[#6D5DFB]/20'
                    } outline-none text-base font-mono tracking-widest text-[#111827] transition-all bg-white text-center font-bold`}
                  />
                </div>
                {touched.otp && fieldErrors.otp && (
                  <p className="mt-1 text-[11px] text-red-500 font-medium">{fieldErrors.otp}</p>
                )}
              </div>

              {/* New Password Input */}
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (touched.newPassword) validateField('newPassword', e.target.value);
                    }}
                    onBlur={() => handleBlur('newPassword')}
                    placeholder="Enter new password (min. 6 characters)"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border ${
                      touched.newPassword && fieldErrors.newPassword
                        ? 'border-red-500 ring-2 ring-red-500/20'
                        : 'border-[#E2E8F0] focus:border-[#6D5DFB] focus:ring-2 focus:ring-[#6D5DFB]/20'
                    } outline-none text-xs text-[#111827] transition-all bg-white`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#94A3B8] hover:text-[#111827] rounded-md transition-colors cursor-pointer"
                    title={showNewPassword ? 'Hide password' : 'Show password'}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                {touched.newPassword && fieldErrors.newPassword && (
                  <p className="mt-1 text-[11px] text-red-500 font-medium">{fieldErrors.newPassword}</p>
                )}
              </div>

              {/* Submit Reset Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs bg-[#6D5DFB] hover:bg-[#5B4CE0] text-white transition-all shadow-[0_4px_16px_rgba(109,93,251,0.25)] hover:shadow-[0_6px_20px_rgba(109,93,251,0.35)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <span>Reset Password & Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              {/* Resend OTP Bar */}
              <div className="pt-2 text-center text-xs flex items-center justify-center gap-1.5">
                {resendCooldown > 0 ? (
                  <span className="flex items-center gap-1.5 text-red-600 font-semibold bg-red-50/80 px-3 py-1.5 rounded-lg border border-red-200">
                    <RotateCcw className="w-3.5 h-3.5 animate-spin text-red-600" />
                    <span>Resend verification code in <strong className="text-red-700 font-bold">{resendCooldown}s</strong></span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={loading}
                    className="flex items-center gap-1.5 font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer bg-red-50/60 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Didn't receive code? Resend Code
                  </button>
                )}
              </div>

              <div className="pt-2 border-t border-[#F1F5F9] text-center text-xs text-[#64748B]">
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="font-bold text-[#6D5DFB] hover:underline cursor-pointer"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          ) : (
            /* ========================================================================= */
            /* SIGNIN / SIGNUP / FORGOT STEP 1: ENTER EMAIL */
            /* ========================================================================= */
            <form onSubmit={handleSubmit} className="space-y-3 text-left">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (touched.name) validateField('name', e.target.value);
                      }}
                      onBlur={() => handleBlur('name')}
                      placeholder="John Doe"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                        touched.name && fieldErrors.name
                          ? 'border-red-500 ring-2 ring-red-500/20'
                          : 'border-[#E2E8F0] focus:border-[#6D5DFB] focus:ring-2 focus:ring-[#6D5DFB]/20'
                      } outline-none text-xs text-[#111827] transition-all bg-white`}
                    />
                  </div>
                  {touched.name && fieldErrors.name && (
                    <p className="mt-1 text-[11px] text-red-500 font-medium">{fieldErrors.name}</p>
                  )}
                </div>
              )}

              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    Phone Number <span className="text-[#94A3B8] font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9+ ]/g, '');
                        setPhone(val);
                        if (touched.phone) {
                          const err = validateOptionalPhone(val);
                          setFieldErrors(prev => ({ ...prev, phone: err }));
                        }
                      }}
                      onBlur={() => {
                        setTouched(prev => ({ ...prev, phone: true }));
                        const err = validateOptionalPhone(phone);
                        setFieldErrors(prev => ({ ...prev, phone: err }));
                      }}
                      placeholder="Enter your phone number (optional)"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                        touched.phone && fieldErrors.phone
                          ? 'border-red-500 ring-2 ring-red-500/20'
                          : 'border-[#E2E8F0] focus:border-[#6D5DFB] focus:ring-2 focus:ring-[#6D5DFB]/20'
                      } outline-none text-xs text-[#111827] transition-all bg-white`}
                    />
                  </div>
                  {touched.phone && fieldErrors.phone && (
                    <p className="mt-1 text-[11px] text-red-500 font-medium">{fieldErrors.phone}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (touched.email) validateField('email', e.target.value);
                    }}
                    onBlur={() => handleBlur('email')}
                    placeholder="name@example.com"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                      touched.email && fieldErrors.email
                        ? 'border-red-500 ring-2 ring-red-500/20'
                        : 'border-[#E2E8F0] focus:border-[#6D5DFB] focus:ring-2 focus:ring-[#6D5DFB]/20'
                    } outline-none text-xs text-[#111827] transition-all bg-white`}
                  />
                </div>
                {touched.email && fieldErrors.email && (
                  <p className="mt-1 text-[11px] text-red-500 font-medium">{fieldErrors.email}</p>
                )}
              </div>

              {mode !== 'forgot' && (
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (touched.password) validateField('password', e.target.value);
                      }}
                      onBlur={() => handleBlur('password')}
                      placeholder="Enter Password"
                      className={`w-full pl-10 pr-10 py-2.5 rounded-xl border ${
                        touched.password && fieldErrors.password
                          ? 'border-red-500 ring-2 ring-red-500/20'
                          : 'border-[#E2E8F0] focus:border-[#6D5DFB] focus:ring-2 focus:ring-[#6D5DFB]/20'
                      } outline-none text-xs text-[#111827] transition-all bg-white`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#94A3B8] hover:text-[#111827] rounded-md transition-colors cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                  {touched.password && fieldErrors.password && (
                    <p className="mt-1 text-[11px] text-red-500 font-medium">{fieldErrors.password}</p>
                  )}
                  {mode === 'signin' && (
                    <div className="mt-1.5 flex justify-end">
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline cursor-pointer transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs bg-[#6D5DFB] hover:bg-[#5B4CE0] text-white transition-all shadow-[0_4px_16px_rgba(109,93,251,0.25)] hover:shadow-[0_6px_20px_rgba(109,93,251,0.35)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.99]"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <span>
                      {mode === 'signin' && 'Sign In'}
                      {mode === 'signup' && 'Create Account'}
                      {mode === 'forgot' && 'Send Verification Code'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              {/* Mode Toggle Footer */}
              <div className="pt-3 border-t border-[#F1F5F9] text-center text-xs text-[#64748B]">
                {mode === 'signin' && (
                  <p>
                    Don't have an account yet?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('signup')}
                      className="font-bold text-[#6D5DFB] hover:underline cursor-pointer"
                    >
                      Create one
                    </button>
                  </p>
                )}
                {mode === 'signup' && (
                  <p>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('signin')}
                      className="font-bold text-[#6D5DFB] hover:underline cursor-pointer"
                    >
                      Sign in
                    </button>
                  </p>
                )}
                {mode === 'forgot' && (
                  <p>
                    Remember your password?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('signin')}
                      className="font-bold text-[#6D5DFB] hover:underline cursor-pointer"
                    >
                      Sign in
                    </button>
                  </p>
                )}
              </div>
            </form>
          )}

          <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-emerald-600 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secured with OneTapLink Authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
};
