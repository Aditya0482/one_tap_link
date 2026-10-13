import React from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle
} from 'lucide-react';
import { Order, PaymentStatus, AccessStatus } from '../types';

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
  onUpdateStatus?: (orderId: string, paymentStatus: PaymentStatus, accessStatus?: AccessStatus) => Promise<void>;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-xl rounded-2xl border border-[#E2E8F0] shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div>
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
              Order Detail
            </span>
            <h2 className="text-base font-extrabold text-[#111827] font-mono">
              {order.id}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#111827] hover:bg-[#E2E8F0]/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#111827]">
          {/* Customer Info */}
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#6D5DFB]">
              Customer Information
            </h3>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[#64748B] block">Full Name</span>
                <span className="font-bold text-sm text-[#111827]">{order.customer_name}</span>
              </div>
              <div>
                <span className="text-[#64748B] block">Email Address</span>
                <span className="font-semibold text-sm text-[#111827] truncate block">{order.customer_email}</span>
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#6D5DFB]">
              Purchased Product
            </h3>
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="font-bold text-sm text-[#111827] block">
                  {order.template_title || 'Digital Template'}
                </span>
                <span className="text-[10px] text-[#64748B] font-mono">
                  ID: {order.template_id}
                </span>
              </div>
              <div className="text-base font-extrabold text-[#111827] font-mono">
                ₹{order.amount} {order.currency}
              </div>
            </div>
          </div>

          {/* Payment & Access Status Info */}
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#6D5DFB]">
              Order & Payment Status
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[#64748B] text-[11px] block mb-1">Payment Status</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  order.payment_status === 'Paid'
                    ? 'bg-[#22C55E]/10 text-[#15803D] border border-[#22C55E]/20'
                    : order.payment_status === 'Pending'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {order.payment_status === 'Paid' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                  ) : order.payment_status === 'Pending' ? (
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  )}
                  {order.payment_status}
                </span>
              </div>

              <div>
                <span className="text-[#64748B] text-[11px] block mb-1">Delivery Access</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  order.access_status === 'Granted'
                    ? 'bg-[#22C55E]/10 text-[#15803D] border border-[#22C55E]/20'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {order.access_status === 'Granted' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  {order.access_status || 'Granted'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-[11px] text-[#64748B] pt-3 border-t border-[#E2E8F0]">
              <div>
                <span>Razorpay Payment ID:</span>
                <span className="font-mono font-bold text-[#111827] block truncate mt-0.5">
                  {order.razorpay_payment_id || order.payment_reference || 'N/A'}
                </span>
              </div>
              <div>
                <span>Razorpay Order ID:</span>
                <span className="font-mono font-bold text-[#111827] block truncate mt-0.5">
                  {order.razorpay_order_id || 'N/A'}
                </span>
              </div>
              {order.user_id && (
                <div>
                  <span>Customer User ID:</span>
                  <span className="font-mono text-[#64748B] block truncate mt-0.5">
                    {order.user_id}
                  </span>
                </div>
              )}
              <div>
                <span>Order Placed:</span>
                <span className="text-[#111827] font-medium block mt-0.5">
                  {new Date(order.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with ONLY Close button */}
        <div className="px-6 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#111827] hover:bg-black transition-colors cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
