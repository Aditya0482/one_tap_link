import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Truck, 
  RotateCcw, 
  CheckCircle2, 
  Mail, 
  HelpCircle, 
  AlertCircle, 
  ArrowLeft, 
  Lock, 
  Sparkles, 
  ExternalLink,
  Clock,
  ChevronRight
} from 'lucide-react';

export type PolicyTab = 'privacy' | 'terms' | 'delivery' | 'refund';

interface LegalPolicyPageProps {
  initialTab?: PolicyTab;
  onNavigate: (view: any) => void;
}

export const LegalPolicyPage: React.FC<LegalPolicyPageProps> = ({
  initialTab = 'privacy',
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<PolicyTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (tab: PolicyTab) => {
    setActiveTab(tab);
    window.location.hash = tab === 'refund' ? 'cancellation-refund-policy' : `${tab}-policy`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen py-10 sm:py-14 bg-[#F8FAFC]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#64748B] hover:text-[#111827] transition-colors cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-[#E2E8F0] shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Store</span>
          </button>

          <div className="text-[11px] font-medium text-[#64748B] bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            Last Updated: January 2025
          </div>
        </div>

        {/* Hero Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6D5DFB]/10 text-[#6D5DFB] text-xs font-bold mb-3 border border-[#6D5DFB]/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Trust & Compliance Center</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#111827] tracking-tight">
            Store Legal & Operating Policies
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-[#64748B] leading-relaxed">
            Transparent, customer-friendly policies governing our automated Google Sheets templates, digital delivery, security, and refund procedures.
          </p>
        </div>

        {/* Policy Tab Navigation */}
        <div className="flex items-center justify-start sm:justify-center overflow-x-auto no-scrollbar gap-2 mb-8 p-1.5 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs">
          <button
            type="button"
            onClick={() => handleTabChange('privacy')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-[#6D5DFB] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#111827] hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Privacy Policy</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('terms')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-[#6D5DFB] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#111827] hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Terms & Conditions</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('delivery')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'delivery'
                ? 'bg-[#6D5DFB] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#111827] hover:bg-slate-50'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Delivery Policy</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('refund')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'refund'
                ? 'bg-[#6D5DFB] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#111827] hover:bg-slate-50'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Cancellation & Refund Policy</span>
          </button>
        </div>

        {/* Active Policy Content Card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs p-6 sm:p-10">
          
          {/* TAB 1: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <article className="space-y-8 text-[#111827]">
              <div>
                <div className="flex items-center gap-2 text-[#6D5DFB] font-bold text-xs uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Data Protection & Confidentiality</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#111827]">
                  Privacy Policy
                </h2>
                <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                  At OneTapLink, we prioritize your data privacy above everything else. This policy explains what minimal data we collect, how it is processed, and our strict non-access policy regarding your private Google spreadsheets.
                </p>
              </div>

              {/* Point 1 */}
              <section className="space-y-3 pt-4 border-t border-[#F1F5F9]">
                <h3 className="text-sm sm:text-base font-bold text-[#111827] flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#6D5DFB]/10 text-[#6D5DFB] text-xs font-mono font-bold">1</span>
                  Information We Collect
                </h3>
                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                  We strictly collect only the essential information necessary to process your digital order and grant access to your Google Sheets template:
                </p>
                <ul className="space-y-2 text-xs sm:text-sm text-[#475569] pl-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                    <span><strong>Customer Name & Email Address:</strong> Used strictly to dispatch your Google Drive template copy link and order invoice.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                    <span><strong>Transaction Metadata:</strong> Unique Order ID, date/time, and payment status verification provided by our payment gateway.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                    <span><strong>Support Communications:</strong> Messages or inquiries you submit through our contact desk to provide customer assistance.</span>
                  </li>
                </ul>
              </section>

              {/* Point 2: Critical Google Privacy Notice */}
              <section className="space-y-3 pt-4 border-t border-[#F1F5F9]">
                <h3 className="text-sm sm:text-base font-bold text-[#111827] flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#6D5DFB]/10 text-[#6D5DFB] text-xs font-mono font-bold">2</span>
                  Zero Access to Your Google Drive & Spreadsheet Data
                </h3>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-xl space-y-2 text-xs sm:text-sm text-[#475569]">
                  <p className="font-semibold text-[#111827]">
                    Your financial records, numbers, and personal notes remain 100% private to you:
                  </p>
                  <ul className="space-y-1.5 pl-1">
                    <li>• When you click to duplicate a OneTapLink template, Google creates a standalone, disconnected copy directly in your personal Google Drive account.</li>
                    <li>• OneTapLink and our team <strong>NEVER have access</strong> to view, edit, store, or transmit any data or calculations entered into your spreadsheet copy.</li>
                    <li>• We do not request OAuth permissions to read your Google Drive files.</li>
                  </ul>
                </div>
              </section>

              {/* Point 3 */}
              <section className="space-y-3 pt-4 border-t border-[#F1F5F9]">
                <h3 className="text-sm sm:text-base font-bold text-[#111827] flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#6D5DFB]/10 text-[#6D5DFB] text-xs font-mono font-bold">3</span>
                  How We Use Your Information
                </h3>
                <ul className="space-y-2 text-xs sm:text-sm text-[#475569] pl-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                    <span>To verify payment and deliver immediate digital access to purchased templates.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                    <span>To provide dedicated customer support and respond to inquiries within 24 hours.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                    <span>To send critical product updates or formula improvements for templates you own.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                    <span><strong>No Spam Guarantee:</strong> We never sell, rent, lease, or trade your contact information to third-party marketing firms or data brokers.</span>
                  </li>
                </ul>
              </section>

              {/* Point 4 */}
              <section className="space-y-3 pt-4 border-t border-[#F1F5F9]">
                <h3 className="text-sm sm:text-base font-bold text-[#111827] flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#6D5DFB]/10 text-[#6D5DFB] text-xs font-mono font-bold">4</span>
                  Payment Security & Gateway Compliance
                </h3>
                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                  All transactions on OneTapLink are processed through certified, PCI-DSS compliant payment gateways utilizing industry-standard 256-bit SSL encryption. We never store, process, or have access to your raw credit/debit card numbers, CVVs, or UPI PINs.
                </p>
              </section>

              {/* Point 5 */}
              <section className="space-y-3 pt-4 border-t border-[#F1F5F9]">
                <h3 className="text-sm sm:text-base font-bold text-[#111827] flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#6D5DFB]/10 text-[#6D5DFB] text-xs font-mono font-bold">5</span>
                  Your Privacy Rights & Contact
                </h3>
                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                  You retain full rights to request a copy of your purchase receipt, request data deletion from our order logs, or request support at any time. For questions regarding privacy, email our Data Desk at <a href="mailto:contactonetaplink@gmail.com" className="font-bold text-[#6D5DFB] hover:underline">contactonetaplink@gmail.com</a>.
                </p>
              </section>
            </article>
          )}

          {/* TAB 2: TERMS & CONDITIONS */}
          {activeTab === 'terms' && (
            <article className="space-y-8 text-[#111827]">
              <div>
                <div className="flex items-center gap-2 text-[#6D5DFB] font-bold text-xs uppercase tracking-wider mb-1">
                  <FileText className="w-4 h-4" />
                  <span>User Agreement & Store Regulations</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#111827]">
                  Terms & Conditions
                </h2>
                <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                  Please read these Terms & Conditions carefully prior to purchasing or accessing digital Google Sheets templates from OneTapLink.
                </p>
              </div>

              {/* Point 1 */}
              <section className="space-y-3 pt-4 border-t border-[#F1F5F9]">
                <h3 className="text-sm sm:text-base font-bold text-[#111827] flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#6D5DFB]/10 text-[#6D5DFB] text-xs font-mono font-bold">1</span>
                  Acceptance of Terms
                </h3>
                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                  By accessing our website, completing an order, or downloading any Google Sheets template from OneTapLink, you agree to be bound by these Terms & Conditions. If you do not agree to these terms, please do not purchase or use our products.
                </p>
              </section>

              {/* Point 2 */}
              <section className="space-y-3 pt-4 border-t border-[#F1F5F9]">
                <h3 className="text-sm sm:text-base font-bold text-[#111827] flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#6D5DFB]/10 text-[#6D5DFB] text-xs font-mono font-bold">2</span>
                  Digital License Grant & Usage Scope
                </h3>
                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                  Upon verified purchase of a template, OneTapLink grants you a non-exclusive, non-transferable, perpetual, worldwide license to use the template under the following parameters:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div className="bg-[#22C55E]/5 border border-[#22C55E]/20 p-4 rounded-xl">
                    <span className="font-bold text-[#15803D] block mb-1">What You CAN Do:</span>
                    <ul className="space-y-1 text-[#166534]">
                      <li>✓ Use for personal budgeting and organization.</li>
                      <li>✓ Use inside your business or agency internal operations.</li>
                      <li>✓ Modify formatting, columns, rows, colors, and formulas for your workflow.</li>
                      <li>✓ Store forever in your personal Google Drive account.</li>
                    </ul>
                  </div>
                  <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl">
                    <span className="font-bold text-rose-700 block mb-1">What You CANNOT Do:</span>
                    <ul className="space-y-1 text-rose-600">
                      <li>✕ Resell, sub-license, or redistribute our templates.</li>
                      <li>✕ Publicly upload raw sheet links or templates for download.</li>
                      <li>✕ Claim original formula or design authorship as your own product.</li>
                      <li>✕ Bundle templates into commercial resale packs without authorization.</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Point 3 */}
              <section className="space-y-3 pt-4 border-t border-[#F1F5F9]">
                <h3 className="text-sm sm:text-base font-bold text-[#111827] flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#6D5DFB]/10 text-[#6D5DFB] text-xs font-mono font-bold">3</span>
                  Pricing, Payments & Currency
                </h3>
                <ul className="space-y-2 text-xs sm:text-sm text-[#475569] pl-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                    <span><strong>One-Time Pricing:</strong> All template purchases are strictly one-time payments with no recurring subscription fees or hidden costs.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                    <span><strong>Taxes:</strong> All listed prices are inclusive of applicable taxes unless stated otherwise at checkout.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                    <span><strong>Price Adjustments:</strong> We reserve the right to modify template pricing or launch promotional offers without retroactive adjustment on prior purchases.</span>
                  </li>
                </ul>
              </section>

              {/* Point 4 */}
              <section className="space-y-3 pt-4 border-t border-[#F1F5F9]">
                <h3 className="text-sm sm:text-base font-bold text-[#111827] flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#6D5DFB]/10 text-[#6D5DFB] text-xs font-mono font-bold">4</span>
                  Third-Party Trademark Disclaimer
                </h3>
                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                  Google, Google Sheets, and Google Drive are registered trademarks of Google LLC. OneTapLink is an independent design studio creating digital templates compatible with Google Workspace. We are not affiliated with, sponsored by, or endorsed by Google LLC.
                </p>
              </section>

              {/* Point 5 */}
              <section className="space-y-3 pt-4 border-t border-[#F1F5F9]">
                <h3 className="text-sm sm:text-base font-bold text-[#111827] flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#6D5DFB]/10 text-[#6D5DFB] text-xs font-mono font-bold">5</span>
                  Limitation of Liability
                </h3>
                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                  Our templates provide automated calculations, formulas, and dashboards designed to assist your organization. However, they do not constitute certified financial, legal, or tax advice. Users are responsible for verifying specific financial and accounting figures. In no event shall OneTapLink be held liable for indirect, incidental, or consequential damages resulting from user inputs or errors.
                </p>
              </section>
            </article>
          )}

          {/* TAB 3: DELIVERY POLICY */}
          {activeTab === 'delivery' && (
            <article className="space-y-8 text-[#111827]">
              <div>
                <div className="flex items-center gap-2 text-[#6D5DFB] font-bold text-xs uppercase tracking-wider mb-1">
                  <Truck className="w-4 h-4" />
                  <span>Instant Digital Fulfillment</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#111827]">
                  Delivery Policy
                </h2>
                <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                  OneTapLink exclusively sells digital Google Sheets templates. Learn how digital delivery occurs immediately and seamlessly after checkout.
                </p>
              </div>

              {/* Point 1 */}
              <section className="space-y-3 pt-4 border-t border-[#F1F5F9]">
                <h3 className="text-sm sm:text-base font-bold text-[#111827] flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#6D5DFB]/10 text-[#6D5DFB] text-xs font-mono font-bold">1</span>
                  100% Digital Delivery — Zero Physical Shipping
                </h3>
                <div className="bg-[#6D5DFB]/5 border border-[#6D5DFB]/20 p-4 rounded-xl text-xs sm:text-sm text-[#475569]">
                  <p className="font-semibold text-[#111827] mb-1">
                    No physical packaging, couriers, or shipping delays:
                  </p>
                  <p>
                    All items available on our store are downloadable, digital cloud templates. Delivery is executed electronically over secure internet protocols directly to your screen and email inbox.
                  </p>
                </div>
              </section>

              {/* Point 2 */}
              <section className="space-y-3 pt-4 border-t border-[#F1F5F9]">
                <h3 className="text-sm sm:text-base font-bold text-[#111827] flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#6D5DFB]/10 text-[#6D5DFB] text-xs font-mono font-bold">2</span>
                  How Delivery Happens Step-by-Step
                </h3>
                <div className="space-y-3 text-xs sm:text-sm text-[#475569]">
                  <div className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="font-mono font-bold text-xs bg-[#6D5DFB] text-white w-5 h-5 rounded-full flex items-center justify-center shrink-0">1</span>
                    <div>
                      <strong className="text-[#111827] block">Instant On-Screen Access</strong>
                      <span>Immediately upon successful payment, you are redirected to the Order Confirmation page with a direct "Make a Copy in Google Drive" button.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="font-mono font-bold text-xs bg-[#6D5DFB] text-white w-5 h-5 rounded-full flex items-center justify-center shrink-0">2</span>
                    <div>
                      <strong className="text-[#111827] block">Automated Email Backup</strong>
                      <span>A digital confirmation email is automatically sent to the email address provided during checkout containing your Order ID, invoice, and permanent template access link.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="font-mono font-bold text-xs bg-[#6D5DFB] text-white w-5 h-5 rounded-full flex items-center justify-center shrink-0">3</span>
                    <div>
                      <strong className="text-[#111827] block">One-Click Google Drive Cloning</strong>
                      <span>Clicking the template link opens Google Sheets with an official prompt asking to "Make a copy". Once accepted, the master sheet is cloned into your Google account instantly.</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Point 3 */}
              <section className="space-y-3 pt-4 border-t border-[#F1F5F9]">
                <h3 className="text-sm sm:text-base font-bold text-[#111827] flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#6D5DFB]/10 text-[#6D5DFB] text-xs font-mono font-bold">3</span>
                  Delivery Timeframe & SLA
                </h3>
                <ul className="space-y-2 text-xs sm:text-sm text-[#475569] pl-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                    <span><strong>Standard Delivery Time:</strong> Instantaneous (0 to 2 minutes after payment processing).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                    <span><strong>Technical Delay SLA:</strong> In rare cases of email provider delay, delivery completes within 10 minutes maximum.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                    <span><strong>Prerequisites:</strong> A free Google account (Gmail / Google Workspace) with access to Google Sheets is required to open the template.</span>
                  </li>
                </ul>
              </section>

              {/* Point 4 */}
              <section className="space-y-3 pt-4 border-t border-[#F1F5F9]">
                <h3 className="text-sm sm:text-base font-bold text-[#111827] flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#6D5DFB]/10 text-[#6D5DFB] text-xs font-mono font-bold">4</span>
                  Didn’t Receive Your Template Link?
                </h3>
                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                  If you have completed your payment but haven't received your confirmation email:
                </p>
                <ol className="list-decimal pl-4 space-y-1.5 text-xs sm:text-sm text-[#475569]">
                  <li>Check your <strong>Spam</strong>, <strong>Junk</strong>, or <strong>Promotions</strong> folders in your email provider.</li>
                  <li>Verify that you entered the correct email address without typos during checkout.</li>
                  <li>Email our support desk at <a href="mailto:contactonetaplink@gmail.com" className="font-bold text-[#6D5DFB] hover:underline">contactonetaplink@gmail.com</a> with your transaction reference. We will manually dispatch your access link within 24 hours.</li>
                </ol>
              </section>
            </article>
          )}

          {/* TAB 4: CANCELLATION & REFUND POLICY (NO 14-DAY) */}
          {activeTab === 'refund' && (
            <article className="space-y-8 text-[#111827]">
              <div>
                <div className="flex items-center gap-2 text-[#6D5DFB] font-bold text-xs uppercase tracking-wider mb-1">
                  <RotateCcw className="w-4 h-4" />
                  <span>Fair & Transparent Refund Guidelines</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#111827]">
                  Cancellation & Refund Policy
                </h2>
                <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                  We strive for exceptional quality in every Google spreadsheet template we design. Here are the clear guidelines regarding order cancellations, digital product refunds, and technical assistance.
                </p>
              </div>

              {/* Point 1 */}
              <section className="space-y-3 pt-4 border-t border-[#F1F5F9]">
                <h3 className="text-sm sm:text-base font-bold text-[#111827] flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#6D5DFB]/10 text-[#6D5DFB] text-xs font-mono font-bold">1</span>
                  Nature of Digital Goods & Cancellation Policy
                </h3>
                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                  Because OneTapLink templates are delivered instantly via digital Google Drive copy links that cannot be physically returned once accessed, traditional order cancellations are not applicable once template access is generated and dispatched.
                </p>
                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                  However, we believe in complete fairness and protect our customers against technical failures or erroneous charges as outlined below.
                </p>
              </section>

              {/* Point 2 */}
              <section className="space-y-3 pt-4 border-t border-[#F1F5F9]">
                <h3 className="text-sm sm:text-base font-bold text-[#111827] flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#6D5DFB]/10 text-[#6D5DFB] text-xs font-mono font-bold">2</span>
                  Eligible Scenarios for Full Refund
                </h3>
                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                  We gladly honor 100% full refunds under the following circumstances:
                </p>
                <div className="space-y-2.5 text-xs sm:text-sm">
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-emerald-900 block font-semibold">Technical Defect or Broken Formulas</strong>
                      <span className="text-emerald-800">If a template possesses broken formulas or corrupted sheets that our technical support team is unable to fix within 24 hours of being notified.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-emerald-900 block font-semibold">Accidental Duplicate Purchase</strong>
                      <span className="text-emerald-800">If you accidentally paid twice for the same template due to a network glitch or double-click, the duplicate payment is refunded immediately in full.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-emerald-900 block font-semibold">Non-Delivery of Access Link</strong>
                      <span className="text-emerald-800">If you never received the digital access link and our team is unable to deliver it to an alternate email address you provide.</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Point 3 */}
              <section className="space-y-3 pt-4 border-t border-[#F1F5F9]">
                <h3 className="text-sm sm:text-base font-bold text-[#111827] flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#6D5DFB]/10 text-[#6D5DFB] text-xs font-mono font-bold">3</span>
                  Non-Refundable Circumstances
                </h3>
                <ul className="space-y-2 text-xs sm:text-sm text-[#475569] pl-2">
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>Change of mind after successfully cloning or downloading the digital spreadsheet to your Google Drive.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>Inability to use Google Sheets due to lack of a free Google account or unsupported third-party software (e.g. attempting to open in outdated local desktop software).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>Accidental deletion or manual tampering with template formulas by the user after cloning (we provide fresh backup copies free of charge).</span>
                  </li>
                </ul>
              </section>

              {/* Point 4 */}
              <section className="space-y-3 pt-4 border-t border-[#F1F5F9]">
                <h3 className="text-sm sm:text-base font-bold text-[#111827] flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#6D5DFB]/10 text-[#6D5DFB] text-xs font-mono font-bold">4</span>
                  Step-by-Step Refund Request Process
                </h3>
                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                  To initiate a refund request, follow these simple steps:
                </p>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2.5 text-xs sm:text-sm text-[#475569]">
                  <p><strong>Step 1:</strong> Email our official support desk at <a href="mailto:contactonetaplink@gmail.com" className="font-bold text-[#6D5DFB] hover:underline">contactonetaplink@gmail.com</a> with the subject line: <code>Refund Request - [Your Order ID]</code>.</p>
                  <p><strong>Step 2:</strong> Mention the email address used during purchase and provide a brief description of the technical issue encountered.</p>
                  <p><strong>Step 3:</strong> Our support engineers will investigate and respond within <strong>24 hours</strong> with a resolution or prompt refund approval.</p>
                </div>
              </section>

              {/* Point 5 */}
              <section className="space-y-3 pt-4 border-t border-[#F1F5F9]">
                <h3 className="text-sm sm:text-base font-bold text-[#111827] flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#6D5DFB]/10 text-[#6D5DFB] text-xs font-mono font-bold">5</span>
                  Refund Settlement Timeline
                </h3>
                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                  Once a refund is approved by our support team, the credit is initiated immediately to your original payment method (Bank Account, UPI, or Credit/Debit Card). Depending on your banking institution, funds typically reflect in your statement within <strong>5 to 7 business days</strong>.
                </p>
              </section>

              {/* Free Setup Support Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#111827] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-[#22C55E] uppercase tracking-wider mb-1">
                    Free Setup Guidance
                  </div>
                  <div className="text-xs sm:text-sm text-slate-300">
                    Stuck with a formula or need help adapting a template for your workflow? We offer free setup assistance before you consider canceling.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('contact')}
                  className="px-4 py-2 bg-[#6D5DFB] hover:bg-[#5B4CE0] text-white text-xs font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer"
                >
                  Contact Support Desk
                </button>
              </div>
            </article>
          )}

        </div>

        {/* Bottom Support Callout Card */}
        <div className="mt-8 bg-white rounded-2xl border border-[#E2E8F0] p-6 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#64748B]">
            <HelpCircle className="w-4 h-4 text-[#6D5DFB]" />
            <span>Have Questions Regarding Our Policies?</span>
          </div>
          <p className="text-xs text-[#64748B]">
            Our support desk is ready to answer any inquiries regarding privacy, licensing, delivery, or template setup.
          </p>
          <div className="pt-2">
            <a
              href="mailto:contactonetaplink@gmail.com"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6D5DFB] hover:underline"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>contactonetaplink@gmail.com (Response within 24 hours)</span>
            </a>
          </div>
        </div>

      </div>
    </main>
  );
};
