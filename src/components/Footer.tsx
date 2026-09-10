import React from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  Heart,
  ArrowRight
} from 'lucide-react';
import { ModalType } from './InfoModals';
import { OneTapLogo } from './OneTapLogo';

interface FooterProps {
  onNavigate: (view: any, payload?: any) => void;
  onOpenModal: (type: ModalType) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenModal }) => {
  return (
    <footer className="bg-white border-t border-[#E2E8F0] pt-14 pb-12 text-[#64748B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-[#E2E8F0]">
          {/* Col 1: Brand & Bio */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl border border-[#E2E8F0] bg-white p-0.5 flex items-center justify-center shadow-2xs">
                <OneTapLogo className="w-full h-full" />
              </div>
              <span className="font-extrabold text-lg text-[#111827] tracking-tight">
                OneTap<span className="text-[#6D5DFB]">Link</span>
              </span>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed max-w-sm">
              Save time with professionally engineered Google Sheets and digital workspace templates. Instant one-click copy, automated formulas, and lifetime access.
            </p>
            <div className="flex items-center gap-3 text-[11px] text-[#22C55E] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
              <span>Instant Digital Delivery Active</span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div className="md:col-span-2 space-y-3 text-xs">
            <div className="font-bold text-[#111827] uppercase tracking-wider text-[11px]">
              Store
            </div>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className="hover:text-[#111827] transition-colors cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('templates')}
                  className="hover:text-[#111827] transition-colors cursor-pointer"
                >
                  Browse Templates
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('about')}
                  className="hover:text-[#111827] transition-colors cursor-pointer"
                >
                  About Studio
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Support & Contact */}
          <div className="md:col-span-2 space-y-3 text-xs">
            <div className="font-bold text-[#111827] uppercase tracking-wider text-[11px]">
              Support
            </div>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('contact')}
                  className="hover:text-[#111827] transition-colors cursor-pointer"
                >
                  Help & Contact
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('policy', 'delivery')}
                  className="hover:text-[#111827] transition-colors cursor-pointer"
                >
                  Delivery Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('policy', 'refund')}
                  className="hover:text-[#111827] transition-colors cursor-pointer"
                >
                  Cancellation & Refund
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal */}
          <div className="md:col-span-3 space-y-3 text-xs">
            <div className="font-bold text-[#111827] uppercase tracking-wider text-[11px]">
              Legal Policies
            </div>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('policy', 'privacy')}
                  className="hover:text-[#111827] transition-colors cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('policy', 'terms')}
                  className="hover:text-[#111827] transition-colors cursor-pointer"
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('policy', 'delivery')}
                  className="hover:text-[#111827] transition-colors cursor-pointer"
                >
                  Delivery Policy
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 text-center text-xs text-[#64748B]">
          <div>
            &copy; {new Date().getFullYear()} OneTapLink Store. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
