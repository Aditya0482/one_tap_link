import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { Template, User } from '../types';
import { api } from '../services/api';
import { ErrorAlert } from './ErrorAlert';

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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Helper to reset all input fields to blank
  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setError('');
    setResetSent(false);
  };

  // When modal opens or closes, always ensure inputs are completely blank
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
    setMode(newMode);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'forgot') {
      if (!email.trim()) {
        setError('Please enter your registered email address to receive password reset instructions.');
        return;
      }
      setLoading(true);
      setTimeout(() => {
        setResetSent(true);
        setLoading(false);
      }, 600);
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError('Please fill in both email and password to proceed.');
      return;
    }

    if (mode === 'signup' && password.trim().length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const res = await api.customerSignup({
          name: name.trim() || email.split('@')[0],
          email: email.trim(),
          password: password.trim()
        });
        if (res.token) {
          localStorage.setItem('onetap_customer_token', res.token);
          localStorage.setItem('onetap_customer_user', JSON.stringify(res.user));
        }
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
            {mode === 'forgot' && 'Reset your password'}
          </h2>

          <p className="mt-1 text-xs text-[#64748B] leading-relaxed">
            {pendingTemplate ? (
              <span>
                Sign in to complete purchase of <strong className="text-[#111827]">{pendingTemplate.title}</strong> and unlock instant access.
              </span>
            ) : (
              <span>Access your purchased templates and digital downloads anytime under My Purchases.</span>
            )}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {pendingTemplate && (
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

          {error && (
            <ErrorAlert
              title="Account Notice"
              message={error}
              onDismiss={() => setError('')}
              className="my-1"
            />
          )}

          {resetSent ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium space-y-2 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="font-bold text-sm">Password reset requested!</p>
              <p className="text-emerald-700">Please contact support or sign in with your password.</p>
              <button
                type="button"
                onClick={() => { setResetSent(false); switchMode('signin'); }}
                className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
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
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] focus:border-[#6D5DFB] focus:ring-2 focus:ring-[#6D5DFB]/20 outline-none text-xs text-[#111827] transition-all bg-white"
                    />
                  </div>
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
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] focus:border-[#6D5DFB] focus:ring-2 focus:ring-[#6D5DFB]/20 outline-none text-xs text-[#111827] transition-all bg-white"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-[#111827]">
                      Password
                    </label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        className="text-[11px] font-semibold text-[#6D5DFB] hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter Password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E2E8F0] focus:border-[#6D5DFB] focus:ring-2 focus:ring-[#6D5DFB]/20 outline-none text-xs text-[#111827] transition-all bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#94A3B8] hover:text-[#111827] rounded-md transition-colors cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                  </div>
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
                      {mode === 'forgot' && 'Send Reset Info'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              {/* Mode Toggle Footer */}
              <div className="pt-3 border-t border-[#F1F5F9] text-center text-xs text-[#64748B]">
                {mode === 'signin' ? (
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
                ) : (
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
