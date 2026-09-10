import React, { useState } from 'react';
import { 
  Table, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  BarChart3,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { SpreadsheetMockData } from '../types';

interface SpreadsheetMockupProps {
  mockData?: SpreadsheetMockData;
  title?: string;
  onOpenPreview?: () => void;
  interactive?: boolean;
}

const DEFAULT_MOCK: SpreadsheetMockData = {
  sheetName: 'Master Budget & Wealth Dashboard 2026',
  tabs: ['📊 Dashboard', '💵 Monthly Budget', '💳 Expense Log', '📈 Net Worth', '🎯 Goals'],
  kpis: [
    { label: 'Total Income', value: '₹84,500.00', change: '+12.4%', isPositive: true, color: '#22C55E' },
    { label: 'Total Expenses', value: '₹38,200.00', change: '-4.2%', isPositive: true, color: '#6D5DFB' },
    { label: 'Net Savings', value: '₹46,300.00', change: '+18.1%', isPositive: true, color: '#22C55E' },
    { label: 'Savings Rate', value: '54.8%', change: 'Optimal', isPositive: true, color: '#38BDF8' }
  ],
  headers: ['Date', 'Category', 'Description', 'Planned', 'Actual', 'Variance', 'Status'],
  rows: [
    ['Sep 01', 'Housing', 'Monthly Rent / Mortgage', '₹15,000', '₹15,000', '₹0', 'Paid'],
    ['Sep 03', 'Consulting', 'Client Retainer Q3', '₹45,000', '₹45,000', '₹0', 'Received'],
    ['Sep 05', 'Groceries', 'Organic Produce & Market', '₹4,500', '₹4,100', '+₹400', 'Under Budget'],
    ['Sep 08', 'Software', 'Cloud & Productivity Tools', '₹1,200', '₹1,200', '₹0', 'Paid'],
    ['Sep 12', 'Investments', 'Index Funds & Equities', '₹20,000', '₹20,000', '₹0', 'Executed']
  ],
  chartType: 'donut',
  chartData: [
    { label: 'Housing', value: 39, color: '#6D5DFB' },
    { label: 'Investments', value: 35, color: '#22C55E' },
    { label: 'Living', value: 16, color: '#38BDF8' },
    { label: 'Savings', value: 10, color: '#F59E0B' }
  ]
};

export const SpreadsheetMockup: React.FC<SpreadsheetMockupProps> = ({
  mockData = DEFAULT_MOCK,
  title,
  onOpenPreview,
  interactive = true
}) => {
  const data = mockData || DEFAULT_MOCK;
  const [activeTab, setActiveTab] = useState(0);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>({ row: 0, col: 3 });

  return (
    <div className="w-full rounded-2xl bg-white border border-[#E2E8F0] shadow-[0_12px_36px_rgba(109,93,251,0.08)] overflow-hidden transition-all duration-200 hover:border-[#6D5DFB]/40">
      {/* 1. Google Sheets Window Bar */}
      <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Green Sheets Icon */}
          <div className="w-6 h-6 rounded bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center font-bold text-xs shrink-0">
            <Table className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-[#111827] truncate">
            {title || data.sheetName || 'Google Sheets Template'}
          </span>
          <span className="hidden sm:inline-flex text-[10px] font-semibold text-[#64748B] bg-white border border-[#E2E8F0] px-1.5 py-0.5 rounded">
            Auto-calculating
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-[#22C55E] font-medium bg-[#22C55E]/10 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
            <span>Ready in Drive</span>
          </div>
          {onOpenPreview && (
            <button
              type="button"
              onClick={onOpenPreview}
              className="text-[11px] font-semibold text-[#6D5DFB] hover:text-[#5B4CE0] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Expand</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Formula Bar */}
      <div className="bg-white border-b border-[#E2E8F0] px-3 py-1.5 flex items-center gap-2 text-xs font-mono text-[#64748B]">
        <span className="text-[11px] font-bold text-[#6D5DFB] bg-[#F8FAFC] px-1.5 py-0.5 rounded border border-[#E2E8F0]">
          fx
        </span>
        <span className="text-[11px] text-[#111827] font-medium truncate">
          =SUMIFS(Transactions!E:E, Transactions!B:B, &quot;Income&quot;)
        </span>
      </div>

      {/* 3. KPI Header Cards */}
      {data.kpis && data.kpis.length > 0 && (
        <div className="p-3.5 sm:p-4 bg-[#F8FAFC]/50 border-b border-[#E2E8F0] grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {data.kpis.map((kpi, idx) => (
            <div 
              key={idx}
              className="bg-white p-2.5 sm:p-3 rounded-xl border border-[#E2E8F0] shadow-2xs hover:border-[#6D5DFB]/30 transition-all"
            >
              <div className="text-[11px] font-medium text-[#64748B] truncate">{kpi.label}</div>
              <div className="text-base sm:text-lg font-extrabold text-[#111827] font-mono mt-0.5">
                {kpi.value}
              </div>
              {kpi.change && (
                <div className="flex items-center gap-1 mt-1 text-[10px] font-semibold text-[#22C55E]">
                  <TrendingUp className="w-3 h-3" />
                  <span>{kpi.change}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 4. Spreadsheet Data Table */}
      <div className="overflow-x-auto max-h-[220px] sm:max-h-[260px] bg-white">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <th className="py-2 px-2.5 text-center text-[#94A3B8] font-mono text-[10px] w-8 border-r border-[#E2E8F0]">#</th>
              {data.headers.map((h, i) => (
                <th 
                  key={i} 
                  className="py-2 px-3 text-[11px] font-bold text-[#64748B] border-r border-[#E2E8F0] uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((rowItem, rIdx) => {
              const rowCells = Array.isArray(rowItem) 
                ? rowItem 
                : (rowItem as any)?.cells || (rowItem as any)?.values || [];
              return (
                <tr 
                  key={rIdx} 
                  className={`border-b border-[#F1F5F9] transition-colors ${
                    rIdx % 2 === 0 ? 'bg-white' : 'bg-[#FAFBFC]'
                  } hover:bg-[#F5F3FF]`}
                >
                  <td className="py-2 px-2 text-center text-[#94A3B8] font-mono text-[10px] bg-[#F8FAFC] border-r border-[#E2E8F0]">
                    {rIdx + 1}
                  </td>
                  {rowCells.map((cell: any, cIdx: number) => {
                    const isSelected = selectedCell?.row === rIdx && selectedCell?.col === cIdx;
                    return (
                      <td
                        key={cIdx}
                        onClick={() => interactive && setSelectedCell({ row: rIdx, col: cIdx })}
                        className={`py-2 px-3 text-[#111827] whitespace-nowrap border-r border-[#F1F5F9] cursor-pointer transition-all ${
                          isSelected ? 'bg-[#6D5DFB]/10 ring-1 ring-[#6D5DFB] font-medium' : ''
                        } ${typeof cell === 'string' && (cell.startsWith('$') || cell.endsWith('%')) ? 'font-mono' : ''}`}
                      >
                        {typeof cell === 'string' && (cell === 'Paid' || cell === 'Received' || cell === 'Executed') ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#22C55E]/10 text-[#22C55E]">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            {cell}
                          </span>
                        ) : (
                          cell
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 5. Bottom Tabs Bar */}
      <div className="bg-[#F8FAFC] border-t border-[#E2E8F0] px-3 py-1.5 flex items-center gap-1 overflow-x-auto">
        {(data.tabs || ['📊 Dashboard', '💵 Sheet 1']).map((tab, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveTab(idx)}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeTab === idx
                ? 'bg-white text-[#111827] font-bold shadow-2xs border border-[#E2E8F0]'
                : 'text-[#64748B] hover:text-[#111827] hover:bg-white/60'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
};
