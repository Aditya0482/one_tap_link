import React from 'react';
import { 
  FileSpreadsheet, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Clock, 
  Layers, 
  Award, 
  Users, 
  ArrowRight, 
  Star,
  FolderSync,
  HelpCircle,
  TrendingUp,
  Cpu,
  HeartHandshake
} from 'lucide-react';
import { OneTapLogo } from './OneTapLogo';

interface AboutPageProps {
  onNavigate: (view: any) => void;
  onBrowseTemplates: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  onNavigate,
  onBrowseTemplates
}) => {
  return (
    <main className="py-10 sm:py-16 bg-[#F8FAFC]">
      {/* 1. Hero Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#6D5DFB]/10 text-[#6D5DFB] text-xs font-bold mb-6 border border-[#6D5DFB]/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>The Story Behind OneTapLink</span>
        </div>

        <div className="max-w-4xl mx-auto text-justify">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#111827] tracking-tight leading-tight">
            We build <span className="text-[#6D5DFB]">smart Google templates</span> that turn messy workflows into effortless clarity.
          </h1>

          <p className="mt-5 text-base sm:text-lg text-[#64748B] leading-relaxed">
            OneTapLink was born out of a simple frustration: spending endless hours building, formatting, and debugging complex spreadsheets instead of focusing on actual growth, finance management, and execution.
          </p>
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
          <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0284C7] font-mono">Zero Setup</div>
            <div className="text-xs text-[#64748B] font-medium mt-1">Plug & Play Ready</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#22C55E] font-mono">100%</div>
            <div className="text-xs text-[#64748B] font-medium mt-1">Formula Automated</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#6D5DFB] font-mono">1-Click</div>
            <div className="text-xs text-[#64748B] font-medium mt-1">Google Drive Copy</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#F59E0B] font-mono">Lifetime</div>
            <div className="text-xs text-[#64748B] font-medium mt-1">Access & Free Updates</div>
          </div>
        </div>
      </section>

      {/* 2. Our Mission & Story */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-24">
        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-10 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-bold text-[#6D5DFB] uppercase tracking-wider">Our Mission</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
                Empowering high-performers with plug-and-play digital systems.
              </h2>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Whether you are managing personal wealth, freelancing finances, tracking sprints, or organizing project milestones, you shouldn’t have to learn advanced scripting or spend hours testing <code>=VLOOKUP</code> or <code>=QUERY</code> formulas.
              </p>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Every template in our catalog is engineered by professional spreadsheet architects and UX designers. We believe software should be fast, private, owned forever, and zero-subscription.
              </p>

              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#111827]">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />
                  <span>No SaaS subscriptions</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#111827]">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />
                  <span>Your data stays in your Drive</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#111827]">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />
                  <span>Works on Mobile & Desktop</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#111827]">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />
                  <span>Lifetime free updates</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center mx-auto p-1.5">
                <OneTapLogo className="w-full h-full" />
              </div>
              <h3 className="font-extrabold text-[#111827] text-lg">OneTapLink Studio</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Designed for founders, creators, freelancers, and operators who demand speed and beauty without complexity.
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#22C55E]/10 text-[#16A34A] text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Google Workspace Ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The 4 Engineering Pillars */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-[#6D5DFB] uppercase tracking-wider">Quality Standard</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight mt-1">
            Engineered with extreme precision.
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-2">
            We don't create basic tables. Every template undergoes rigorous testing across multiple browsers and screen sizes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-2xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-[#6D5DFB]/10 text-[#6D5DFB] flex items-center justify-center mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#111827]">Zero Math & Instant Automation</h3>
            <p className="text-xs text-[#64748B] leading-relaxed mt-2">
              All calculations, summary tables, KPI metrics, dynamic variances, and percentages update in real-time as soon as you enter your numbers.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-2xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center mb-4">
              <FolderSync className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#111827]">Instant Google Drive Integration</h3>
            <p className="text-xs text-[#64748B] leading-relaxed mt-2">
              After a fast checkout, click your personalized copy link to duplicate the master sheet directly into your own Google Drive in under 5 seconds.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-2xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/10 text-[#0284C7] flex items-center justify-center mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#111827]">Modern Executive Dashboards</h3>
            <p className="text-xs text-[#64748B] leading-relaxed mt-2">
              Say goodbye to dull grey grids. Enjoy dark & light aesthetic palettes, readable typography, and visual charts ready to present to stakeholders.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-2xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 text-[#D97706] flex items-center justify-center mb-4">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#111827]">100% Lifetime Ownership</h3>
            <p className="text-xs text-[#64748B] leading-relaxed mt-2">
              One simple one-time payment. No monthly charges, no recurring fees, and no lock-in. You own and control your copy forever.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Comparison Table */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-24">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold text-[#6D5DFB] uppercase tracking-wider">How We Compare</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight mt-1">
            Why choose OneTapLink templates?
          </h2>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-5">Features & Benefits</th>
                  <th className="py-4 px-5 text-[#6D5DFB] bg-[#6D5DFB]/5">OneTapLink Templates</th>
                  <th className="py-4 px-5">Building From Scratch</th>
                  <th className="py-4 px-5">SaaS Subscriptions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-[#111827]">
                <tr>
                  <td className="py-4 px-5 font-semibold">Setup Time</td>
                  <td className="py-4 px-5 font-bold text-[#6D5DFB] bg-[#6D5DFB]/5">Instant (1-Click Copy)</td>
                  <td className="py-4 px-5 text-[#64748B]">15–40+ Hours</td>
                  <td className="py-4 px-5 text-[#64748B]">Complex Onboarding</td>
                </tr>
                <tr>
                  <td className="py-4 px-5 font-semibold">Pricing Model</td>
                  <td className="py-4 px-5 font-bold text-[#6D5DFB] bg-[#6D5DFB]/5">One-Time Payment</td>
                  <td className="py-4 px-5 text-[#64748B]">Heavy Time Cost</td>
                  <td className="py-4 px-5 text-[#64748B]">Recurring Monthly Fees</td>
                </tr>
                <tr>
                  <td className="py-4 px-5 font-semibold">Data Privacy</td>
                  <td className="py-4 px-5 font-bold text-[#22C55E] bg-[#6D5DFB]/5">100% Private (Your Google Drive)</td>
                  <td className="py-4 px-5 text-[#64748B]">Private</td>
                  <td className="py-4 px-5 text-[#64748B]">Stored on Third-Party Servers</td>
                </tr>
                <tr>
                  <td className="py-4 px-5 font-semibold">Formula Automation</td>
                  <td className="py-4 px-5 font-bold text-[#22C55E] bg-[#6D5DFB]/5">Pre-built & Tested</td>
                  <td className="py-4 px-5 text-[#64748B]">Manual trial and error</td>
                  <td className="py-4 px-5 text-[#64748B]">Automated</td>
                </tr>
                <tr>
                  <td className="py-4 px-5 font-semibold">Ownership & Control</td>
                  <td className="py-4 px-5 font-bold text-[#22C55E] bg-[#6D5DFB]/5">100% Full Edit Rights (Owned Forever)</td>
                  <td className="py-4 px-5 text-[#64748B]">High DIY Maintenance</td>
                  <td className="py-4 px-5 text-[#64748B]">Data locked / Lost if canceled</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. Frequently Asked Questions */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-24">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold text-[#6D5DFB] uppercase tracking-wider">Knowledge Base</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight mt-1">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0]">
            <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#6D5DFB]" />
              Do I need a paid Google Workspace account?
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed mt-2 pl-6">
              No! All templates work seamlessly with any free personal <code>@gmail.com</code> account as well as commercial Google Workspace accounts.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0]">
            <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#6D5DFB]" />
              Can I customize the colors, categories, and currencies?
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed mt-2 pl-6">
              Yes, absolutely. Once you copy the sheet into your Google Drive, you have 100% editor rights. You can add rows, rename categories, adjust currency symbols, or customize colors freely.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0]">
            <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#6D5DFB]" />
              How do I get my template after checkout?
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed mt-2 pl-6">
              Immediately after completing payment, you are taken to a confirmation page with your unique "Copy Template" button. We also generate an instant order confirmation receipt with permanent access details.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Call to Action Banner */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-24">
        <div className="rounded-3xl bg-[#111827] text-white p-8 sm:p-12 text-center relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to upgrade your workflow?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Explore our curated library of Google Sheets templates, automated finance dashboards, and productivity systems.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={onBrowseTemplates}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-[#6D5DFB] hover:bg-[#5B4CE0] text-white transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Browse All Templates</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('contact')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/15 text-white transition-all border border-white/20 cursor-pointer"
              >
                <span>Contact Our Team</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
