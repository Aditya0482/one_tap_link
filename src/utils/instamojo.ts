import { Template } from '../types';
import { api } from '../services/api';

export interface InstamojoCheckoutOptions {
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
 * Initiates checkout via Instamojo Payment Request API.
 * - In Live/Sandbox mode: Generates payment link and redirects customer to Instamojo checkout page.
 * - In Test Simulation mode (when API keys are not set): Launches interactive simulated checkout popup.
 */
export async function initiateInstamojoPayment({
  template,
  user,
  onSuccess,
  onError,
  onCancel
}: InstamojoCheckoutOptions): Promise<void> {
  try {
    const customerName = user.displayName || user.email?.split('@')[0] || 'Customer';
    const customerEmail = user.email || 'customer@onetaplink.com';
    const customerPhone = user.phone || '';

    // 1. Create Instamojo payment request on server
    const requestData = await (api as any).createInstamojoPaymentRequest?.({
      template_id: template.id,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      user_id: user.uid
    }) || { success: false };

    if (!requestData.success) {
      onError('Unable to initialize payment request with the server. Please check your internet connection and try again.');
      return;
    }

    const displayPrice = template.sale_price ?? template.price;
    const paymentRequestId = requestData.payment_request_id || requestData.order_id;

    // 2. Fast handling for Test Simulation when Instamojo credentials are not configured
    if (requestData.is_test_simulation || !requestData.payment_url) {
      renderInstamojoSimulationModal({
        template,
        amount: displayPrice,
        customerName,
        customerEmail,
        customerPhone,
        onConfirm: async () => {
          try {
            const verifyResult = await (api as any).simulateInstamojoPayment?.({
              payment_request_id: paymentRequestId,
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

    // 3. Live / Sandbox Mode: Redirect customer directly to Instamojo Secure Checkout Page
    // Instamojo redirects back to /api/instamojo/callback upon completion
    window.location.href = requestData.payment_url;
  } catch (err: any) {
    console.error('Error initiating Instamojo payment:', err);
    onError(err.message || 'Failed to initialize payment gateway. Please try again.');
  }
}

/**
 * Interactive modal for Instamojo Test Simulation mode
 */
function renderInstamojoSimulationModal({
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
  const modalId = 'instamojo-sim-modal';
  const existing = document.getElementById(modalId);
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = modalId;
  overlay.className = 'fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150';

  overlay.innerHTML = `
    <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E2E8F0] font-sans">
      <div class="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-4">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse"></span>
          <h3 class="text-base font-bold text-[#111827]">Instamojo Test Checkout</h3>
        </div>
        <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#10B981]/10 text-[#059669]">Simulation Mode</span>
      </div>

      <div class="space-y-3 mb-6">
        <div class="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
          <div class="text-xs text-[#64748B]">Digital Template:</div>
          <div class="text-sm font-bold text-[#111827] mt-0.5 truncate">${template.title}</div>
          <div class="mt-2 flex items-center justify-between text-xs pt-2 border-t border-[#E2E8F0]">
            <span class="text-[#64748B]">Price (INR):</span>
            <span class="text-base font-extrabold text-[#111827] font-mono">₹${amount}</span>
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

        <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs leading-relaxed">
          <strong>Test Mode Active:</strong> Instamojo API keys are not yet configured in <code class="bg-emerald-100 px-1 py-0.5 rounded font-mono">.env</code>. You can simulate the instant UPI/Card payment flow below to test order completion and digital template access.
        </div>
      </div>

      <div class="space-y-2.5">
        <button id="sim-success-btn" class="w-full py-3 px-4 rounded-xl font-bold text-sm bg-[#10B981] hover:bg-[#059669] text-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-2">
          <span>✓ Simulate Successful Payment (Instant Access)</span>
        </button>
        <button id="sim-fail-btn" class="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#64748B] hover:text-[#111827] transition-all cursor-pointer">
          Simulate Payment Failure
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
