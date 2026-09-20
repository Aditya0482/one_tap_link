import React from 'react';
import { 
  CheckCircle2, 
  ExternalLink, 
  ArrowLeft, 
  Download, 
  FileSpreadsheet, 
  HelpCircle, 
  Sparkles, 
  ShieldCheck, 
  FolderSync, 
  Printer, 
  MailCheck, 
  Clock, 
  Check 
} from 'lucide-react';
import { Order } from '../types';
import { OneTapLogo } from './OneTapLogo';

interface ThankYouProps {
  order: Order;
  onBackToStore: () => void;
  onOpenPurchases?: () => void;
}

export const ThankYou: React.FC<ThankYouProps> = ({
  order,
  onBackToStore,
  onOpenPurchases
}) => {
  const accessUrl = order.access_url || 'https://docs.google.com/spreadsheets/u/0/';
  const paymentRef = order.instamojo_payment_id || order.razorpay_payment_id || order.payment_reference || 'N/A';
  
  // Format payment date
  const orderDate = order.created_at ? new Date(order.created_at) : new Date();
  const formattedDate = orderDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const formattedTime = orderDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="thank-you-page" className="min-h-screen bg-[#F8FAFC] py-10 sm:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ========================================================= */}
        {/* 1. ON-SCREEN USER INTERFACE (Hidden during actual print) */}
        {/* ========================================================= */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#E2E8F0] shadow-sm text-center print:hidden">
          {/* Green Success Icon */}
          <div className="w-16 h-16 rounded-full bg-[#22C55E]/15 text-[#22C55E] flex items-center justify-center mx-auto mb-5 shadow-xs">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          {/* Heading & Subtext */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            Payment Successful!
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#64748B]">
            Thank you for your purchase. Your template is ready for instant use.
          </p>

          {/* Quick Print / Save Receipt Banner Bar */}
          <div className="mt-6 p-4 rounded-2xl bg-[#6D5DFB]/5 border border-[#6D5DFB]/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#6D5DFB] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-[#111827] block">
                  Official Payment Receipt Ready
                </span>
                <span className="text-[11px] text-[#64748B] block">
                  Save as PDF or Print without cut-offs (Formatted with borders)
                </span>
              </div>
            </div>

            <div className="flex items-center w-full sm:w-auto">
              <button
                type="button"
                onClick={handlePrint}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#6D5DFB] hover:bg-[#5B4CE0] text-white shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>

          {/* Order Details Receipt Box on Screen */}
          <div className="mt-6 p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-left space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Order & Payment Summary
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#22C55E] bg-[#22C55E]/10 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Paid & Verified</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#64748B] block">Order ID</span>
                <span className="font-mono font-bold text-[#111827]">{order.id}</span>
              </div>
              <div>
                <span className="text-[#64748B] block">Delivery Email</span>
                <span className="font-semibold text-[#111827] truncate block">
                  {order.customer_email}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block">Purchased Template</span>
                <span className="font-bold text-[#111827] block">
                  {order.template_title || 'Digital Template'}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block">Total Amount Paid</span>
                <span className="font-mono font-bold text-[#111827]">
                  ₹{order.amount} {order.currency || 'INR'}
                </span>
              </div>
              <div className="sm:col-span-2 pt-2 border-t border-[#E2E8F0]">
                <span className="text-[#64748B] block">Payment Reference ID</span>
                <span className="font-mono text-[11px] font-semibold text-[#6D5DFB] truncate block">
                  {paymentRef}
                </span>
              </div>
            </div>

            <div className="mt-3 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60 flex items-start gap-2.5 text-left text-xs text-emerald-800">
              <MailCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Email Receipt Delivered:</span> An official invoice & payment confirmation has also been dispatched directly to your email ({order.customer_email}).
              </div>
            </div>
          </div>

          {/* Delivery & Access CTA */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              id="access-template-btn"
              href={accessUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-bold bg-[#6D5DFB] hover:bg-[#5B4CE0] text-white shadow-[0_4px_16px_rgba(109,93,251,0.3)] hover:shadow-[0_8px_24px_rgba(109,93,251,0.4)] transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>Access Template</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            {onOpenPurchases && (
              <button
                type="button"
                onClick={onOpenPurchases}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-bold text-[#6D5DFB] bg-[#6D5DFB]/10 hover:bg-[#6D5DFB]/20 transition-colors cursor-pointer"
              >
                <span>View in My Purchases</span>
              </button>
            )}

            <button
              id="back-to-store-success-btn"
              type="button"
              onClick={onBackToStore}
              className="w-full sm:w-auto px-6 py-4 rounded-xl text-sm font-semibold text-[#64748B] hover:text-[#111827] hover:bg-[#F8FAFC] border border-[#E2E8F0] transition-colors cursor-pointer"
            >
              Back to Store
            </button>
          </div>

          {/* 3 Step Instructions */}
          <div className="mt-10 pt-8 border-t border-[#E2E8F0] text-left">
            <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider mb-4 text-center sm:text-left">
              Quick Instructions to Copy Template
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="w-6 h-6 rounded-md bg-[#6D5DFB]/10 text-[#6D5DFB] font-bold text-xs flex items-center justify-center mb-2">
                  1
                </div>
                <div className="text-xs font-bold text-[#111827]">Click Access Template</div>
                <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed">
                  Click the purple button above to open the secure Google link.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="w-6 h-6 rounded-md bg-[#6D5DFB]/10 text-[#6D5DFB] font-bold text-xs flex items-center justify-center mb-2">
                  2
                </div>
                <div className="text-xs font-bold text-[#111827]">Make a Copy</div>
                <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed">
                  Click &ldquo;Make a copy&rdquo; in Google Sheets to save it directly to your Drive.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="w-6 h-6 rounded-md bg-[#6D5DFB]/10 text-[#6D5DFB] font-bold text-xs flex items-center justify-center mb-2">
                  3
                </div>
                <div className="text-xs font-bold text-[#111827]">Ready to Use</div>
                <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed">
                  All formulas and automated tracking are pre-configured.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. DEDICATED OFFICIAL PRINTABLE RECEIPT / INVOICE                         */}
        {/* This document is styled with strict borders and avoid-page-break rules.   */}
        {/* It is automatically displayed when printing (and inside preview modal).  */}
        {/* ========================================================================= */}
        <div className="receipt-printable-doc hidden print:block">
          <PrintableReceiptContent
            order={order}
            accessUrl={accessUrl}
            paymentRef={paymentRef}
            formattedDate={formattedDate}
            formattedTime={formattedTime}
          />
        </div>

      </div>
    </div>
  );
};

// =========================================================================
// PURE PRINTABLE RECEIPT COMPONENT
// Carefully formatted to avoid cutting borders across 1 or 2 printed pages.
// =========================================================================
interface PrintableReceiptContentProps {
  order: Order;
  accessUrl: string;
  paymentRef: string;
  formattedDate: string;
  formattedTime: string;
}

const PrintableReceiptContent: React.FC<PrintableReceiptContentProps> = ({
  order,
  accessUrl,
  paymentRef,
  formattedDate,
  formattedTime
}) => {
  return (
    <div className="space-y-6 text-slate-900 text-xs font-sans leading-relaxed">
      
      {/* 1. Brand & Header Block (Avoid page break) */}
      <div className="receipt-avoid-break pb-5 border-b-2 border-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl border-2 border-slate-900 bg-white p-1 flex items-center justify-center shrink-0">
            <OneTapLogo className="w-full h-full" />
          </div>
          <div>
            <div className="text-xl font-black tracking-tight text-slate-950">
              OneTap<span className="text-[#6D5DFB]">Link</span>
            </div>
            <div className="text-[11px] text-slate-600 font-medium">
              Digital Workspace Templates • onetaplink.site
            </div>
            <div className="text-[10px] text-slate-500">
              Support: support@onetaplink.site
            </div>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <div className="inline-block px-2.5 py-1 rounded border border-emerald-600 bg-emerald-50 text-emerald-700 font-extrabold text-[11px] tracking-wider uppercase mb-1">
            ✓ Paid & Verified
          </div>
          <div className="text-sm font-black text-slate-950 tracking-tight uppercase">
            Payment Receipt
          </div>
          <div className="text-[11px] text-slate-600 font-mono">
            Ref: {order.id}
          </div>
        </div>
      </div>

      {/* 2. Customer & Billing Details Block (Avoid page break) */}
      <div className="receipt-avoid-break grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-300">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Billed & Delivered To:
          </span>
          <div className="font-bold text-slate-900 text-sm">
            {order.customer_name || 'Customer'}
          </div>
          <div className="font-medium text-slate-700 text-xs break-all">
            {order.customer_email}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Instant digital access licensed
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Transaction Details:
          </span>
          <div className="space-y-0.5 text-xs text-slate-800">
            <div>
              <span className="text-slate-500">Date & Time: </span>
              <span className="font-semibold">{formattedDate}, {formattedTime}</span>
            </div>
            <div>
              <span className="text-slate-500">Payment Gateway: </span>
              <span className="font-semibold text-slate-900">
                {order.instamojo_payment_id ? 'Instamojo (Verified)' : (order.razorpay_payment_id ? 'Razorpay (Verified)' : 'Online Payment (Verified)')}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Payment ID: </span>
              <span className="font-mono font-semibold text-slate-900">{paymentRef}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Items Table (Formatted with crisp borders, rows avoid break) */}
      <div className="receipt-avoid-break">
        <table className="w-full border-collapse border border-slate-900 text-left">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-900 text-slate-900 text-[11px] font-bold uppercase tracking-wider">
              <th className="py-2.5 px-3 w-10 text-center border-r border-slate-900">#</th>
              <th className="py-2.5 px-3 border-r border-slate-900">Item Description</th>
              <th className="py-2.5 px-3 w-28 text-center border-r border-slate-900">Type</th>
              <th className="py-2.5 px-3 w-16 text-center border-r border-slate-900">Qty</th>
              <th className="py-2.5 px-3 w-28 text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-300">
              <td className="py-3 px-3 text-center border-r border-slate-900 font-mono text-slate-500">1</td>
              <td className="py-3 px-3 border-r border-slate-900 font-medium">
                <div className="font-bold text-slate-950 text-xs sm:text-sm">
                  {order.template_title || 'Digital Template'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Clean layout, instant copy & complete template access
                </div>
              </td>
              <td className="py-3 px-3 text-center border-r border-slate-900 text-[11px] text-slate-600">
                Digital Asset
              </td>
              <td className="py-3 px-3 text-center border-r border-slate-900 font-mono">
                1
              </td>
              <td className="py-3 px-3 text-right font-mono font-bold text-slate-950">
                ₹{order.amount}.00
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-300">
              <td colSpan={4} className="py-2 px-3 text-right text-slate-600 border-r border-slate-900">
                Subtotal
              </td>
              <td className="py-2 px-3 text-right font-mono font-semibold text-slate-800">
                ₹{order.amount}.00
              </td>
            </tr>
            <tr className="border-t border-slate-200">
              <td colSpan={4} className="py-2 px-3 text-right text-slate-600 border-r border-slate-900">
                Taxes (GST Included)
              </td>
              <td className="py-2 px-3 text-right font-mono font-semibold text-slate-800">
                ₹0.00
              </td>
            </tr>
            <tr className="border-t-2 border-slate-900 bg-slate-50">
              <td colSpan={4} className="py-2.5 px-3 text-right font-black uppercase tracking-wider text-slate-950 border-r border-slate-900">
                Total Amount Paid
              </td>
              <td className="py-2.5 px-3 text-right font-mono font-black text-sm text-slate-950">
                ₹{order.amount}.00 {order.currency || 'INR'}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 4. Template Access Link Information (Avoid page break) */}
      <div className="receipt-avoid-break p-3.5 rounded-lg border border-slate-300 bg-slate-50 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
          <FolderSync className="w-3.5 h-3.5 text-[#6D5DFB]" />
          <span>Your Instant Template Access Link:</span>
        </div>
        <div className="font-mono text-[10px] text-slate-800 break-all bg-white p-2 rounded border border-slate-200">
          {accessUrl}
        </div>
        <p className="text-[10px] text-slate-500 italic">
          Keep this link safe. You can access and copy your template anytime.
        </p>
      </div>

      {/* 5. Official Verification Stamp & Terms (Avoid page break) */}
      <div className="receipt-avoid-break pt-4 border-t border-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[10px] text-slate-500">
        <div>
          <div className="font-semibold text-slate-700">OneTapLink Terms & Conditions:</div>
          <div>• Single user license for personal and commercial workspace use.</div>
          <div>• Non-refundable digital download as per digital goods policy.</div>
        </div>

        <div className="text-left sm:text-right">
          <div className="font-bold text-slate-800 uppercase tracking-wider">
            Verified Computer-Generated Receipt
          </div>
          <div>Authorized Online Payment Gateway Transaction</div>
          <div className="text-slate-400 mt-0.5">onetaplink.site • support@onetaplink.site</div>
        </div>
      </div>

    </div>
  );
};
