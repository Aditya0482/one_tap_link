import React, { useState } from 'react';
import { 
  Mail, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Send, 
  HelpCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';
import { ErrorAlert } from './ErrorAlert';
import { validateName, validateEmail, validateMessage, validateRequired } from '../utils/validators';

interface ContactPageProps {
  onNavigate: (view: any) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    orderId: '',
    category: '', // Compulsory: empty by default so user deliberately chooses
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Field validation states
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateContactField = (field: string, val?: string) => {
    let err = '';
    if (field === 'name') err = validateName(val !== undefined ? val : formData.name);
    else if (field === 'email') err = validateEmail(val !== undefined ? val : formData.email);
    else if (field === 'category') err = validateRequired(val !== undefined ? val : formData.category, 'Inquiry category');
    else if (field === 'message') err = validateMessage(val !== undefined ? val : formData.message, 10, 2000);
    setFieldErrors(prev => ({ ...prev, [field]: err }));
    return err;
  };

  const handleContactBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateContactField(field);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const nameErr = validateName(formData.name);
    const emailErr = validateEmail(formData.email);
    const categoryErr = validateRequired(formData.category, 'Inquiry category');
    const messageErr = validateMessage(formData.message, 10, 2000);

    const errors: Record<string, string> = {};
    if (nameErr) errors.name = nameErr;
    if (emailErr) errors.email = emailErr;
    if (categoryErr) errors.category = categoryErr;
    if (messageErr) errors.message = messageErr;

    setTouched({ name: true, email: true, category: true, message: true });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await api.submitContact({
        name: formData.name,
        email: formData.email,
        category: formData.category,
        orderId: formData.orderId,
        subject: formData.subject,
        message: formData.message
      });

      setSubmitted(true);
    } catch (err: any) {
      console.error('Contact submission error:', err);
      setSubmitError(
        err?.message || 'Unable to submit your message at this time. Please email us directly at contactonetaplink@gmail.com'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      orderId: '',
      category: '',
      subject: '',
      message: ''
    });
    setFieldErrors({});
    setSubmitError(null);
    setSubmitted(false);
  };

  return (
    <main className="py-10 sm:py-16 bg-[#F8FAFC]">
      {/* 1. Header */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#6D5DFB]/10 text-[#6D5DFB] text-xs font-bold mb-4 border border-[#6D5DFB]/20">
          <Mail className="w-3.5 h-3.5" />
          <span>Customer Support & Inquiries</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#111827] tracking-tight">
          How can we help you today?
        </h1>

        <p className="mt-4 text-sm sm:text-base text-[#64748B] max-w-2xl mx-auto leading-relaxed">
          Have a question about a template, need help customizing your Google Sheet, or inquiring about an order? Our support engineers are here to help.
        </p>
      </section>

      {/* 2. Main Contact Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Direct Support Channels & Info */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-6">
              <h2 className="text-lg font-extrabold text-[#111827]">
                Direct Contact Channels
              </h2>

              <div className="space-y-4 text-xs">
                {/* Email Support Card */}
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-[#6D5DFB]/10 text-[#6D5DFB] flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-[#111827] block text-xs">Email Help Desk</span>
                    <a 
                      href="mailto:contactonetaplink@gmail.com" 
                      className="font-mono text-xs text-[#6D5DFB] hover:underline font-bold block mt-0.5"
                    >
                      contactonetaplink@gmail.com
                    </a>
                    <span className="text-[11px] text-[#64748B] block mt-1">Average response time: Within 24 hours</span>
                  </div>
                </div>

                {/* Instant Digital Delivery */}
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-[#111827] block text-xs">Template Access Support</span>
                    <span className="text-[11px] text-[#64748B] block mt-0.5">
                      Lost your copy link? Simply provide your checkout email and we will re-issue access immediately.
                    </span>
                  </div>
                </div>

                {/* Response SLA */}
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-[#38BDF8]/10 text-[#0284C7] flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-[#111827] block text-xs">Support Hours</span>
                    <span className="text-[11px] text-[#64748B] block mt-0.5">
                      Monday to Saturday • 9:00 AM – 8:00 PM IST
                    </span>
                    <span className="text-[10px] text-[#22C55E] font-bold block mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                      Priority Support Active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dedicated Support Guarantee Card */}
            <div className="bg-[#111827] text-white rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-[#22C55E]">
                <ShieldCheck className="w-5 h-5" />
                <span className="font-bold text-xs uppercase tracking-wider">100% Satisfaction & Setup Assistance</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                We ensure every template works effortlessly for your workflow. If you need assistance setting up your Google Sheet, custom adjustments, or formula guidance, our support team will guide you step-by-step.
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Contact Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs">
              {submitted ? (
                <div className="py-8 text-center space-y-4 animate-in fade-in duration-300">
                  <div className="w-14 h-14 rounded-full bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-[#111827]">
                    Message Received!
                  </h3>
                  
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#15803D] text-xs font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Logged in Support Queue</span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto leading-relaxed">
                    Thank you for reaching out! We have received your message regarding <strong className="text-[#111827]">{formData.category}</strong>. Our team will review your inquiry and reply to <strong className="text-[#111827]">{formData.email}</strong> within 24 hours.
                  </p>
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#6D5DFB] hover:bg-[#5B4CE0] text-white transition-all cursor-pointer shadow-xs"
                    >
                      Send Another Message
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <h2 className="text-lg font-extrabold text-[#111827]">
                        Send Us a Message
                      </h2>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        Fill out the form below. Inquiries are automatically processed and forwarded to our support Google Sheet.
                      </p>
                    </div>

                    {submitError && (
                      <ErrorAlert
                        title="Submission Notice"
                        message={submitError}
                        onDismiss={() => setSubmitError(null)}
                      />
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-[#111827] mb-1">
                          Your Full Name <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => {
                            setFormData({ ...formData, name: e.target.value });
                            if (touched.name) validateContactField('name', e.target.value);
                          }}
                          onBlur={() => handleContactBlur('name')}
                          placeholder="e.g. Rahul Sharma"
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition-all ${
                            touched.name && fieldErrors.name
                              ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/40 text-[#111827]'
                              : 'border-[#E2E8F0] focus:ring-2 focus:ring-[#6D5DFB] bg-[#F8FAFC]'
                          }`}
                        />
                        {touched.name && fieldErrors.name && (
                          <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {fieldErrors.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#111827] mb-1">
                          Email Address <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => {
                            setFormData({ ...formData, email: e.target.value });
                            if (touched.email) validateContactField('email', e.target.value);
                          }}
                          onBlur={() => handleContactBlur('email')}
                          placeholder="e.g. rahul@example.com"
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition-all ${
                            touched.email && fieldErrors.email
                              ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/40 text-[#111827]'
                              : 'border-[#E2E8F0] focus:ring-2 focus:ring-[#6D5DFB] bg-[#F8FAFC]'
                          }`}
                        />
                        {touched.email && fieldErrors.email && (
                          <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {fieldErrors.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Inquiry Category */}
                      <div>
                        <label className="block text-xs font-semibold text-[#111827] mb-1">
                          Inquiry Category <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => {
                            setFormData({ ...formData, category: e.target.value });
                            if (touched.category) validateContactField('category', e.target.value);
                          }}
                          onBlur={() => handleContactBlur('category')}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition-all cursor-pointer ${
                            touched.category && fieldErrors.category
                              ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/40 text-[#111827]'
                              : 'border-[#E2E8F0] focus:ring-2 focus:ring-[#6D5DFB] bg-[#F8FAFC]'
                          }`}
                        >
                          <option value="" disabled>-- Select Inquiry Category * --</option>
                          <option value="General Support">General Support</option>
                          <option value="Template Access / Copy Help">Template Access / Copy Help</option>
                          <option value="Custom Spreadsheet Request">Custom Spreadsheet Request</option>
                          <option value="Billing & Refund">Billing & Refund</option>
                          <option value="Business Partnership">Business Partnership</option>
                          <option value="Feature Suggestion">Feature Suggestion</option>
                        </select>
                        {touched.category && fieldErrors.category && (
                          <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {fieldErrors.category}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#111827] mb-1">
                          Order ID (Optional)
                        </label>
                        <input
                          type="text"
                          value={formData.orderId}
                          onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                          placeholder="e.g. ORD-8392"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#6D5DFB] bg-[#F8FAFC]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#111827] mb-1">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Brief summary of your inquiry"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-xs focus:outline-none focus:ring-2 focus:ring-[#6D5DFB] bg-[#F8FAFC]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#111827] mb-1">
                        Detailed Message <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <textarea
                        rows={5}
                        value={formData.message}
                        onChange={(e) => {
                          setFormData({ ...formData, message: e.target.value });
                          if (touched.message) validateContactField('message', e.target.value);
                        }}
                        onBlur={() => handleContactBlur('message')}
                        placeholder="Please describe your question or requirement in detail (minimum 10 characters)..."
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition-all resize-none ${
                          touched.message && fieldErrors.message
                            ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/40 text-[#111827]'
                            : 'border-[#E2E8F0] focus:ring-2 focus:ring-[#6D5DFB] bg-[#F8FAFC]'
                        }`}
                      />
                      {touched.message && fieldErrors.message && (
                        <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {fieldErrors.message}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-6 rounded-xl font-bold text-xs sm:text-sm bg-[#6D5DFB] hover:bg-[#5B4CE0] text-white shadow-[0_4px_16px_rgba(109,93,251,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Send Message</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send Message</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Quick Self-Help FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-24">
        <div className="text-center mb-8">
          <span className="text-xs font-bold text-[#6D5DFB] uppercase tracking-wider">Quick Answers</span>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight mt-1">
            Common Support Questions
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] space-y-1.5">
            <h3 className="font-bold text-[#111827] flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-[#6D5DFB]" />
              I did not receive my copy link
            </h3>
            <p className="text-[#64748B] leading-relaxed">
              Check your spam or promotions folder for an email from OneTapLink. You can also write to support with your payment email and we will send a direct duplicate link within minutes.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] space-y-1.5">
            <h3 className="font-bold text-[#111827] flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-[#6D5DFB]" />
              Can I use the template in Microsoft Excel?
            </h3>
            <p className="text-[#64748B] leading-relaxed">
              Our templates are optimized natively for Google Sheets. You can download them as <code>.xlsx</code> via File → Download in Google Drive, though visual styles look best in Google Sheets.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] space-y-1.5">
            <h3 className="font-bold text-[#111827] flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-[#6D5DFB]" />
              What if I accidentally delete a formula?
            </h3>
            <p className="text-[#64748B] leading-relaxed">
              You have permanent access to your template source link. You can create a fresh new copy at any time from your original access link without paying again.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] space-y-1.5">
            <h3 className="font-bold text-[#111827] flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-[#6D5DFB]" />
              How do I request a custom template?
            </h3>
            <p className="text-[#64748B] leading-relaxed">
              Choose "Custom Spreadsheet Request" in the form above and describe your business requirements. Our spreadsheet designers build custom automated systems.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};
