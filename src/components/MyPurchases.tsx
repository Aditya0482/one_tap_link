import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  CreditCard, 
  ArrowRight, 
  Sparkles, 
  Download, 
  Loader2, 
  ShieldCheck,
  ShoppingBag,
  Zap,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { PurchaseRecord, Template, User } from '../types';
import { ErrorAlert } from './ErrorAlert';

interface MyPurchasesProps {
  user: User | null;
  onBrowseTemplates: () => void;
  onSelectTemplate: (template: Template) => void;
  onOpenAuth: () => void;
}

// Strict deduplication function ensuring each unique product / transaction is shown only once
function deduplicatePurchases(records: PurchaseRecord[]): PurchaseRecord[] {
  const seenPaymentIds = new Set<string>();
  const seenOrderIds = new Set<string>();
  const seenProductIds = new Set<string>();
  const unique: PurchaseRecord[] = [];

  for (const p of records) {
    const payId = (p.instamojoPaymentId || p.razorpayPaymentId || '').trim();
    const ordId = (p.instamojoPaymentRequestId || p.razorpayOrderId || '').trim();
    const prodId = (p.productId || '').trim();

    // If this payment, order, or product was already registered, skip duplicate card
    if (payId && seenPaymentIds.has(payId)) continue;
    if (ordId && seenOrderIds.has(ordId)) continue;
    if (prodId && seenProductIds.has(prodId)) continue;

    if (payId) seenPaymentIds.add(payId);
    if (ordId) seenOrderIds.add(ordId);
    if (prodId) seenProductIds.add(prodId);

    unique.push(p);
  }

  return unique;
}

export const MyPurchases: React.FC<MyPurchasesProps> = ({
  user,
  onBrowseTemplates,
  onSelectTemplate,
  onOpenAuth
}) => {
  // Load initially from local storage cache — only items belonging to current user
  const [purchases, setPurchases] = useState<PurchaseRecord[]>(() => {
    try {
      const cached = localStorage.getItem('onetaplink_customer_purchases');
      if (cached) {
        const list: PurchaseRecord[] = JSON.parse(cached);
        const userEmail = (user?.email || '').trim().toLowerCase();
        // Only include cached purchases that belong to the current user
        const filtered = userEmail
          ? list.filter(p => {
              const cacheEmail = (p.customerEmail || '').trim().toLowerCase();
              return !cacheEmail || cacheEmail === userEmail;
            })
          : []; // No logged-in user → show nothing from cache (fresh fetch will populate)
        const cleanList = deduplicatePurchases(filtered);
        return cleanList;
      }
      return [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchUserPurchases = async (emailOverride?: string) => {
    const targetEmail = (emailOverride || user?.email || searchEmail).trim().toLowerCase();
    const targetUid = user?.uid || user?.id;

    if (!targetUid && !targetEmail && purchases.length === 0) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const recordsMap = new Map<string, PurchaseRecord>();

      // 1. Preload any cached purchases — only if they belong to this user
      try {
        const cached = localStorage.getItem('onetaplink_customer_purchases');
        if (cached) {
          const list: PurchaseRecord[] = JSON.parse(cached);
          list.forEach(p => {
            // Only include cache entry if email matches current user (skip if mismatch)
            const cacheEmail = (p.customerEmail || '').trim().toLowerCase();
            if (targetEmail && cacheEmail && cacheEmail !== targetEmail) return;
            const key = p.productId || p.instamojoPaymentId || p.razorpayPaymentId || p.instamojoPaymentRequestId || p.razorpayOrderId || p.id || 'purchase';
            recordsMap.set(key, p);
          });
        }
      } catch (e) {
        console.warn('Cache read notice:', e);
      }

      // 2. Fetch directly from Backend Database (PostgreSQL)
      try {
        const res = await api.getUserPurchases(targetUid || 'guest-checkout', targetEmail || undefined);
        if (res.success && res.purchases) {
          res.purchases.forEach((order) => {
            const payId = order.instamojo_payment_id || order.razorpay_payment_id || order.payment_reference;
            const ordId = order.instamojo_payment_request_id || order.razorpay_order_id || order.id;
            const key = order.template_id || payId || ordId || order.id;

            recordsMap.set(key, {
              id: order.id,
              userId: order.user_id || targetUid || 'guest-checkout',
              productId: order.template_id,
              productName: order.template_title || 'Digital Template',
              amount: order.amount,
              currency: order.currency,
              paymentGateway: order.payment_gateway,
              instamojoPaymentRequestId: order.instamojo_payment_request_id,
              instamojoPaymentId: order.instamojo_payment_id,
              razorpayOrderId: order.razorpay_order_id || order.payment_reference,
              razorpayPaymentId: order.razorpay_payment_id || order.payment_reference,
              paymentStatus: 'paid',
              purchasedAt: order.created_at,
              accessUrl: order.access_url,
              thumbnailUrl: order.template_thumbnail
            });
          });
        }
      } catch (backendErr) {
        console.warn('Backend order lookup notice:', backendErr);
      }

      // 3. Clean deduplication
      const allRecords = Array.from(recordsMap.values());
      const cleanList = deduplicatePurchases(allRecords);

      const sorted = cleanList.sort((a, b) => {
        return new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime();
      });

      setPurchases(sorted);
      try {
        localStorage.setItem('onetaplink_customer_purchases', JSON.stringify(sorted));
      } catch (e) {
        console.warn('Cache write notice:', e);
      }
    } catch (err: any) {
      console.error('Failed to load purchases:', err);
      setError('Unable to refresh your purchase library from the server. Showing your locally saved purchases.');
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  // Manual refresh with guaranteed 2-second spinning animation requested by user
  const handleManualRefresh = async () => {
    if (isRefreshing || loading) return;
    setIsRefreshing(true);
    const minDelay = new Promise((resolve) => setTimeout(resolve, 2000));
    try {
      await Promise.all([
        fetchUserPurchases(),
        minDelay
      ]);
      setFeedback({ type: 'success', message: 'Purchases updated successfully.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      // errors handled inside fetchUserPurchases
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserPurchases();
  }, [user]);

  const handleEmailSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;
    setIsSearching(true);
    fetchUserPurchases(searchEmail.trim());
  };

  // If user is not logged in and has NO cached purchases, show sign in / email lookup
  if (!user && purchases.length === 0) {
    return (
      <div className="py-16 sm:py-20 bg-[#F8FAFC]">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#6D5DFB]/10 text-[#6D5DFB] flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">
            Find Your Purchases
          </h2>
          <p className="mt-2 text-sm text-[#64748B] leading-relaxed">
            Your verified templates and direct Google Drive copy links are saved in your account.
          </p>

          {/* Quick email lookup for guest checkouts */}
          <form onSubmit={handleEmailSearch} className="mt-6">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Enter email, Order ID, or Payment ID..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm focus:outline-none focus:ring-2 focus:ring-[#6D5DFB] bg-white"
                required
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#6D5DFB] hover:bg-[#5B4CE0] text-white transition-all cursor-pointer disabled:opacity-50"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find'}
              </button>
            </div>
          </form>

          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-xs text-[#94A3B8]">or</span>
          </div>

          <button
            type="button"
            onClick={onOpenAuth}
            className="mt-2 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-white border border-[#CBD5E1] hover:border-[#6D5DFB] text-[#111827] shadow-2xs cursor-pointer transition-all active:scale-95"
          >
            <span>Sign In to Your Account</span>
            <ArrowRight className="w-4 h-4 text-[#6D5DFB]" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 sm:py-16 bg-[#F8FAFC]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-[#E2E8F0]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#6D5DFB]/10 text-[#6D5DFB] text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Customer Library</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight">
              My Purchases
            </h1>
            <p className="mt-1 text-sm text-[#64748B]">
              {user?.email ? (
                <>Logged in as <span className="font-semibold text-[#111827]">{user.email}</span></>
              ) : (
                <span>Templates verified on this browser</span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing || loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#64748B] bg-white border border-[#E2E8F0] hover:text-[#111827] hover:border-[#6D5DFB]/40 transition-colors cursor-pointer disabled:opacity-60 active:scale-95"
              title="Refresh purchases"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${(isRefreshing || loading) ? 'animate-spin text-[#6D5DFB]' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <button
              type="button"
              onClick={onBrowseTemplates}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#6D5DFB] hover:bg-[#5B4CE0] transition-colors cursor-pointer shadow-2xs"
            >
              <span>Explore More</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          feedback.type === 'error' ? (
            <div className="mt-4">
              <ErrorAlert
                title="Purchase Notice"
                message={feedback.message}
                onDismiss={() => setFeedback(null)}
              />
            </div>
          ) : (
            <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50/90 to-teal-50/80 border border-emerald-200/80 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-3 shadow-2xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{feedback.message}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setFeedback(null)} 
                className="text-xs opacity-60 hover:opacity-100 cursor-pointer px-1"
              >
                ✕
              </button>
            </div>
          )
        )}

        {/* Content */}
        {loading && !isRefreshing ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#6D5DFB] mx-auto mb-3" />
            <p className="text-sm font-medium text-[#64748B]">Loading your purchases...</p>
          </div>
        ) : error ? (
          <div className="py-12 max-w-md mx-auto">
            <ErrorAlert
              title="Connection Notice"
              message={error}
              onRetry={() => fetchUserPurchases()}
              retryLabel="Retry Loading"
            />
          </div>
        ) : purchases.length === 0 ? (
          <div className="py-20 text-center max-w-md mx-auto bg-white rounded-2xl border border-[#E2E8F0] p-8 mt-8 shadow-2xs">
            <div className="w-12 h-12 rounded-xl bg-[#6D5DFB]/10 text-[#6D5DFB] flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#111827]">No purchases found</h3>
            <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
              When you buy a template, it will be automatically linked to your account and unlocked here forever.
            </p>
            <button
              type="button"
              onClick={onBrowseTemplates}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#6D5DFB] hover:bg-[#5B4CE0] text-white transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <span>Browse All Templates</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              {purchases.length} Verified Template{purchases.length > 1 ? 's' : ''}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {purchases.map((purchase) => {
                const pKey = purchase.productId || purchase.id || purchase.razorpayPaymentId || purchase.razorpayOrderId;
                const dateStr = purchase.purchasedAt 
                  ? new Date(purchase.purchasedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })
                  : 'Recent';

                return (
                  <div
                    key={pKey}
                    className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-2xs hover:shadow-[0_12px_24px_rgba(109,93,251,0.06)] hover:border-[#6D5DFB]/30 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Paid & Verified</span>
                        </div>

                        <span className="text-[11px] font-mono text-[#64748B]">
                          ₹{purchase.amount}
                        </span>
                      </div>

                      {/* Title & Preview Image */}
                      <div className="flex items-start gap-4">
                        {purchase.thumbnailUrl ? (
                          <img
                            src={purchase.thumbnailUrl}
                            alt={purchase.productName}
                            className="w-16 h-16 rounded-xl object-cover border border-[#E2E8F0] shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-[#6D5DFB]/10 text-[#6D5DFB] flex items-center justify-center shrink-0">
                            <FileSpreadsheet className="w-8 h-8" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm text-[#111827] line-clamp-1">
                            {purchase.productName}
                          </h3>
                          <div className="mt-1 flex items-center gap-2 text-[11px] text-[#64748B]">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{dateStr}</span>
                            </span>
                            <span>•</span>
                            <span className="font-mono text-[10px] text-[#94A3B8] truncate">
                              {purchase.instamojoPaymentId || purchase.razorpayPaymentId || purchase.instamojoPaymentRequestId || purchase.razorpayOrderId || 'Verified'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-5 pt-4 border-t border-[#F1F5F9] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#22C55E]">
                        <Zap className="w-3.5 h-3.5 fill-[#22C55E]" />
                        <span>Instant Access Ready</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {purchase.accessUrl ? (
                          <a
                            href={purchase.accessUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#6D5DFB] hover:bg-[#5B4CE0] text-white shadow-xs transition-all active:scale-95 cursor-pointer"
                          >
                            <span>{purchase.accessUrl?.includes('docs.google.com') ? 'Open in Google Drive' : 'Access Template'}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-xs text-[#94A3B8] italic">
                            Access link being prepared
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
