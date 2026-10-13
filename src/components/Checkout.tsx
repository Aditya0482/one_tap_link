import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Lock, 
  ShieldCheck, 
  Zap, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Sparkles,
  Smartphone,
  Building2,
  Wallet
} from 'lucide-react';
import { Template, Order, User, PurchaseRecord } from '../types';
import { initiateRazorpayPayment } from '../utils/razorpay';
import { api } from '../services/api';
import { ErrorAlert } from './ErrorAlert';
import { validateName, validateEmail, validateOptionalPhone } from '../utils/validators';
import { trackInitiateCheckout } from '../utils/metaPixel';

interface CheckoutProps {
  template: Template;
  onBack: () => void;
  onOrderSuccess: (order: Order) => void;
  user?: User | null;
  onRequireAuth?: () => void;
}

export const Checkout: React.FC<CheckoutProps> = ({
  template,
  onBack,
  onOrderSuccess,
  user,
  onRequireAuth
}) => {
  // Meta Pixel: Track InitiateCheckout when customer views checkout
  useEffect(() => {
    if (template) {
      trackInitiateCheckout(template);
    }
  }, [template?.id]);

  // 1. Synchronously pre-load previous customer details from localStorage if available
  const savedProfile = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('onetaplink_customer_profile') || '{}');
    } catch {
      return {};
    }
  }, []);

  const [name, setName] = useState(user?.displayName || user?.name || savedProfile.name || '');
  const [email, setEmail] = useState(user?.email || savedProfile.email || '');
  // Phone comes ONLY if available in user's database account; otherwise empty
  const [phone, setPhone] = useState(user?.phone ? user.phone : '');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isAutoFilled, setIsAutoFilled] = useState(Boolean(user?.phone));

  // Sync when user prop changes (e.g. after login)
  useEffect(() => {
    if (user) {
      if (user.displayName || user.name) setName(user.displayName || user.name || '');
      if (user.email) setEmail(user.email);
      if (user.phone) {
        setPhone(user.phone);
        setIsAutoFilled(true);
      } else {
        setPhone('');
        setIsAutoFilled(false);
      }
    }
  }, [user]);

  // Field validation
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateCheckoutField = (field: string, val?: string) => {
    let err = '';
    if (field === 'name') {
      err = validateName(val !== undefined ? val : name);
    } else if (field === 'email') {
      err = validateEmail(val !== undefined ? val : email);
    } else if (field === 'phone') {
      err = validateOptionalPhone(val !== undefined ? val : phone);
    }
    setFieldErrors(prev => ({ ...prev, [field]: err }));
    return err;
  };

  const handleCheckoutBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateCheckoutField(field);
    if (field === 'email') {
      handleEmailBlur();
    }
  };

  // 2. Fetch authoritative previous order details (Name, Phone, Email) from Database
  useEffect(() => {
    let isMounted = true;
    const fetchPreviousDetailsFromDb = async () => {
      const targetUid = user?.uid || user?.id;
      const targetEmail = user?.email || email || savedProfile.email;

      if (!targetUid && !targetEmail) return;

      try {
        const res = await api.getCheckoutDetails(targetUid, targetEmail);
        if (isMounted && res.success && res.found && res.details) {
          if (res.details.name && (!name || name === 'Customer')) {
            setName(res.details.name);
          }
          if (res.details.email && !email) {
            setEmail(res.details.email);
          }
        }
      } catch (e) {
        console.warn('Database checkout profile lookup notice:', e);
      }
    };

    fetchPreviousDetailsFromDb();
    return () => { isMounted = false; };
  }, [user]);

  // 3. Auto-populate name if customer types their email
  const handleEmailBlur = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) return;

    try {
      const res = await api.getCheckoutDetails(user?.uid || user?.id, cleanEmail);
      if (res.success && res.found && res.details) {
        if (res.details.name && (!name || name === 'Customer')) {
          setName(res.details.name);
        }
      }
    } catch (e) {
      console.warn('Email auto-complete notice:', e);
    }
  };

  const displayPrice = template.sale_price ?? template.price;

  const handleRazorpayPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!user) {
      setErrorMsg('Please sign in or create an account before purchasing this template.');
      if (onRequireAuth) {
        onRequireAuth();
      }
      return;
    }

    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const phoneErr = validateOptionalPhone(phone);

    setTouched({ name: true, email: true, phone: true });
    setFieldErrors({ name: nameErr, email: emailErr, phone: phoneErr });

    if (nameErr || emailErr || phoneErr) {
      setErrorMsg(nameErr || emailErr || phoneErr || 'Please resolve all required fields.');
      return;
    }

    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    setIsLoading(true);

    // Save customer details so they automatically prefill on any subsequent purchases
    try {
      localStorage.setItem('onetaplink_customer_profile', JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        phone: cleanPhone
      }));
    } catch (e) {
      console.warn('Profile cache save notice:', e);
    }

    try {
      await initiateRazorpayPayment({
        template,
        user: {
          uid: user?.uid || 'guest-checkout',
          email: email.trim(),
          displayName: name.trim(),
          phone: cleanPhone
        },
        onSuccess: async (verifyResult) => {
          try {
            const currentPaymentId = verifyResult.purchase?.razorpayPaymentId ||
                                     verifyResult.purchase?.paymentId ||
                                     verifyResult.order?.razorpay_payment_id ||
                                     verifyResult.order?.payment_reference ||
                                     `pay_${Date.now()}`;

            const purchaseRecord = {
              id: currentPaymentId,
              userId: user?.uid || 'guest-checkout',
              userEmail: user?.email ? user.email.trim().toLowerCase() : email.trim().toLowerCase(),
              customerEmail: email.trim().toLowerCase(),
              customerName: name.trim(),
              customerPhone: cleanPhone,
              productId: template.id,
              productName: template.title,
              amount: template.sale_price ?? template.price,
              currency: 'INR',
              paymentGateway: 'razorpay',
              razorpayOrderId: verifyResult.purchase?.razorpayOrderId || verifyResult.order?.razorpay_order_id,
              razorpayPaymentId: verifyResult.purchase?.razorpayPaymentId || verifyResult.order?.razorpay_payment_id || currentPaymentId,
              paymentStatus: 'paid' as const,
              purchasedAt: new Date().toISOString(),
              accessUrl: template.access_url,
              thumbnailUrl: template.thumbnail_url,
              ...(verifyResult.purchase || {})
            };

            // 1. Instant local caching with deduplication for immediate display in My Purchases
            try {
              const stored: PurchaseRecord[] = JSON.parse(localStorage.getItem('onetaplink_customer_purchases') || '[]');
              const payId = purchaseRecord.razorpayPaymentId;
              const ordId = purchaseRecord.razorpayOrderId;
              const prodId = purchaseRecord.productId;

              const filtered = stored.filter((p: PurchaseRecord) => {
                if (payId && p.razorpayPaymentId === payId) return false;
                if (ordId && p.razorpayOrderId === ordId) return false;
                if (prodId && p.productId === prodId) return false;
                return true;
              });

              const updated = [purchaseRecord, ...filtered];
              localStorage.setItem('onetaplink_customer_purchases', JSON.stringify(updated));
            } catch (lsErr) {
              console.warn('LocalStorage save notice:', lsErr);
            }
          } catch (syncErr) {
            console.warn('Purchase sync notice:', syncErr);
          }

          setIsLoading(false);
          onOrderSuccess(verifyResult.order);
        },
        onError: (errorMessage) => {
          setIsLoading(false);
          setErrorMsg(errorMessage);
        },
        onCancel: () => {
          setIsLoading(false);
        }
      });
    } catch (err: any) {
      setIsLoading(false);
      console.error('Payment launch error:', err);
      setErrorMsg(err.message || 'Unable to initialize the secure payment gateway. Please check your internet connection and try again.');
    }
  };



  return (
    <div id="checkout-page" className="min-h-screen bg-[#F8FAFC] py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back navigation */}
        <div className="mb-6">
          <button
            id="checkout-back-btn"
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#64748B] hover:text-[#111827] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancel and return</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left: Customer Info & Razorpay Payment */}
          <div className="md:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 mb-6">
              <div>
                <h1 className="text-xl font-extrabold text-[#111827]">
                  Express Checkout
                </h1>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Powered by Razorpay Secure Payments
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#22C55E]">
                <Zap className="w-3.5 h-3.5" />
                <span>Instant Delivery</span>
              </div>
            </div>

            {errorMsg && (
              <ErrorAlert
                title="Checkout Notice"
                message={errorMsg}
                onDismiss={() => setErrorMsg('')}
                className="mb-6"
              />
            )}

            {!user ? (
              <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-amber-950 font-bold text-sm">Sign In / Sign Up Required</strong>
                    <span className="text-amber-800">
                      You must sign in or create an account to purchase this template. Your template copy link will be saved in your library permanently.
                    </span>
                  </div>
                </div>
                {onRequireAuth && (
                  <button
                    type="button"
                    onClick={onRequireAuth}
                    className="px-4 py-2 rounded-xl bg-[#6D5DFB] hover:bg-[#5B4CE0] text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs transition-colors"
                  >
                    Sign In / Sign Up
                  </button>
                )}
              </div>
            ) : (
              <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Purchasing as <strong>{user.email}</strong>. This template will be automatically added to your account library.
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleRazorpayPayment} className="space-y-5" noValidate>

              {/* 1. Customer Information */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B]">
                    1. Your Contact Information
                  </label>
                  {isAutoFilled && phone && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Auto-filled from previous order</span>
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#111827] mb-1">
                      Full Name <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      id="checkout-name-input"
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (touched.name) validateCheckoutField('name', e.target.value);
                      }}
                      onBlur={() => handleCheckoutBlur('name')}
                      placeholder="e.g. Jane Doe"
                      className={`w-full px-3.5 py-2.5 rounded-xl border ${
                        touched.name && fieldErrors.name
                          ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/20'
                          : 'border-[#E2E8F0] focus:ring-2 focus:ring-[#6D5DFB] focus:border-transparent bg-[#F8FAFC]'
                      } text-sm text-[#111827] focus:outline-none transition-all`}
                    />
                    {touched.name && fieldErrors.name && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 font-medium bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-200 animate-in fade-in slide-in-from-top-1 duration-200">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-500" />
                        <span>{fieldErrors.name}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#111827] mb-1">
                      Email Address <span className="text-red-500 font-bold">*</span> <span className="text-[#64748B] font-normal text-[11px]">(Where your Google Drive copy link will be delivered)</span>
                    </label>
                    <input
                      id="checkout-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (touched.email) validateCheckoutField('email', e.target.value);
                      }}
                      onBlur={() => handleCheckoutBlur('email')}
                      placeholder="jane@example.com"
                      className={`w-full px-3.5 py-2.5 rounded-xl border ${
                        touched.email && fieldErrors.email
                          ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/20'
                          : 'border-[#E2E8F0] focus:ring-2 focus:ring-[#6D5DFB] focus:border-transparent bg-[#F8FAFC]'
                      } text-sm text-[#111827] focus:outline-none transition-all`}
                    />
                    {touched.email && fieldErrors.email && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 font-medium bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-200 animate-in fade-in slide-in-from-top-1 duration-200">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-500" />
                        <span>{fieldErrors.email}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#111827] mb-1">
                      Phone Number <span className="text-[#64748B] font-normal">(Optional)</span>
                    </label>
                    <input
                      id="checkout-phone-input"
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (touched.phone) validateCheckoutField('phone', e.target.value);
                      }}
                      onBlur={() => handleCheckoutBlur('phone')}
                      placeholder="Enter your phone number"
                      className={`w-full px-3.5 py-2.5 rounded-xl border ${
                        touched.phone && fieldErrors.phone
                          ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/20'
                          : 'border-[#E2E8F0] focus:ring-2 focus:ring-[#6D5DFB] focus:border-transparent bg-[#F8FAFC]'
                      } text-sm text-[#111827] focus:outline-none transition-all`}
                    />
                    {touched.phone && fieldErrors.phone && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 font-medium bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-200 animate-in fade-in slide-in-from-top-1 duration-200">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-500" />
                        <span>{fieldErrors.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Payment Method Overview */}
              <div className="pt-4 border-t border-[#E2E8F0]">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                    2. Payment Methods (Razorpay)
                  </label>
                  <span className="flex items-center gap-1 text-[11px] text-[#64748B]">
                    <Lock className="w-3 h-3 text-[#6D5DFB]" />
                    <span>256-bit Bank Grade Encryption</span>
                  </span>
                </div>

                {/* Razorpay Supported Payment Highlights */}
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] flex flex-col items-center justify-center gap-1">
                      <Smartphone className="w-4 h-4 text-[#6D5DFB]" />
                      <span className="font-bold text-[#111827] text-[11px]">UPI</span>
                      <span className="text-[9px] text-[#64748B]">GPay • PhonePe</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] flex flex-col items-center justify-center gap-1">
                      <CreditCard className="w-4 h-4 text-[#6D5DFB]" />
                      <span className="font-bold text-[#111827] text-[11px]">Cards</span>
                      <span className="text-[9px] text-[#64748B]">Visa • MC • RuPay</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] flex flex-col items-center justify-center gap-1">
                      <Building2 className="w-4 h-4 text-[#6D5DFB]" />
                      <span className="font-bold text-[#111827] text-[11px]">Net Banking</span>
                      <span className="text-[9px] text-[#64748B]">50+ Banks</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] flex flex-col items-center justify-center gap-1">
                      <Wallet className="w-4 h-4 text-[#6D5DFB]" />
                      <span className="font-bold text-[#111827] text-[11px]">Wallets</span>
                      <span className="text-[9px] text-[#64748B]">Paytm • Mobikwik</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#64748B] text-center pt-1">
                    A secure Razorpay payment popup will open. Pay via UPI, Card, Net Banking, or Wallet.
                  </p>
                </div>
              </div>

              {/* Complete Purchase Button */}
              <button
                id="checkout-submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 rounded-xl font-bold text-base bg-[#6D5DFB] hover:bg-[#5B4CE0] text-white shadow-[0_4px_14px_rgba(109,93,251,0.3)] transition-all duration-150 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting to Razorpay...</span>
                  </>
                ) : (
                  <span>Pay Now — ₹{displayPrice}</span>
                )}
              </button>

              {/* Small Trust Text */}
              <div className="text-center text-xs font-medium text-[#64748B] flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
                <span>Verified Razorpay Gateway • Instant Digital Delivery</span>
              </div>
            </form>

          </div>

          {/* Right: Order Summary */}
          <div className="md:col-span-5 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm">
            <h2 className="text-base font-bold text-[#111827] mb-4 pb-3 border-b border-[#E2E8F0]">
              Order Summary
            </h2>

            {/* Template Item */}
            <div className="flex items-center gap-3 pb-4 border-b border-[#F1F5F9]">
              <img
                src={template.thumbnail_url || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80'}
                alt={template.title}
                className="w-16 h-12 object-cover rounded-lg border border-[#E2E8F0] shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80';
                }}
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-[#111827] truncate">
                  {template.title}
                </h4>
                <span className="text-[10px] text-[#64748B]">
                  Digital Template • Lifetime License
                </span>
              </div>
              <div className="text-sm font-extrabold text-[#111827] font-mono">
                ₹{displayPrice}
              </div>
            </div>

            {/* Price Calculations */}
            <div className="py-4 space-y-2 text-xs border-b border-[#E2E8F0]">
              <div className="flex justify-between text-[#64748B]">
                <span>Subtotal</span>
                <span className="font-mono text-[#111827]">₹{displayPrice}</span>
              </div>
              <div className="flex justify-between text-[#64748B]">
                <span>Taxes & Handling</span>
                <span className="font-mono text-[#22C55E]">Included (₹0)</span>
              </div>
            </div>

            {/* Total */}
            <div className="pt-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#111827]">Total Due</div>
                <div className="text-[10px] text-[#64748B]">Instant Digital Delivery</div>
              </div>
              <div className="text-2xl font-extrabold text-[#111827] font-mono">
                ₹{displayPrice}
              </div>
            </div>

            {/* Guarantee Box */}
            <div className="mt-6 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#6D5DFB] shrink-0 mt-0.5" />
              <div className="text-[11px] text-[#64748B] leading-relaxed">
                <strong className="text-[#111827]">100% Verified Quality Guarantee:</strong> Fully tested formulas, instant one-click copy to your Google Drive, and dedicated setup support.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
