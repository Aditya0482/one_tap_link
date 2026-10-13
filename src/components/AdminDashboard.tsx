import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  Layers, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  LogOut, 
  ArrowLeft,
  TrendingUp,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Table,
  Package,
  AlertTriangle
} from 'lucide-react';
import { OneTapLogo } from './OneTapLogo';
import { 
  Template, 
  Order, 
  AdminDashboardStats, 
  TemplateStatus, 
  PaymentStatus, 
  AccessStatus,
  ContactMessage 
} from '../types';
import { api } from '../services/api';
import { TemplateFormModal } from './TemplateFormModal';
import { OrderDetailModal } from './OrderDetailModal';
import { ErrorAlert } from './ErrorAlert';

interface AdminDashboardProps {
  token: string;
  adminEmail: string;
  onLogout: () => void;
  onBackToStore: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  token,
  adminEmail,
  onLogout,
  onBackToStore
}) => {
  const [activeTab, setActiveTabState] = useState<'dashboard' | 'templates' | 'orders' | 'messages'>(() => {
    try {
      const saved = localStorage.getItem('onetap_admin_active_tab');
      if (saved === 'templates' || saved === 'orders' || saved === 'messages' || saved === 'dashboard') {
        return saved;
      }
    } catch {}
    return 'dashboard';
  });

  const setActiveTab = (tab: 'dashboard' | 'templates' | 'orders' | 'messages') => {
    setActiveTabState(tab);
    try {
      localStorage.setItem('onetap_admin_active_tab', tab);
    } catch {}
  };
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isClearingData, setIsClearingData] = useState(false);
  const [confirmDeleteOrderId, setConfirmDeleteOrderId] = useState<string | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [orderActionFeedback, setOrderActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [templateFeedback, setTemplateFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false);
  const [confirmDeleteTemplateId, setConfirmDeleteTemplateId] = useState<string | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [confirmClearData, setConfirmClearData] = useState(false);

  const loadData = async (keepSpinning = false) => {
    try {
      if (!keepSpinning) setIsRefreshing(true);
      const [fetchedStats, fetchedTemplates, fetchedOrders, fetchedMessages] = await Promise.all([
        api.adminGetStats(token),
        api.adminGetTemplates(token),
        api.adminGetOrders(token),
        api.adminGetMessages(token).catch(() => [])
      ]);

      // Deduplicate templates by ID and Slug
      const templateMap = new Map<string, Template>();
      const slugMap = new Map<string, string>();
      fetchedTemplates.forEach(t => {
        if (!t || !t.id) return;
        const normalizedSlug = (t.slug || '').trim().toLowerCase();
        if (normalizedSlug && slugMap.has(normalizedSlug)) {
          return;
        }
        templateMap.set(t.id, t);
        if (normalizedSlug) slugMap.set(normalizedSlug, t.id);
      });

      setStats(fetchedStats);
      setTemplates(Array.from(templateMap.values()));
      setOrders(fetchedOrders);
      setMessages(fetchedMessages);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
      if (!keepSpinning) {
        setIsRefreshing(false);
      }
    }
  };

  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    const minSpinPromise = new Promise(resolve => setTimeout(resolve, 4000));
    try {
      await Promise.all([loadData(true), minSpinPromise]);
    } catch (err) {
      console.error('Refresh error:', err);
      await minSpinPromise;
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    setDeletingMessageId(id);
    setDeleteError(null);
    setMessages(prev => prev.filter(m => m.id !== id));
    setConfirmDeleteId(null);
    try {
      await api.adminDeleteMessage(token, id);
      await loadData(true);
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete inquiry');
      await loadData(true);
    } finally {
      setDeletingMessageId(null);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Template Actions
  const handleSaveTemplate = async (templateData: Partial<Template>, status: TemplateStatus) => {
    if (editingTemplate) {
      await api.adminUpdateTemplate(token, editingTemplate.id, { ...templateData, status });
    } else {
      await api.adminCreateTemplate(token, { ...templateData, status });
    }
    await loadData(true);
  };

  const handleTogglePublish = async (template: Template) => {
    const nextStatus: TemplateStatus = template.status === 'Published' ? 'Draft' : 'Published';
    await api.adminUpdateTemplate(token, template.id, { status: nextStatus });
    await loadData(true);
  };

  const handleCleanupDuplicates = async () => {
    setIsCleaningDuplicates(true);
    setTemplateFeedback(null);
    try {
      const res = await api.adminCleanupTemplateDuplicates(token);
      if (res && res.templates && Array.isArray(res.templates)) {
        setTemplates(res.templates);
      }
      await loadData(true);
      setTemplateFeedback({ type: 'success', message: 'All duplicate templates cleaned up successfully!' });
      setTimeout(() => setTemplateFeedback(null), 4000);
    } catch (err: any) {
      setTemplateFeedback({ type: 'error', message: err?.message || 'Failed to clean duplicate templates' });
    } finally {
      setIsCleaningDuplicates(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      setDeletingTemplateId(id);
      setTemplateFeedback(null);
      const targetTemplate = templates.find(t => t.id === id);
      const targetSlug = targetTemplate?.slug;
      const targetTitle = targetTemplate?.title;

      setTemplates(prev => prev.filter(t => t.id !== id));
      setConfirmDeleteTemplateId(null);

      await api.adminDeleteTemplate(token, id, targetSlug, targetTitle);

      setTemplateFeedback({ 
        type: 'success', 
        message: `Template "${targetTitle || 'Item'}" deleted successfully!` 
      });
      setTimeout(() => setTemplateFeedback(null), 4000);
      await loadData(true);
    } catch (err: any) {
      console.error('Failed to delete template:', err);
      setTemplateFeedback({ type: 'error', message: err?.message || 'Failed to delete template' });
      await loadData(true);
    } finally {
      setDeletingTemplateId(null);
    }
  };

  // Order Actions
  const handleUpdateOrderStatus = async (
    orderId: string, 
    paymentStatus: PaymentStatus, 
    accessStatus?: AccessStatus
  ) => {
    const updated = await api.adminUpdateOrderStatus(token, orderId, paymentStatus, accessStatus);
    setSelectedOrder(updated);
    await loadData(true);
  };

  const handleClearTestData = async () => {
    try {
      setIsClearingData(true);
      setOrders([]);
      setMessages([]);
      await api.adminClearTestData(token);
      setConfirmClearData(false);
      setOrderActionFeedback({ type: 'success', message: 'All test orders and inquiries reset to zero.' });
      setTimeout(() => setOrderActionFeedback(null), 4000);
      await loadData(true);
    } catch (err: any) {
      setOrderActionFeedback({ type: 'error', message: err?.message || 'Failed to reset test data' });
    } finally {
      setIsClearingData(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      setDeletingOrderId(orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
      setConfirmDeleteOrderId(null);

      await api.adminDeleteOrder(token, orderId);

      setOrderActionFeedback({ type: 'success', message: 'Order deleted successfully.' });
      setTimeout(() => setOrderActionFeedback(null), 4000);
      await loadData(true);
    } catch (err: any) {
      console.error('Failed to delete order:', err);
      setOrderActionFeedback({ type: 'error', message: err?.message || 'Failed to delete order' });
      setTimeout(() => setOrderActionFeedback(null), 5000);
      await loadData(true);
    } finally {
      setDeletingOrderId(null);
    }
  };

  return (
    <div id="admin-dashboard" className="min-h-screen bg-[#F8FAFC] w-full max-w-full overflow-x-hidden">
      {/* Admin Top Navigation Bar */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-30 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              type="button"
              onClick={onBackToStore}
              className="inline-flex items-center gap-1 sm:gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#111827] px-2 sm:px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Storefront</span>
              <span className="sm:hidden">Store</span>
            </button>

            <div className="h-4 w-px bg-[#E2E8F0] shrink-0" />

            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg border border-[#E2E8F0] bg-white p-0.5 flex items-center justify-center shadow-2xs shrink-0">
                <OneTapLogo className="w-full h-full" />
              </div>
              <span className="font-extrabold text-xs sm:text-base text-[#111827] truncate">
                OneTap<span className="text-[#6D5DFB]">Link</span> <span className="text-[10px] sm:text-xs font-semibold text-[#64748B] ml-0.5 sm:ml-1">Admin</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden sm:flex flex-col text-right text-xs">
              <span className="font-bold text-[#111827]">{adminEmail}</span>
              <span className="text-[10px] text-[#22C55E] font-medium">Active Session</span>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="p-2 rounded-xl text-[#64748B] hover:text-rose-600 hover:bg-rose-50 border border-[#E2E8F0] transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full overflow-x-hidden">
        {/* Navigation Tabs & Primary Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="w-full sm:w-auto overflow-x-auto pb-2 scrollbar-none flex items-center justify-center sm:justify-start">
            <div className="inline-flex items-center gap-1 sm:gap-2 bg-white p-1 rounded-2xl border border-[#E2E8F0] shadow-2xs shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-[#111827] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#111827]'
                }`}
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('templates')}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'templates'
                    ? 'bg-[#111827] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#111827]'
                }`}
              >
                <span>Templates</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/20">
                  {templates.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'orders'
                    ? 'bg-[#111827] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#111827]'
                }`}
              >
                <span>Orders</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/20">
                  {orders.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('messages')}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'messages'
                    ? 'bg-[#111827] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#111827]'
                }`}
              >
                <span>Inquiries</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/20">
                  {messages.length}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            <button
              id="admin-refresh-btn"
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#6D5DFB]/40 text-[#111827] hover:bg-[#F8FAFC] shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-75 disabled:pointer-events-none"
              title="Refresh Data"
              aria-label="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 text-[#6D5DFB] ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="text-xs sm:text-sm font-bold">Refresh</span>
            </button>
          </div>
        </div>

        {/* 1. DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 w-full">
            {/* 4 Summary Cards (Section 11) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 w-full min-w-0">
              {/* Total Sales */}
              <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                    Total Sales
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#111827] font-mono mt-3">
                  ₹{stats?.total_sales ?? 0}
                </div>
                <div className="text-[11px] text-[#22C55E] font-medium mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>Verified successful payments</span>
                </div>
              </div>

              {/* Total Orders */}
              <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                    Total Orders
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[#6D5DFB]/10 text-[#6D5DFB] flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#111827] font-mono mt-3">
                  {stats?.total_orders ?? 0}
                </div>
                <div className="text-[11px] text-[#64748B] mt-1">
                  Completed customer checkouts
                </div>
              </div>

              {/* Total Templates */}
              <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                    Total Templates
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#111827] font-mono mt-3">
                  {stats?.total_templates ?? 0}
                </div>
                <div className="text-[11px] text-[#64748B] mt-1">
                  {stats?.published_templates ?? 0} published live
                </div>
              </div>

              {/* Store Status */}
              <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                    Store Status
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#22C55E] flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-base font-extrabold text-[#111827] mt-3">
                  Online & Accepting
                </div>
                <div className="text-[11px] text-[#22C55E] font-medium mt-1">
                  Automated delivery active
                </div>
              </div>
            </div>

            {/* Recent Orders Section */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#111827]">
                    Recent Orders
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Latest digital template purchases
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-bold text-[#6D5DFB] hover:text-[#5B4CE0] cursor-pointer"
                >
                  View All Orders
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#64748B]">
                  No orders placed yet. As customers buy templates, their orders will appear here immediately.
                </div>
              ) : (
                <>
                  {/* Mobile Cards */}
                  <div className="block md:hidden divide-y divide-[#F1F5F9]">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-[#111827]">{order.id}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            order.payment_status === 'Paid'
                              ? 'bg-[#22C55E]/10 text-[#22C55E]'
                              : 'bg-amber-50 text-amber-600'
                          }`}>
                            {order.payment_status}
                          </span>
                        </div>
                        <div>
                          <div className="font-bold text-xs text-[#111827]">{order.template_title || 'Digital Template'}</div>
                          <div className="text-[11px] text-[#64748B]">{order.customer_name} • {order.customer_email}</div>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="font-mono font-bold text-sm text-[#111827]">₹{order.amount}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="px-3 py-1 rounded-lg text-xs font-bold text-[#6D5DFB] bg-[#6D5DFB]/10 hover:bg-[#6D5DFB]/20 cursor-pointer"
                          >
                            View Detail
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                          <th className="py-3 px-4">Order ID</th>
                          <th className="py-3 px-4">Customer</th>
                          <th className="py-3 px-4">Template</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Payment Status</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 5).map((order) => (
                          <tr key={order.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]">
                            <td className="py-3 px-4 font-mono font-bold text-[#111827]">
                              {order.id}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-[#111827]">{order.customer_name}</div>
                              <div className="text-[#64748B] text-[11px]">{order.customer_email}</div>
                            </td>
                            <td className="py-3 px-4 font-medium text-[#111827]">
                              {order.template_title || 'Digital Template'}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-[#111827]">
                              ₹{order.amount}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                order.payment_status === 'Paid'
                                  ? 'bg-[#22C55E]/10 text-[#22C55E]'
                                  : 'bg-amber-50 text-amber-600'
                              }`}>
                                {order.payment_status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-[#64748B]">
                              {new Date(order.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedOrder(order)}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#6D5DFB] hover:bg-[#6D5DFB]/10 cursor-pointer"
                              >
                                View Detail
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* 2. TEMPLATES TAB */}
        {activeTab === 'templates' && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xs overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#111827]">
                  Templates Management
                </h3>
                <p className="text-xs text-[#64748B]">
                  Create, edit pricing, update Google Drive access URLs, and publish new templates.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCleanupDuplicates}
                  disabled={isCleaningDuplicates}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-[#111827] text-xs font-semibold rounded-xl cursor-pointer transition-colors disabled:opacity-50"
                  title="Purge and deduplicate any redundant templates"
                >
                  {isCleaningDuplicates ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Clean Duplicates
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingTemplate(null);
                    setTemplateModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#6D5DFB] hover:bg-[#5B4CE0] text-white text-xs font-semibold rounded-xl cursor-pointer shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add New Template
                </button>
              </div>
            </div>

            {templateFeedback && (
              templateFeedback.type === 'error' ? (
                <div className="mx-6 mt-4">
                  <ErrorAlert
                    title="Template Notice"
                    message={templateFeedback.message}
                    onDismiss={() => setTemplateFeedback(null)}
                  />
                </div>
              ) : (
                <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50/90 to-teal-50/80 border border-emerald-200/80 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-3 shadow-2xs animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{templateFeedback.message}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setTemplateFeedback(null)} 
                    className="text-xs font-bold opacity-70 hover:opacity-100 cursor-pointer px-1"
                  >
                    ✕
                  </button>
                </div>
              )
            )}

            {templates.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="max-w-sm mx-auto space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#64748B]">
                    <Package className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-sm text-[#111827]">No templates currently added</div>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Create and publish your spreadsheet templates with custom pricing and Google Drive access URLs.
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTemplate(null);
                        setTemplateModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#6D5DFB] hover:bg-[#5B4CE0] text-white text-xs font-semibold rounded-xl cursor-pointer shadow-xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add New Template
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Mobile Cards View */}
                <div className="block md:hidden divide-y divide-[#F1F5F9]">
                  {templates.map((t) => (
                    <div key={t.id} className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <img
                          src={t.thumbnail_url || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80'}
                          alt={t.title}
                          className="w-16 h-12 object-cover rounded-lg border border-[#E2E8F0] shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80';
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-[#111827] truncate">{t.title}</div>
                          <div className="text-[#64748B] text-[10px] font-mono">/{t.slug}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-md font-medium">
                              {t.category || 'Sheets'}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              t.status === 'Published'
                                ? 'bg-[#22C55E]/10 text-[#22C55E]'
                                : 'bg-[#64748B]/10 text-[#64748B]'
                            }`}>
                              {t.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-[#F8FAFC]">
                        <div className="font-mono font-bold text-sm text-[#111827]">
                          ₹{t.sale_price ?? t.price}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(t)}
                            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#111827] hover:bg-[#E2E8F0]/60 transition-colors cursor-pointer"
                            title={t.status === 'Published' ? 'Unpublish' : 'Publish'}
                          >
                            {t.status === 'Published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#22C55E]" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingTemplate(t);
                              setTemplateModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-[#6D5DFB] hover:bg-[#6D5DFB]/10 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {confirmDeleteTemplateId === t.id ? (
                            <div className="inline-flex items-center gap-1 bg-rose-50 p-0.5 rounded-lg border border-rose-200">
                              <button
                                type="button"
                                onClick={() => handleDeleteTemplate(t.id)}
                                disabled={deletingTemplateId === t.id}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                              >
                                {deletingTemplateId === t.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <span>Delete</span>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteTemplateId(null)}
                                disabled={deletingTemplateId === t.id}
                                className="px-1.5 py-1 rounded-md text-[11px] font-medium text-[#64748B] hover:text-[#111827] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteTemplateId(t.id)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                        <th className="py-3 px-4">Thumbnail</th>
                        <th className="py-3 px-4">Template Name</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Price</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Created Date</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {templates.map((t) => (
                        <tr key={t.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]">
                          <td className="py-3 px-4">
                            <img
                              src={t.thumbnail_url || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80'}
                              alt={t.title}
                              className="w-12 h-9 object-cover rounded-lg border border-[#E2E8F0]"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80';
                              }}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-[#111827]">{t.title}</div>
                            <div className="text-[#64748B] text-[11px] font-mono">/{t.slug}</div>
                          </td>
                          <td className="py-3 px-4 text-[#64748B]">
                            {t.category || 'Sheets'}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-[#111827]">
                            ₹{t.sale_price ?? t.price}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              t.status === 'Published'
                                ? 'bg-[#22C55E]/10 text-[#22C55E]'
                                : 'bg-[#64748B]/10 text-[#64748B]'
                            }`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#64748B]">
                            {new Date(t.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleTogglePublish(t)}
                                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#111827] hover:bg-[#E2E8F0]/60 transition-colors cursor-pointer"
                                title={t.status === 'Published' ? 'Unpublish' : 'Publish'}
                              >
                                {t.status === 'Published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#22C55E]" />}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTemplate(t);
                                  setTemplateModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-[#6D5DFB] hover:bg-[#6D5DFB]/10 transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {confirmDeleteTemplateId === t.id ? (
                                <div className="inline-flex items-center gap-1 bg-rose-50 p-0.5 rounded-lg border border-rose-200">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTemplate(t.id)}
                                    disabled={deletingTemplateId === t.id}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                                  >
                                    {deletingTemplateId === t.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <span>Delete</span>
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteTemplateId(null)}
                                    disabled={deletingTemplateId === t.id}
                                    className="px-1.5 py-1 rounded-md text-[11px] font-medium text-[#64748B] hover:text-[#111827] cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteTemplateId(t.id)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* 3. ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in duration-200">


            {/* Order Feedback Alert */}
            {orderActionFeedback && (
              orderActionFeedback.type === 'error' ? (
                <ErrorAlert
                  title="Order Notice"
                  message={orderActionFeedback.message}
                  onDismiss={() => setOrderActionFeedback(null)}
                />
              ) : (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50/90 to-teal-50/80 border border-emerald-200/80 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-3 shadow-2xs animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{orderActionFeedback.message}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setOrderActionFeedback(null)} 
                    className="text-xs opacity-60 hover:opacity-100 cursor-pointer px-1"
                  >
                    ✕
                  </button>
                </div>
              )
            )}

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xs overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#111827]">
                  Customer Orders
                </h3>
                <p className="text-xs text-[#64748B]">
                  All template purchases and payment references.
                </p>
              </div>
              {orders.length > 0 && (
                <div>
                  {confirmClearData ? (
                    <div className="inline-flex items-center gap-1.5 bg-rose-50 p-1 rounded-lg border border-rose-200">
                      <span className="text-[11px] font-bold text-rose-700 px-1">Reset all to 0?</span>
                      <button
                        type="button"
                        onClick={handleClearTestData}
                        disabled={isClearingData}
                        className="px-2.5 py-1 rounded text-[11px] font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                      >
                        {isClearingData ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Yes, Reset'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClearData(false)}
                        disabled={isClearingData}
                        className="px-2 py-1 rounded text-[11px] font-medium text-[#64748B] hover:text-[#111827] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmClearData(true)}
                      disabled={isClearingData}
                      className="text-[11px] font-medium text-[#94A3B8] hover:text-rose-600 hover:underline cursor-pointer transition-colors disabled:opacity-50"
                      title="Reset all test orders to 0"
                    >
                      Clear Test Orders
                    </button>
                  )}
                </div>
              )}
            </div>

            {orders.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#64748B]">
                No orders found.
              </div>
            ) : (
              <>
                {/* Mobile Cards View */}
                <div className="block md:hidden divide-y divide-[#F1F5F9]">
                  {orders.map((order) => (
                    <div key={order.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-[#111827]">{order.id}</span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          order.payment_status === 'Paid'
                            ? 'bg-[#22C55E]/10 text-[#22C55E]'
                            : 'bg-amber-50 text-amber-600'
                        }`}>
                          {order.payment_status}
                        </span>
                      </div>

                      <div>
                        <div className="font-bold text-xs text-[#111827]">{order.template_title || 'Digital Template'}</div>
                        <div className="text-[11px] text-[#64748B]">{order.customer_name} • {order.customer_email}</div>
                        {order.razorpay_payment_id && (
                          <div className="text-[10px] text-[#64748B] font-mono mt-0.5">
                            Ref: {order.razorpay_payment_id}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-[#F8FAFC]">
                        <div>
                          <span className="font-mono font-bold text-sm text-[#111827]">₹{order.amount}</span>
                          <span className="text-[10px] text-[#94A3B8] ml-2">
                            {new Date(order.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#6D5DFB] hover:bg-[#5B4CE0] shadow-2xs cursor-pointer"
                          >
                            Manage
                          </button>

                          {confirmDeleteOrderId === order.id ? (
                            <div className="inline-flex items-center gap-1 bg-rose-50 p-0.5 rounded-lg border border-rose-200">
                              <button
                                type="button"
                                onClick={() => handleDeleteOrder(order.id)}
                                disabled={deletingOrderId === order.id}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                              >
                                {deletingOrderId === order.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <span>Delete</span>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteOrderId(null)}
                                disabled={deletingOrderId === order.id}
                                className="px-1.5 py-1 rounded-md text-[11px] font-medium text-[#64748B] hover:text-[#111827] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteOrderId(order.id)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Order"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                        <th className="py-3 px-4">Order ID</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Product</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Payment ID</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]">
                          <td className="py-3 px-4 font-mono font-bold text-[#111827]">
                            <div>{order.id}</div>
                            {order.razorpay_order_id && (
                              <div className="text-[10px] text-[#94A3B8] font-mono truncate max-w-[120px]">
                                {order.razorpay_order_id}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-[#111827]">{order.customer_name}</div>
                            <div className="text-[11px] text-[#64748B]">{order.customer_email}</div>
                          </td>
                          <td className="py-3 px-4 font-medium text-[#111827]">
                            {order.template_title || 'Digital Template'}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-[#111827]">
                            ₹{order.amount}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-[#64748B]">
                            <span className="bg-[#F1F5F9] px-2 py-1 rounded text-[#111827] font-semibold">
                              {order.razorpay_payment_id || order.payment_reference || '—'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              order.payment_status === 'Paid'
                                ? 'bg-[#22C55E]/10 text-[#22C55E]'
                                : 'bg-amber-50 text-amber-600'
                            }`}>
                              {order.payment_status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#64748B] text-[11px]">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedOrder(order)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#6D5DFB] hover:bg-[#5B4CE0] shadow-2xs cursor-pointer"
                              >
                                Manage
                              </button>

                              {confirmDeleteOrderId === order.id ? (
                                <div className="inline-flex items-center gap-1 bg-rose-50 p-0.5 rounded-lg border border-rose-200">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteOrder(order.id)}
                                    disabled={deletingOrderId === order.id}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                                  >
                                    {deletingOrderId === order.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <span>Delete</span>
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteOrderId(null)}
                                    disabled={deletingOrderId === order.id}
                                    className="px-1.5 py-1 rounded-md text-[11px] font-medium text-[#64748B] hover:text-[#111827] cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteOrderId(order.id)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Delete Order"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            </div>
          </div>
        )}

        {/* 4. Customer Inquiries Tab */}
        {activeTab === 'messages' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Received Customer Messages Table */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-xs">
              <div className="p-6 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-extrabold text-[#111827]">
                    Customer Inquiries ({messages.length})
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    All submissions from the contact page.
                  </p>
                </div>
              </div>

              {deleteError && (
                <div className="mx-6 mt-4">
                  <ErrorAlert
                    title="Inquiry Notice"
                    message={deleteError}
                    onDismiss={() => setDeleteError(null)}
                  />
                </div>
              )}

              {messages.length === 0 ? (
                <div className="p-12 text-center text-[#64748B] text-xs">
                  No contact inquiries received yet. Inquiries submitted on the contact form will appear here.
                </div>
              ) : (
                <>
                  {/* Mobile Cards View */}
                  <div className="block md:hidden divide-y divide-[#F1F5F9]">
                    {messages.map((msg) => (
                      <div key={msg.id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-xs text-[#111827]">{msg.name}</div>
                            <div className="text-[11px] text-[#64748B] font-mono">{msg.email}</div>
                          </div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#6D5DFB]/10 text-[#6D5DFB] border border-[#6D5DFB]/20 shrink-0">
                            {msg.category}
                          </span>
                        </div>

                        {msg.subject && (
                          <div className="font-semibold text-[#111827] text-xs">
                            {msg.subject}
                          </div>
                        )}

                        <p className="text-[#475569] text-xs leading-relaxed break-words bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
                          {msg.message}
                        </p>

                        <div className="flex items-center justify-end pt-1 border-t border-[#F8FAFC]">
                          <div className="flex items-center gap-1.5">
                            {confirmDeleteId === msg.id ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  disabled={deletingMessageId === msg.id}
                                  className="px-2 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  {deletingMessageId === msg.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Yes'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteError(null);
                                  setConfirmDeleteId(msg.id);
                                }}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete message"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                          <th className="py-3.5 px-5">Name</th>
                          <th className="py-3.5 px-5">Email</th>
                          <th className="py-3.5 px-5">Inquiry Category</th>
                          <th className="py-3.5 px-5">Description</th>
                          <th className="py-3.5 px-5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {messages.map((msg) => (
                          <tr key={msg.id} className="hover:bg-[#F8FAFC]/60 transition-colors">
                            <td className="py-4 px-5 font-semibold text-[#111827] whitespace-nowrap">
                              {msg.name}
                            </td>
                            <td className="py-4 px-5 whitespace-nowrap font-mono text-[11px] sm:text-xs text-[#64748B]">
                              {msg.email}
                            </td>
                            <td className="py-4 px-5 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#6D5DFB]/10 text-[#6D5DFB] border border-[#6D5DFB]/20">
                                {msg.category}
                              </span>
                            </td>
                            <td className="py-4 px-5 min-w-[240px] max-w-lg">
                              {msg.subject && (
                                <div className="font-semibold text-[#111827] text-xs mb-1">
                                  {msg.subject}
                                </div>
                              )}
                              <p className="text-[#475569] text-xs leading-relaxed break-words whitespace-pre-wrap">
                                {msg.message}
                              </p>
                              {msg.order_id && (
                                <div className="text-[10px] font-mono text-[#64748B] mt-1">
                                  Order ID: {msg.order_id}
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-5 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-2 justify-end">
                                {confirmDeleteId === msg.id ? (
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMessage(msg.id)}
                                      disabled={deletingMessageId === msg.id}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                                    >
                                      {deletingMessageId === msg.id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <Trash2 className="w-3.5 h-3.5" />
                                      )}
                                      <span>Yes, Delete</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteId(null)}
                                      className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeleteError(null);
                                      setConfirmDeleteId(msg.id);
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all cursor-pointer shadow-2xs"
                                    title="Delete message"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Add / Edit Template Modal */}
      {templateModalOpen && (
        <TemplateFormModal
          initialTemplate={editingTemplate}
          token={token}
          onClose={() => {
            setTemplateModalOpen(false);
            setEditingTemplate(null);
          }}
          onSave={handleSaveTemplate}
        />
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={handleUpdateOrderStatus}
        />
      )}
    </div>
  );
};
