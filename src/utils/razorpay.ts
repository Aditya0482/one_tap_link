import { Template } from '../types';
import { api } from '../services/api';

export interface RazorpayCheckoutOptions {
  template: Template;
  user: {
    uid: string;
    email?: string | null;
    displayName?: string | null;
    phone?: string | null;
  };
  onSuccess: (verifyResult: any) => void;
  onError: (errorMessage: string) => void;
  onCancel?: () => void;
}

/**
 * Dynamically loads the Razorpay checkout.js script if not already loaded.
 */
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

/**
 * Initiates checkout via Razorpay.
 * - In Live/Test mode: Opens Razorpay inline payment popup.
 * - In Test Simulation mode (when API keys are not set): Launches simulated checkout popup.
 */
export async function initiateRazorpayPayment({
  template,
  user,
  onSuccess,
  onError,
  onCancel
}: RazorpayCheckoutOptions): Promise<void> {
  try {
    const customerName = user.displayName || user.email?.split('@')[0] || 'Customer';
    const customerEmail = user.email || 'customer@onetaplink.com';
    const customerPhone = user.phone || '';

    // 1. Create Razorpay order on server
    const orderData = await api.createRazorpayOrder({
      template_id: template.id,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      user_id: user.uid
    });

    if (!orderData.success) {
      onError('Unable to initialize payment. Please check your internet connection and try again.');
      return;
    }

    const displayPrice = template.sale_price ?? template.price;

    // 2. Test Simulation mode (when Razorpay keys not configured)
    if (orderData.is_test_simulation || !orderData.key_id) {
      renderRazorpaySimulationModal({
        template,
        amount: displayPrice,
        customerName,
        customerEmail,
        customerPhone,
        onConfirm: async () => {
          try {
            const verifyResult = await api.simulateRazorpayPayment({
              razorpay_order_id: orderData.order_id,
              template_id: template.id,
              user_id: user.uid,
              customer_name: customerName,
              customer_email: customerEmail,
              customer_phone: customerPhone
            });

            if (verifyResult.success) {
              onSuccess(verifyResult);
            } else {
              onError('Payment verification could not be confirmed. Please retry or contact support.');
            }
          } catch (e: any) {
            onError(e.message || 'Payment simulation verification encountered an error.');
          }
        },
        onDecline: () => {
          onError('Payment was cancelled. You can retry checkout anytime.');
        },
        onCancel: () => {
          if (onCancel) onCancel();
        }
      });
      return;
    }

    // 3. Live / Test Mode: Open Razorpay inline popup
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      onError('Failed to load Razorpay payment SDK. Please check your internet connection and try again.');
      return;
    }

    const razorpayOptions = {
      key: orderData.key_id,
      amount: orderData.amount, // in paise
      currency: 'INR',
      name: 'OneTapLink',
      description: template.title,
      order_id: orderData.order_id,
      prefill: {
        name: customerName,
        email: customerEmail,
        contact: customerPhone
      },
      notes: {
        template_id: template.id,
        user_id: user.uid
      },
      theme: {
        color: '#6D5DFB'
      },
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        try {
          const verifyResult = await api.verifyRazorpayPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            template_id: template.id,
            user_id: user.uid,
            customer_name: customerName,
            customer_email: customerEmail,
            customer_phone: customerPhone
          });

          if (verifyResult.success && verifyResult.verified) {
            onSuccess(verifyResult);
          } else {
            onError('Payment verification failed. Please contact support with your payment ID: ' + response.razorpay_payment_id);
          }
        } catch (verifyErr: any) {
          onError(verifyErr.message || 'Payment verification error. Please contact support.');
        }
      },
      modal: {
        ondismiss: () => {
          if (onCancel) onCancel();
        }
      }
    };

    const rzp = new (window as any).Razorpay(razorpayOptions);
    rzp.on('payment.failed', (response: any) => {
      onError(response.error?.description || 'Payment failed. Please try again.');
    });
    rzp.open();

  } catch (err: any) {
    console.error('Error initiating Razorpay payment:', err);
    onError(err.message || 'Failed to initialize payment gateway. Please try again.');
  }
}

/**
 * Interactive modal for Razorpay Test Simulation mode
 */
function renderRazorpaySimulationModal({
  template,
  amount,
  customerName,
  customerEmail,
  customerPhone,
  onConfirm,
  onDecline,
  onCancel
}: {
  template: Template;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
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
          <h3 class="text-base font-bold text-[#111827]">Razorpay Test Checkout</h3>
        </div>
        <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#6D5DFB]/10 text-[#6D5DFB]">Simulation Mode</span>
      </div>

      <div class="space-y-3 mb-6">
        <div class="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
          <div class="text-xs text-[#64748B]">Digital Template:</div>
          <div class="text-sm font-bold text-[#111827] mt-0.5 truncate">${template.title}</div>
          <div class="mt-2 flex items-center justify-between text-xs pt-2 border-t border-[#E2E8F0]">
            <span class="text-[#64748B]">Price (INR):</span>
            <span class="text-base font-extrabold text-[#111827] font-mono">&#x20B9;${amount}</span>
          </div>
          <div class="mt-1 flex items-center justify-between text-xs text-[#64748B]">
            <span>Buyer:</span>
            <span class="font-medium text-[#334155]">${customerName} (${customerEmail})</span>
          </div>
          ${customerPhone ? `
          <div class="mt-1 flex items-center justify-between text-xs text-[#64748B]">
            <span>Phone:</span>
            <span class="font-medium text-[#334155]">${customerPhone}</span>
          </div>
          ` : ''}
        </div>

        <div class="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs leading-relaxed">
          <strong>Test Mode Active:</strong> Razorpay API keys are not yet configured in <code class="bg-indigo-100 px-1 py-0.5 rounded font-mono">.env</code>. Simulate the payment flow below to test order completion and digital template access.
        </div>
      </div>

      <div class="space-y-2.5">
        <button id="rzp-sim-success-btn" class="w-full py-3 px-4 rounded-xl font-bold text-sm bg-[#6D5DFB] hover:bg-[#5B4CE0] text-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-2">
          <span>&#x2713; Simulate Successful Payment (Instant Access)</span>
        </button>
        <button id="rzp-sim-fail-btn" class="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#64748B] hover:text-[#111827] transition-all cursor-pointer">
          Simulate Payment Failure
        </button>
        <button id="rzp-sim-cancel-btn" class="w-full py-1.5 text-center text-xs text-[#94A3B8] hover:text-[#64748B] cursor-pointer">
          Cancel
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const cleanup = () => overlay.remove();

  overlay.querySelector('#rzp-sim-success-btn')?.addEventListener('click', () => {
    cleanup();
    onConfirm();
  });

  overlay.querySelector('#rzp-sim-fail-btn')?.addEventListener('click', () => {
    cleanup();
    onDecline();
  });

  overlay.querySelector('#rzp-sim-cancel-btn')?.addEventListener('click', () => {
    cleanup();
    onCancel();
  });
}
