import { Template, User } from '../types';
import { api } from '../services/api';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay checkout SDK');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

export interface RazorpayCheckoutOptions {
  template: Template;
  user: {
    uid: string;
    email?: string | null;
    displayName?: string | null;
  };
  onSuccess: (verifyResult: any) => void;
  onError: (errorMessage: string) => void;
  onCancel?: () => void;
}

export async function initiateRazorpayPayment({
  template,
  user,
  onSuccess,
  onError,
  onCancel
}: RazorpayCheckoutOptions): Promise<void> {
  try {
    // 1. Ensure Razorpay script is loaded
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded || !window.Razorpay) {
      onError('Unable to load payment gateway. Please check your internet connection and try again.');
      return;
    }

    // 2. Create Razorpay order on secure server
    const orderData = await api.createRazorpayOrder({
      template_id: template.id,
      customer_name: user.displayName || user.email?.split('@')[0] || 'Customer',
      customer_email: user.email || undefined,
      user_id: user.uid
    });

    if (!orderData.success || !orderData.order_id) {
      onError('Could not create payment order with server. Please try again.');
      return;
    }

    const displayPrice = template.sale_price ?? template.price;

    // Fast handling for Test Simulation when Razorpay credentials are not yet added
    const isPlaceholderKey = !orderData.key_id || orderData.key_id === 'rzp_test_placeholder' || orderData.key_id.includes('placeholder');
    if (orderData.is_test_simulation || isPlaceholderKey) {
      // Render quick interactive simulation popup to prevent Razorpay iframe timeout
      renderTestModeModal({
        template,
        amount: displayPrice,
        customerName: user.displayName || 'Customer',
        onConfirm: async () => {
          try {
            const simPaymentId = `pay_sim_${Date.now()}`;
            const verifyResult = await api.verifyRazorpayPayment({
              razorpay_order_id: orderData.order_id,
              razorpay_payment_id: simPaymentId,
              razorpay_signature: 'simulated_test_signature',
              template_id: template.id,
              user_id: user.uid,
              customer_name: user.displayName || user.email?.split('@')[0] || 'Customer',
              customer_email: user.email || undefined
            });

            if (verifyResult.success) {
              onSuccess(verifyResult);
            } else {
              onError('Test verification failed.');
            }
          } catch (e: any) {
            onError(e.message || 'Simulation verification error');
          }
        },
        onDecline: () => {
          onError('Payment was cancelled or declined in test mode.');
        },
        onCancel: () => {
          if (onCancel) onCancel();
        }
      });
      return;
    }

    // 3. Configure Razorpay Checkout Modal (for Real / Test API Keys)
    const rzpOptions = {
      key: orderData.key_id,
      amount: orderData.amount, // in paise
      currency: orderData.currency || 'INR',
      name: 'OneTapLink',
      description: `${template.title} — Instant Digital Access`,
      image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=256&auto=format&fit=crop&q=80',
      order_id: orderData.order_id,
      prefill: {
        name: user.displayName || '',
        email: user.email || ''
      },
      notes: {
        template_id: template.id,
        user_id: user.uid,
        internal_order_id: orderData.internal_order_id || ''
      },
      theme: {
        color: '#6D5DFB' // OneTapLink signature purple
      },
      modal: {
        ondismiss: () => {
          if (onCancel) onCancel();
        },
        escape: true,
        backdropclose: false
      },
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        try {
          // 4. Server-Side Signature Verification
          const verifyResult = await api.verifyRazorpayPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            template_id: template.id,
            user_id: user.uid,
            customer_name: user.displayName || user.email?.split('@')[0] || 'Customer',
            customer_email: user.email || undefined
          });

          if (verifyResult.success && verifyResult.verified) {
            onSuccess(verifyResult);
          } else {
            onError('Payment signature verification failed. Please contact support.');
          }
        } catch (verifyErr: any) {
          console.error('Payment verification error:', verifyErr);
          onError(verifyErr.message || 'Payment verification failed on the server.');
        }
      }
    };

    const razorpayInstance = new window.Razorpay(rzpOptions);

    razorpayInstance.on('payment.failed', (response: any) => {
      console.error('Razorpay payment failed:', response.error);
      const desc = response.error?.description || response.error?.reason || 'Payment failed or was declined by the bank.';
      onError(desc);
    });

    razorpayInstance.open();
  } catch (err: any) {
    console.error('Error initiating payment:', err);
    onError(err.message || 'Failed to initialize payment.');
  }
}

/**
 * Lightweight instant modal for Test Simulation when Razorpay credentials are not yet set
 */
function renderTestModeModal({
  template,
  amount,
  customerName,
  onConfirm,
  onDecline,
  onCancel
}: {
  template: Template;
  amount: number;
  customerName: string;
  onConfirm: () => void;
  onDecline: () => void;
  onCancel: () => void;
}) {
  const modalId = 'razorpay-sim-modal';
  const existing = document.getElementById(modalId);
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = modalId;
  overlay.className = 'fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150';

  overlay.innerHTML = `
    <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E2E8F0] font-sans">
      <div class="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-4">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-[#6D5DFB] animate-pulse"></span>
          <h3 class="text-base font-bold text-[#111827]">Razorpay Test Sandbox</h3>
        </div>
        <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#6D5DFB]/10 text-[#6D5DFB]">Instant Sim</span>
      </div>

      <div class="space-y-3 mb-6">
        <div class="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
          <div class="text-xs text-[#64748B]">Item to purchase:</div>
          <div class="text-sm font-bold text-[#111827] mt-0.5 truncate">${template.title}</div>
          <div class="mt-2 flex items-center justify-between text-xs pt-2 border-t border-[#E2E8F0]">
            <span class="text-[#64748B]">Amount to Pay:</span>
            <span class="text-base font-extrabold text-[#111827] font-mono">₹${amount}</span>
          </div>
        </div>

        <div class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
          <strong>Test Mode Active:</strong> Live Razorpay API keys are not yet configured in AI Studio environment secrets. You can simulate the complete payment and instant delivery flow below.
        </div>
      </div>

      <div class="space-y-2.5">
        <button id="sim-success-btn" class="w-full py-3 px-4 rounded-xl font-bold text-sm bg-[#6D5DFB] hover:bg-[#5B4CE0] text-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-2">
          <span>✓ Simulate Successful Payment (Instant)</span>
        </button>
        <button id="sim-fail-btn" class="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#64748B] hover:text-[#111827] transition-all cursor-pointer">
          Simulate Bank Decline (Test Error)
        </button>
        <button id="sim-cancel-btn" class="w-full py-1.5 text-center text-xs text-[#94A3B8] hover:text-[#64748B] cursor-pointer">
          Cancel
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const cleanup = () => overlay.remove();

  overlay.querySelector('#sim-success-btn')?.addEventListener('click', () => {
    cleanup();
    onConfirm();
  });

  overlay.querySelector('#sim-fail-btn')?.addEventListener('click', () => {
    cleanup();
    onDecline();
  });

  overlay.querySelector('#sim-cancel-btn')?.addEventListener('click', () => {
    cleanup();
    onCancel();
  });
}

