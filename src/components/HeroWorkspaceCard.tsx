import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  CheckCircle2, 
  TrendingUp, 
  Sparkles, 
  Zap, 
  Layers, 
  Copy, 
  FolderSync,
  PieChart,
  DollarSign
} from 'lucide-react';
import { OneTapLogo } from './OneTapLogo';

interface HeroWorkspaceCardProps {
  onBrowseTemplates: () => void;
}

export const HeroWorkspaceCard: React.FC<HeroWorkspaceCardProps> = ({
  onBrowseTemplates
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<'finance' | 'project' | 'invoice'>('finance');
  const [copiedState, setCopiedState] = useState(false);

  const handleCopyDemo = () => {
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  return (
    <div className="relative w-full max-w-full overflow-hidden">
      {/* Background glow matching brand theme */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#6D5DFB]/15 via-[#38BDF8]/10 to-[#22C55E]/10 rounded-2xl blur-xl opacity-80 pointer-events-none" />

      {/* Main Container Card */}
      <div className="relative rounded-2xl bg-white border border-[#E2E8F0] shadow-[0_16px_40px_rgba(109,93,251,0.08)] overflow-hidden transition-all duration-200">
        {/* Top Header Bar */}
        <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center text-[#22C55E]">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-[#111827]">Google Workspace Template</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#22C55E]/15 text-[#16A34A]">
                  LIVE READY
                </span>
              </div>
              <p className="text-[10px] text-[#64748B]">Auto-syncs directly to your Google Drive</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="text-[11px] font-semibold text-[#16A34A] hidden sm:inline">1-Click Copy</span>
          </div>
        </div>

        {/* Template Selector Tabs */}
        <div className="px-4 pt-3 pb-2 bg-white border-b border-[#F1F5F9] flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedTemplate('finance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              selectedTemplate === 'finance'
                ? 'bg-[#6D5DFB] text-white shadow-xs'
                : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#111827]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Wealth & Budget</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTemplate('project')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              selectedTemplate === 'project'
                ? 'bg-[#6D5DFB] text-white shadow-xs'
                : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#111827]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Project Tracker</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTemplate('invoice')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              selectedTemplate === 'invoice'
                ? 'bg-[#6D5DFB] text-white shadow-xs'
                : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#111827]'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Client Invoices</span>
          </button>
        </div>

        {/* Dynamic Template Content */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Quick Metrics in INR */}
          {selectedTemplate === 'finance' && (
            <>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="p-2.5 sm:p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] font-medium block">Monthly Income</span>
                  <span className="text-sm sm:text-base font-extrabold text-[#111827] font-mono">₹84,500</span>
                  <span className="text-[10px] font-bold text-[#22C55E] flex items-center gap-0.5 mt-0.5">
                    <TrendingUp className="w-2.5 h-2.5" /> +12.4%
                  </span>
                </div>

                <div className="p-2.5 sm:p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] font-medium block">Total Expenses</span>
                  <span className="text-sm sm:text-base font-extrabold text-[#111827] font-mono">₹38,200</span>
                  <span className="text-[10px] font-bold text-[#6D5DFB] mt-0.5 block">Budgeted</span>
                </div>

                <div className="p-2.5 sm:p-3 rounded-xl bg-[#22C55E]/5 border border-[#22C55E]/20">
                  <span className="text-[10px] text-[#16A34A] font-medium block">Net Savings</span>
                  <span className="text-sm sm:text-base font-extrabold text-[#16A34A] font-mono">₹46,300</span>
                  <span className="text-[10px] font-bold text-[#16A34A] mt-0.5 block">54.8% Rate</span>
                </div>
              </div>

              {/* Data Table Preview */}
              <div className="rounded-xl border border-[#E2E8F0] overflow-x-auto bg-white text-xs scrollbar-none w-full max-w-full">
                <div className="w-full min-w-[260px]">
                  <div className="grid grid-cols-4 bg-[#F8FAFC] py-1.5 px-3 font-semibold text-[#64748B] border-b border-[#E2E8F0] text-[11px]">
                    <span>Category</span>
                    <span>Planned</span>
                    <span>Actual</span>
                    <span className="text-right">Status</span>
                  </div>
                  <div className="divide-y divide-[#F1F5F9] font-mono text-[11px]">
                    <div className="grid grid-cols-4 py-2 px-3 items-center">
                      <span className="font-sans font-medium text-[#111827] truncate pr-1">Consulting</span>
                      <span className="text-[#64748B]">₹45,000</span>
                      <span className="font-bold text-[#111827]">₹45,000</span>
                      <span className="text-right text-[10px] font-bold text-[#22C55E] font-sans">Received</span>
                    </div>
                    <div className="grid grid-cols-4 py-2 px-3 items-center">
                      <span className="font-sans font-medium text-[#111827] truncate pr-1">Housing</span>
                      <span className="text-[#64748B]">₹15,000</span>
                      <span className="font-bold text-[#111827]">₹15,000</span>
                      <span className="text-right text-[10px] font-bold text-[#64748B] font-sans">Paid</span>
                    </div>
                    <div className="grid grid-cols-4 py-2 px-3 items-center">
                      <span className="font-sans font-medium text-[#111827] truncate pr-1">SIP Invest</span>
                      <span className="text-[#64748B]">₹20,000</span>
                      <span className="font-bold text-[#6D5DFB]">₹20,000</span>
                      <span className="text-right text-[10px] font-bold text-[#6D5DFB] font-sans">Done</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {selectedTemplate === 'project' && (
            <>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="p-2.5 sm:p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] font-medium block">Total Tasks</span>
                  <span className="text-sm sm:text-base font-extrabold text-[#111827]">48 Tasks</span>
                  <span className="text-[10px] font-bold text-[#22C55E] mt-0.5 block">100% Tracked</span>
                </div>
                <div className="p-2.5 sm:p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] font-medium block">In Progress</span>
                  <span className="text-sm sm:text-base font-extrabold text-[#6D5DFB]">8 Active</span>
                  <span className="text-[10px] font-bold text-[#6D5DFB] mt-0.5 block">Sprint Q3</span>
                </div>
                <div className="p-2.5 sm:p-3 rounded-xl bg-[#22C55E]/5 border border-[#22C55E]/20">
                  <span className="text-[10px] text-[#16A34A] font-medium block">Completed</span>
                  <span className="text-sm sm:text-base font-extrabold text-[#16A34A]">40 Done</span>
                  <span className="text-[10px] font-bold text-[#16A34A] mt-0.5 block">83% Velocity</span>
                </div>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] overflow-x-auto bg-white text-xs scrollbar-none w-full max-w-full">
                <div className="w-full min-w-[260px]">
                  <div className="grid grid-cols-4 bg-[#F8FAFC] py-1.5 px-3 font-semibold text-[#64748B] border-b border-[#E2E8F0] text-[11px]">
                    <span>Deliverable</span>
                    <span>Owner</span>
                    <span>Priority</span>
                    <span className="text-right">Status</span>
                  </div>
                  <div className="divide-y divide-[#F1F5F9] text-[11px]">
                    <div className="grid grid-cols-4 py-2 px-3 items-center">
                      <span className="font-medium text-[#111827] truncate pr-1">Onboarding Flow</span>
                      <span className="text-[#64748B]">Alex M.</span>
                      <span className="text-[10px] font-bold text-[#EF4444]">High</span>
                      <span className="text-right text-[10px] font-bold text-[#22C55E]">Done</span>
                    </div>
                    <div className="grid grid-cols-4 py-2 px-3 items-center">
                      <span className="font-medium text-[#111827] truncate pr-1">Q3 Dashboard</span>
                      <span className="text-[#64748B]">Sarah K.</span>
                      <span className="text-[10px] font-bold text-[#6D5DFB]">Med</span>
                      <span className="text-right text-[10px] font-bold text-[#6D5DFB]">Review</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {selectedTemplate === 'invoice' && (
            <>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="p-2.5 sm:p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] font-medium block">Total Billed</span>
                  <span className="text-sm sm:text-base font-extrabold text-[#111827] font-mono">₹1,24,000</span>
                  <span className="text-[10px] font-bold text-[#22C55E] mt-0.5 block">This Month</span>
                </div>
                <div className="p-2.5 sm:p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] font-medium block">Pending</span>
                  <span className="text-sm sm:text-base font-extrabold text-[#F59E0B] font-mono">₹18,500</span>
                  <span className="text-[10px] font-bold text-[#F59E0B] mt-0.5 block">Due in 5d</span>
                </div>
                <div className="p-2.5 sm:p-3 rounded-xl bg-[#22C55E]/5 border border-[#22C55E]/20">
                  <span className="text-[10px] text-[#16A34A] font-medium block">Paid Out</span>
                  <span className="text-sm sm:text-base font-extrabold text-[#16A34A] font-mono">₹1,05,500</span>
                  <span className="text-[10px] font-bold text-[#16A34A] mt-0.5 block">Cleared</span>
                </div>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] overflow-x-auto bg-white text-xs scrollbar-none w-full max-w-full">
                <div className="w-full min-w-[260px]">
                  <div className="grid grid-cols-4 bg-[#F8FAFC] py-1.5 px-3 font-semibold text-[#64748B] border-b border-[#E2E8F0] text-[11px]">
                    <span>Invoice ID</span>
                    <span>Client</span>
                    <span>Amount</span>
                    <span className="text-right">Status</span>
                  </div>
                  <div className="divide-y divide-[#F1F5F9] text-[11px] font-mono">
                    <div className="grid grid-cols-4 py-2 px-3 items-center">
                      <span className="text-[#6D5DFB] font-bold truncate pr-1">#INV-08</span>
                      <span className="font-sans text-[#111827] truncate pr-1">Vertex</span>
                      <span className="font-bold text-[#111827]">₹45,000</span>
                      <span className="text-right text-[10px] font-bold text-[#22C55E] font-sans">Paid</span>
                    </div>
                    <div className="grid grid-cols-4 py-2 px-3 items-center">
                      <span className="text-[#6D5DFB] font-bold truncate pr-1">#INV-09</span>
                      <span className="font-sans text-[#111827] truncate pr-1">Apex</span>
                      <span className="font-bold text-[#111827]">₹18,500</span>
                      <span className="text-right text-[10px] font-bold text-[#F59E0B] font-sans">Wait</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Action Footer matching the Left side */}
          <div className="pt-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[#64748B]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>Formulas & automations pre-configured</span>
            </div>

            <button
              type="button"
              onClick={onBrowseTemplates}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#6D5DFB]/10 hover:bg-[#6D5DFB]/20 text-[#6D5DFB] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>View All Templates</span>
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
