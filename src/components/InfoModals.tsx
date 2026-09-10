import React from 'react';
import { 
  X, 
  ShieldCheck, 
  FileText, 
  RotateCcw, 
  Mail, 
  HelpCircle, 
  Info,
  CheckCircle2,
  Table,
  Truck
} from 'lucide-react';

export type ModalType = 'privacy' | 'terms' | 'delivery' | 'refund' | 'contact' | 'about' | null;

interface InfoModalProps {
  type: ModalType;
  onClose: () => void;
  onNavigateToPage?: (tab: 'privacy' | 'terms' | 'delivery' | 'refund') => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ type, onClose, onNavigateToPage }) => {
  if (!type) return null;

  const renderContent = () => {
    switch (type) {
      case 'about':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#6D5DFB]">
              <Table className="w-5 h-5" />
              <h3 className="text-base font-bold text-[#111827]">About OneTapLink</h3>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              OneTapLink builds plug-and-play, automated Google Sheets and Workspace digital templates designed for high-performance individuals, entrepreneurs, and busy professionals.
            </p>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Every template is meticulously engineered with automated formulas, visual dashboards, and intuitive layouts so you can jump straight into tracking and executing without building spreadsheets from scratch.
            </p>
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-xs">
              <div className="font-bold text-[#111827]">Why Choose Our Google Templates:</div>
              <div className="flex items-center gap-2 text-[#64748B]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                <span>One-click copy directly into your personal Google Drive</span>
              </div>
              <div className="flex items-center gap-2 text-[#64748B]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                <span>Zero complex formulas to write or debug</span>
              </div>
              <div className="flex items-center gap-2 text-[#64748B]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                <span>Lifetime access with no recurring subscription fees</span>
              </div>
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#6D5DFB]">
              <Mail className="w-5 h-5" />
              <h3 className="text-base font-bold text-[#111827]">Contact Customer Support</h3>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Need assistance with your Google Sheets template or have a question before purchasing? Our team is here to assist you promptly.
            </p>
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3 text-xs">
              <div>
                <span className="text-[#64748B] block font-medium">Direct Support Email:</span>
                <a href="mailto:contactonetaplink@gmail.com" className="font-bold text-[#6D5DFB] hover:underline">
                  contactonetaplink@gmail.com
                </a>
              </div>
              <div>
                <span className="text-[#64748B] block font-medium">Response Time:</span>
                <span className="font-semibold text-[#111827]">Within 24 hours</span>
              </div>
              <div>
                <span className="text-[#64748B] block font-medium">Digital Delivery:</span>
                <span className="text-[#111827]">Worldwide Instant Google Drive Access</span>
              </div>
            </div>
          </div>
        );

      case 'refund':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#6D5DFB]">
              <RotateCcw className="w-5 h-5" />
              <h3 className="text-base font-bold text-[#111827]">Cancellation & Refund Policy</h3>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Because our templates are instant digital goods delivered to Google Drive, traditional returns are not applicable once accessed. However, we guarantee complete protection for technical issues and duplicate charges.
            </p>
            <div className="space-y-2 text-xs text-[#64748B]">
              <div className="font-bold text-[#111827]">Eligible for full refund:</div>
              <ul className="list-disc pl-4 space-y-1">
                <li>Defective formulas or sheet errors our team cannot fix within 24 hours.</li>
                <li>Accidental duplicate transactions or double billing.</li>
                <li>Inability to deliver the access link to your email.</li>
              </ul>
              <div className="font-bold text-[#111827] pt-2">How to request a refund:</div>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Send an email to <strong className="text-[#111827]">contactonetaplink@gmail.com</strong> with your Order ID.</li>
                <li>Our team reviews all requests within 24 hours.</li>
                <li>Approved refunds are credited back to your original payment method within 5–7 business days.</li>
              </ol>
            </div>
          </div>
        );

      case 'delivery':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#6D5DFB]">
              <Truck className="w-5 h-5" />
              <h3 className="text-base font-bold text-[#111827]">Digital Delivery Policy</h3>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              All OneTapLink templates are delivered 100% digitally. Zero physical shipping, zero courier waiting times.
            </p>
            <div className="space-y-2 text-xs text-[#64748B]">
              <div className="font-bold text-[#111827]">Delivery Process:</div>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Instant on-screen access immediately upon payment completion.</li>
                <li>Automatic email confirmation sent with a permanent template link.</li>
                <li>One-click copy directly into your personal Google Drive account.</li>
              </ol>
              <div className="font-bold text-[#111827] pt-2">Delivery Time:</div>
              <p>Delivered within 0–2 minutes post checkout. Need help? Email contactonetaplink@gmail.com.</p>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#6D5DFB]">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="text-base font-bold text-[#111827]">Privacy Policy</h3>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Your privacy and data security are our highest priority. We strictly collect only essential information required to deliver your digital template.
            </p>
            <div className="space-y-2 text-xs text-[#64748B]">
              <div className="font-bold text-[#111827]">1. Minimal Data Collection:</div>
              <p>Customer name and email solely for digital license delivery and order receipts.</p>
              <div className="font-bold text-[#111827]">2. Zero Google Drive Access:</div>
              <p>We do not have access to your private Google Drive or any data entered into your copy of the sheet.</p>
              <div className="font-bold text-[#111827]">3. No Selling of Data:</div>
              <p>We strictly never sell, rent, or lease customer data to any third-party marketing firms.</p>
            </div>
          </div>
        );

      case 'terms':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#6D5DFB]">
              <FileText className="w-5 h-5" />
              <h3 className="text-base font-bold text-[#111827]">Terms & Conditions</h3>
            </div>
            <div className="space-y-2 text-xs text-[#64748B] leading-relaxed">
              <div className="font-bold text-[#111827]">1. License Grant:</div>
              <p>Upon purchase, you receive a perpetual, non-exclusive license for personal or internal business operations.</p>
              <div className="font-bold text-[#111827]">2. Anti-Piracy & Redistribution:</div>
              <p>You may not resell, sub-license, publicly share, or distribute the raw template files.</p>
              <div className="font-bold text-[#111827]">3. One-Time Payment:</div>
              <p>All template fees are strictly one-time payments with lifetime access.</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl border border-[#E2E8F0] shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
            Information & Legal Policy
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#64748B] hover:text-[#111827] hover:bg-[#E2E8F0]/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {renderContent()}
        </div>

        <div className="px-6 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          {['privacy', 'terms', 'delivery', 'refund'].includes(type) && onNavigateToPage ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToPage(type as any);
              }}
              className="text-xs font-bold text-[#6D5DFB] hover:underline cursor-pointer"
            >
              View Full Policy Page →
            </button>
          ) : <div />}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#111827] text-white hover:bg-[#1f2937] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
