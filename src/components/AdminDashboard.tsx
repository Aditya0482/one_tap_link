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
  FileSpreadsheet,
  TrendingUp,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Table,
  Copy,
  Check,
  UploadCloud,
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
import { firestore, sanitizeForFirestore } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';

const ORDERS_APPS_SCRIPT_CODE = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    // Auto-create headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Order ID", 
        "Date & Time", 
        "Customer Name", 
        "Customer Email", 
        "Template Name", 
        "Amount (₹)", 
        "Payment ID", 
        "Order Reference", 
        "Status"
      ]);
      sheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#EDE9FE").setFontColor("#5B21B6");
      sheet.setFrozenRows(1);
    }

    // Append new order row
    sheet.appendRow([
      data.order_id || "",
      data.timestamp || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      data.customer_name || "",
      data.customer_email || "",
      data.product_name || data.template_title || "",
      data.amount !== undefined ? data.amount : "",
      data.payment_id || "",
      data.order_ref || "",
      data.status || "paid"
    ]);

    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Order recorded successfully" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: "active", message: "Orders Webhook is live" }))
    .setMimeType(ContentService.MimeType.JSON);
}`;

const INQUIRIES_APPS_SCRIPT_CODE = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    // Auto-create headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Ticket ID", 
        "Date & Time", 
        "Name", 
        "Email", 
        "Category", 
        "Order ID", 
        "Subject", 
        "Message"
      ]);
      sheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#E0F2FE").setFontColor("#0369A1");
      sheet.setFrozenRows(1);
    }

    // Append new inquiry row
    sheet.appendRow([
      data.ticket_id || "",
      data.timestamp || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      data.name || "",
      data.email || "",
      data.category || "",
      data.order_id || "N/A",
      data.subject || "",
      data.message || ""
    ]);

    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Inquiry recorded successfully" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: "active", message: "Inquiries Webhook is live" }))
    .setMimeType(ContentService.MimeType.JSON);
}`;

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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'templates' | 'orders' | 'messages'>('dashboard');
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [settings, setSettings] = useState<{ 
    google_sheet_webhook_url: string; 
    google_sheet_orders_webhook_url?: string;
    google_sheet_inquiry_webhook_url?: string;
    env_configured: boolean;
  }>({
    google_sheet_webhook_url: '',
    google_sheet_orders_webhook_url: '',
    google_sheet_inquiry_webhook_url: '',
    env_configured: false
  });
  const [ordersWebhookInput, setOrdersWebhookInput] = useState('');
  const [inquiryWebhookInput, setInquiryWebhookInput] = useState('');
  const [isSavingOrders, setIsSavingOrders] = useState(false);
  const [isSavingInquiry, setIsSavingInquiry] = useState(false);
  const [isTestingOrders, setIsTestingOrders] = useState(false);
  const [isTestingInquiry, setIsTestingInquiry] = useState(false);
  const [ordersFeedback, setOrdersFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [inquiryFeedback, setInquiryFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedCodeType, setCopiedCodeType] = useState<'orders' | 'inquiries' | null>(null);
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
  const [resyncingMessageId, setResyncingMessageId] = useState<string | null>(null);
  const [resyncFeedback, setResyncFeedback] = useState<{ id: string; success: boolean; message: string } | null>(null);
  const [isClearingData, setIsClearingData] = useState(false);
  const [confirmDeleteOrderId, setConfirmDeleteOrderId] = useState<string | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [orderActionFeedback, setOrderActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmDeleteTemplateId, setConfirmDeleteTemplateId] = useState<string | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [confirmClearData, setConfirmClearData] = useState(false);

  const loadData = async () => {
    try {
      setIsRefreshing(true);
      const [fetchedStats, fetchedTemplates, fetchedOrders, fetchedMessages, fetchedSettings] = await Promise.all([
        api.adminGetStats(token),
        api.adminGetTemplates(token),
        api.adminGetOrders(token),
        api.adminGetMessages(token).catch(() => []),
        api.adminGetSettings(token).catch(() => ({ 
          google_sheet_webhook_url: '', 
          google_sheet_orders_webhook_url: '', 
          google_sheet_inquiry_webhook_url: '', 
          env_configured: false
        }))
      ]);

      // Load templates from Firestore as well to prevent any loss across server restarts/different devices
      let combinedTemplates = [...fetchedTemplates];
      try {
        const firestoreSnap = await getDocs(collection(firestore, 'templates'));
        const firestoreTemplates: Template[] = [];
        firestoreSnap.forEach((d) => {
          firestoreTemplates.push({ id: d.id, ...d.data() } as Template);
        });

        if (firestoreTemplates.length > 0) {
          const tMap = new Map<string, Template>();
          // Server templates
          fetchedTemplates.forEach(t => tMap.set(t.id, t));
          // Merge/overlay Firestore templates
          firestoreTemplates.forEach(t => tMap.set(t.id, t));
          combinedTemplates = Array.from(tMap.values());

          // If there are templates in Firestore that were missing on the server (e.g. server container restarted),
          // sync them back to the server in the background so backend endpoints have them too
          firestoreTemplates.forEach(ft => {
            if (!fetchedTemplates.some(st => st.id === ft.id)) {
              api.adminCreateTemplate(token, ft).catch(() => {});
            }
          });
        }
        
        // Also if server had templates not yet in Firestore, upload them to Firestore
        fetchedTemplates.forEach(st => {
          if (!firestoreTemplates.some(ft => ft.id === st.id)) {
            try {
              const cleanData = sanitizeForFirestore(st);
              setDoc(doc(firestore, 'templates', st.id), cleanData, { merge: true }).catch(() => {});
            } catch (fsErr) {
              console.warn('Sync server template to firestore notice:', fsErr);
            }
          }
        });
      } catch (fsErr) {
        console.warn('Firestore admin templates sync notice:', fsErr);
      }

      setStats(fetchedStats);
      setTemplates(combinedTemplates);
      setOrders(fetchedOrders);
      setMessages(fetchedMessages);
      setSettings(fetchedSettings);
      setOrdersWebhookInput(fetchedSettings.google_sheet_orders_webhook_url || '');
      setInquiryWebhookInput(fetchedSettings.google_sheet_inquiry_webhook_url || fetchedSettings.google_sheet_webhook_url || '');
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleSaveOrdersWebhook = async () => {
    setIsSavingOrders(true);
    setOrdersFeedback(null);
    try {
      await api.adminUpdateSettings(token, { google_sheet_orders_webhook_url: ordersWebhookInput.trim() });
      setSettings(prev => ({ ...prev, google_sheet_orders_webhook_url: ordersWebhookInput.trim() }));
      setOrdersFeedback({ type: 'success', message: 'Orders Sheet Webhook URL saved successfully!' });
    } catch (err: any) {
      setOrdersFeedback({ type: 'error', message: err?.message || 'Failed to save orders webhook URL' });
    } finally {
      setIsSavingOrders(false);
    }
  };

  const handleTestOrdersWebhook = async () => {
    setIsTestingOrders(true);
    setOrdersFeedback(null);
    try {
      const res = await api.adminTestSheetWebhook(token, ordersWebhookInput.trim(), 'orders');
      setOrdersFeedback({ type: 'success', message: res.message || 'Test order row appended to Google Sheet successfully!' });
    } catch (err: any) {
      setOrdersFeedback({ type: 'error', message: err?.message || 'Webhook test failed. Check URL and Google Apps Script permissions.' });
    } finally {
      setIsTestingOrders(false);
    }
  };

  const handleSaveInquiryWebhook = async () => {
    setIsSavingInquiry(true);
    setInquiryFeedback(null);
    try {
      await api.adminUpdateSettings(token, { 
        google_sheet_inquiry_webhook_url: inquiryWebhookInput.trim(),
        google_sheet_webhook_url: inquiryWebhookInput.trim() 
      });
      setSettings(prev => ({ 
        ...prev, 
        google_sheet_inquiry_webhook_url: inquiryWebhookInput.trim(),
        google_sheet_webhook_url: inquiryWebhookInput.trim() 
      }));
      setInquiryFeedback({ type: 'success', message: 'Inquiries Sheet Webhook URL saved successfully!' });
    } catch (err: any) {
      setInquiryFeedback({ type: 'error', message: err?.message || 'Failed to save inquiries webhook URL' });
    } finally {
      setIsSavingInquiry(false);
    }
  };

  const handleTestInquiryWebhook = async () => {
    setIsTestingInquiry(true);
    setInquiryFeedback(null);
    try {
      const res = await api.adminTestSheetWebhook(token, inquiryWebhookInput.trim(), 'inquiries');
      setInquiryFeedback({ type: 'success', message: res.message || 'Test inquiry row appended to Google Sheet successfully!' });
    } catch (err: any) {
      setInquiryFeedback({ type: 'error', message: err?.message || 'Webhook test failed. Check URL and Google Apps Script permissions.' });
    } finally {
      setIsTestingInquiry(false);
    }
  };

  const handleCopyCode = (code: string, type: 'orders' | 'inquiries') => {
    navigator.clipboard.writeText(code);
    setCopiedCodeType(type);
    setTimeout(() => setCopiedCodeType(null), 2500);
  };

  const handleDeleteMessage = async (id: string) => {
    setDeletingMessageId(id);
    setDeleteError(null);
    try {
      await api.adminDeleteMessage(token, id);
      setMessages(prev => prev.filter(m => m.id !== id));
      setConfirmDeleteId(null);
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete inquiry');
    } finally {
      setDeletingMessageId(null);
    }
  };

  const handleResyncMessage = async (id: string) => {
    setResyncingMessageId(id);
    setResyncFeedback(null);
    try {
      const res = await api.adminResyncMessage(token, id);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, synced_to_sheet: true, sheet_sync_error: undefined } : m));
      setResyncFeedback({ id, success: true, message: res.message || 'Inquiry successfully pushed to Google Sheet!' });
      setTimeout(() => setResyncFeedback(null), 4000);
    } catch (err: any) {
      setResyncFeedback({ id, success: false, message: err?.message || 'Failed to sync to Google Sheet' });
    } finally {
      setResyncingMessageId(null);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Template Actions
  const handleSaveTemplate = async (templateData: Partial<Template>, status: TemplateStatus) => {
    let saved: Template | null = null;
    if (editingTemplate) {
      saved = await api.adminUpdateTemplate(token, editingTemplate.id, { ...templateData, status });
    } else {
      saved = await api.adminCreateTemplate(token, { ...templateData, status });
    }

    // Cloud Firestore Sync: ensures template never disappears on other devices or container restarts
    try {
      const templateToSave = saved || { ...templateData, status, id: editingTemplate?.id };
      if (templateToSave && templateToSave.id) {
        await setDoc(doc(firestore, 'templates', templateToSave.id), sanitizeForFirestore(templateToSave), { merge: true });
      }
    } catch (fsErr) {
      console.warn('Firestore template save notice:', fsErr);
    }

    await loadData();
  };

  const handleTogglePublish = async (template: Template) => {
    const nextStatus: TemplateStatus = template.status === 'Published' ? 'Draft' : 'Published';
    await api.adminUpdateTemplate(token, template.id, { status: nextStatus });
    try {
      await setDoc(doc(firestore, 'templates', template.id), { status: nextStatus }, { merge: true });
    } catch (e) {
      console.warn('Firestore publish toggle notice:', e);
    }
    await loadData();
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      setDeletingTemplateId(id);
      await api.adminDeleteTemplate(token, id);
      try {
        await deleteDoc(doc(firestore, 'templates', id));
      } catch (e) {
        console.warn('Firestore delete template notice:', e);
      }
      setConfirmDeleteTemplateId(null);
      await loadData();
    } catch (err: any) {
      console.error('Failed to delete template:', err);
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
    await loadData();
  };

  const handleClearTestData = async () => {
    try {
      setIsClearingData(true);
      await api.adminClearTestData(token);
      setConfirmClearData(false);
      setOrderActionFeedback({ type: 'success', message: 'All test orders and inquiries reset to zero.' });
      setTimeout(() => setOrderActionFeedback(null), 4000);
      await loadData();
    } catch (err: any) {
      setOrderActionFeedback({ type: 'error', message: err?.message || 'Failed to reset test data' });
    } finally {
      setIsClearingData(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      setDeletingOrderId(orderId);
      await api.adminDeleteOrder(token, orderId);
      setConfirmDeleteOrderId(null);
      setOrderActionFeedback({ type: 'success', message: 'Order deleted successfully.' });
      setTimeout(() => setOrderActionFeedback(null), 4000);
      await loadData();
    } catch (err: any) {
      console.error('Failed to delete order:', err);
      setOrderActionFeedback({ type: 'error', message: err?.message || 'Failed to delete order' });
      setTimeout(() => setOrderActionFeedback(null), 5000);
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
                <span>Inquiries & Sheets</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/20">
                  {messages.length}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={loadData}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#111827] hover:bg-[#F8FAFC] shadow-2xs transition-colors cursor-pointer"
              title="Refresh Data"
              aria-label="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#6D5DFB]' : ''}`} />
            </button>

            <button
              id="admin-add-template-btn"
              type="button"
              onClick={() => {
                setEditingTemplate(null);
                setTemplateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#6D5DFB] hover:bg-[#5B4CE0] text-white shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Template</span>
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
                          <div className="font-bold text-xs text-[#111827]">{order.template_title || 'Google Template'}</div>
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
                              {order.template_title || 'Google Template'}
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
            </div>

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
                          src={t.thumbnail_url}
                          alt={t.title}
                          className="w-16 h-12 object-cover rounded-lg border border-[#E2E8F0] shrink-0"
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
                              src={t.thumbnail_url}
                              alt={t.title}
                              className="w-12 h-9 object-cover rounded-lg border border-[#E2E8F0]"
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
            {/* Orders Google Sheet Webhook Sync Card */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#6D5DFB]/10 text-[#6D5DFB] flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#111827]">
                      Google Sheets Orders Sync
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      Every time a customer places an order or completes payment, a new row will automatically be added to your Orders Google Sheet.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    settings.google_sheet_orders_webhook_url
                      ? 'bg-[#22C55E]/10 text-[#15803D] border border-[#22C55E]/20'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${settings.google_sheet_orders_webhook_url ? 'bg-[#22C55E]' : 'bg-amber-500'}`} />
                    {settings.google_sheet_orders_webhook_url ? 'Sync Configured' : 'No Webhook Set'}
                  </span>
                </div>
              </div>

              {/* Webhook Form */}
              <div className="pt-4 space-y-3">
                <label className="block text-xs font-bold text-[#111827]">
                  Orders Google Apps Script Webhook URL (POST Endpoint)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={ordersWebhookInput}
                    onChange={(e) => setOrdersWebhookInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#6D5DFB] bg-[#F8FAFC]"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveOrdersWebhook}
                      disabled={isSavingOrders}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#111827] hover:bg-black text-white cursor-pointer transition-all disabled:opacity-60"
                    >
                      {isSavingOrders ? 'Saving...' : 'Save URL'}
                    </button>
                    <button
                      type="button"
                      onClick={handleTestOrdersWebhook}
                      disabled={isTestingOrders || !ordersWebhookInput.trim()}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#6D5DFB] hover:bg-[#5B4CE0] text-white cursor-pointer transition-all disabled:opacity-60 flex items-center gap-1.5"
                    >
                      {isTestingOrders ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Testing...</span>
                        </>
                      ) : (
                        <span>Test Sheet</span>
                      )}
                    </button>
                  </div>
                </div>

                {ordersFeedback && (
                  <div className={`p-3 rounded-xl text-xs font-medium ${
                    ordersFeedback.type === 'success' 
                      ? 'bg-[#22C55E]/10 text-[#15803D] border border-[#22C55E]/20' 
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {ordersFeedback.message}
                  </div>
                )}

                {/* Helpful Orders Apps Script Setup Guide */}
                <details className="mt-3 text-xs text-[#64748B] bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
                  <summary className="font-bold text-[#111827] cursor-pointer hover:text-[#6D5DFB] flex items-center justify-between">
                    <span>How to connect your Orders Google Sheet (Click to view code & steps)</span>
                  </summary>
                  <div className="mt-2.5 space-y-2 text-xs leading-relaxed text-[#475569]">
                    <p><strong>Step 1:</strong> Open your <strong>Orders Google Sheet</strong>, click on <strong>Extensions &gt; Apps Script</strong>.</p>
                    <p><strong>Step 2:</strong> Paste this script into the editor (it automatically adds headers on the first order):</p>
                    <div className="relative">
                      <pre className="p-3 bg-white rounded-lg border border-[#E2E8F0] font-mono text-[11px] text-[#111827] overflow-x-auto max-h-52">
                        {ORDERS_APPS_SCRIPT_CODE}
                      </pre>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(ORDERS_APPS_SCRIPT_CODE, 'orders')}
                        className="absolute top-2 right-2 px-2.5 py-1 bg-[#111827] text-white text-[11px] font-semibold rounded-md hover:bg-black transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        {copiedCodeType === 'orders' ? <Check className="w-3 h-3 text-[#22C55E]" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCodeType === 'orders' ? 'Copied!' : 'Copy Code'}</span>
                      </button>
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs">
                      <strong>Step 3 (Deployment):</strong>
                      <ol className="list-decimal ml-4 mt-1 space-y-1">
                        <li>Click <strong>Deploy &gt; New deployment</strong>.</li>
                        <li>Select type: <strong>Web App</strong>.</li>
                        <li><strong>Execute as:</strong> Select <code>Me</code>.</li>
                        <li><strong>Who has access:</strong> MUST select <code>Anyone</code>.</li>
                        <li>Click <strong>Deploy</strong> and copy the generated <strong>Web App URL</strong>.</li>
                        <li>Paste that URL into the box above and click <strong>Save URL</strong>, then click <strong>Test Sheet</strong>.</li>
                      </ol>
                    </div>
                  </div>
                </details>
              </div>
            </div>

            {/* Order Feedback Alert */}
            {orderActionFeedback && (
              <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 shadow-2xs ${
                orderActionFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                <span>{orderActionFeedback.message}</span>
                <button 
                  type="button" 
                  onClick={() => setOrderActionFeedback(null)} 
                  className="text-xs opacity-60 hover:opacity-100 cursor-pointer px-1"
                >
                  ✕
                </button>
              </div>
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
                        <div className="font-bold text-xs text-[#111827]">{order.template_title || 'Google Template'}</div>
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
                            {order.template_title || 'Google Template'}
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

        {/* 4. Inquiries & Google Sheets Tab */}
        {activeTab === 'messages' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Google Sheets Sync Integration Box */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0284C7]/10 text-[#0284C7] flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#111827]">
                      Google Sheets Inquiry Sync
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      Every time a customer sends a message on the contact page, it will automatically append as a new row in your Inquiry Google Sheet.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    settings.google_sheet_inquiry_webhook_url || settings.google_sheet_webhook_url
                      ? 'bg-[#22C55E]/10 text-[#15803D] border border-[#22C55E]/20'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${(settings.google_sheet_inquiry_webhook_url || settings.google_sheet_webhook_url) ? 'bg-[#22C55E]' : 'bg-amber-500'}`} />
                    {(settings.google_sheet_inquiry_webhook_url || settings.google_sheet_webhook_url) ? 'Sync Configured' : 'No Webhook Set'}
                  </span>
                </div>
              </div>

              {/* Webhook Form */}
              <div className="pt-4 space-y-3">
                <label className="block text-xs font-bold text-[#111827]">
                  Inquiries Google Apps Script Webhook URL (POST Endpoint)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={inquiryWebhookInput}
                    onChange={(e) => setInquiryWebhookInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#6D5DFB] bg-[#F8FAFC]"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveInquiryWebhook}
                      disabled={isSavingInquiry}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#111827] hover:bg-black text-white cursor-pointer transition-all disabled:opacity-60"
                    >
                      {isSavingInquiry ? 'Saving...' : 'Save URL'}
                    </button>
                    <button
                      type="button"
                      onClick={handleTestInquiryWebhook}
                      disabled={isTestingInquiry || !inquiryWebhookInput.trim()}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#6D5DFB] hover:bg-[#5B4CE0] text-white cursor-pointer transition-all disabled:opacity-60 flex items-center gap-1.5"
                    >
                      {isTestingInquiry ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Testing...</span>
                        </>
                      ) : (
                        <span>Test Sheet</span>
                      )}
                    </button>
                  </div>
                </div>

                {inquiryFeedback && (
                  <div className={`p-3 rounded-xl text-xs font-medium ${
                    inquiryFeedback.type === 'success' 
                      ? 'bg-[#22C55E]/10 text-[#15803D] border border-[#22C55E]/20' 
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {inquiryFeedback.message}
                  </div>
                )}

                {/* Helpful Google Apps Script Setup Guide */}
                <details className="mt-3 text-xs text-[#64748B] bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
                  <summary className="font-bold text-[#111827] cursor-pointer hover:text-[#6D5DFB] flex items-center justify-between">
                    <span>How to connect your Inquiry Google Sheet (Click to view code & steps)</span>
                  </summary>
                  <div className="mt-2.5 space-y-2 text-xs leading-relaxed text-[#475569]">
                    <p><strong>Step 1:</strong> Open your <strong>Inquiry Google Sheet</strong>, click on <strong>Extensions &gt; Apps Script</strong>.</p>
                    <p><strong>Step 2:</strong> Paste this script into the editor (it automatically adds headers on the first inquiry):</p>
                    <div className="relative">
                      <pre className="p-3 bg-white rounded-lg border border-[#E2E8F0] font-mono text-[11px] text-[#111827] overflow-x-auto max-h-52">
                        {INQUIRIES_APPS_SCRIPT_CODE}
                      </pre>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(INQUIRIES_APPS_SCRIPT_CODE, 'inquiries')}
                        className="absolute top-2 right-2 px-2.5 py-1 bg-[#111827] text-white text-[11px] font-semibold rounded-md hover:bg-black transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        {copiedCodeType === 'inquiries' ? <Check className="w-3 h-3 text-[#22C55E]" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCodeType === 'inquiries' ? 'Copied!' : 'Copy Code'}</span>
                      </button>
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs">
                      <strong>Step 3 (Deployment):</strong>
                      <ol className="list-decimal ml-4 mt-1 space-y-1">
                        <li>Click <strong>Deploy &gt; New deployment</strong> (or <em>Manage deployments &gt; Edit</em>).</li>
                        <li>Select type: <strong>Web App</strong>.</li>
                        <li><strong>Execute as:</strong> Select <code>Me</code>.</li>
                        <li><strong>Who has access:</strong> MUST select <code>Anyone</code>. <em>(If left as 'Only myself', Google blocks submissions with error 401).</em></li>
                        <li>Click <strong>Deploy</strong> and copy the generated <strong>Web App URL</strong>.</li>
                        <li>Paste that URL into the box above and click <strong>Save URL</strong>, then click <strong>Test Sheet</strong>.</li>
                      </ol>
                    </div>
                  </div>
                </details>
              </div>
            </div>

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
                <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs">
                  {deleteError}
                </div>
              )}

              {resyncFeedback && (
                <div className={`mx-6 mt-4 p-3 rounded-xl text-xs font-medium ${
                  resyncFeedback.success
                    ? 'bg-[#22C55E]/10 text-[#15803D] border border-[#22C55E]/20'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {resyncFeedback.message}
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

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#F8FAFC]">
                          <div>
                            {msg.synced_to_sheet ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#22C55E]/10 text-[#15803D] border border-[#22C55E]/20">
                                <Check className="w-3 h-3 text-[#22C55E]" />
                                Synced
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-500" />
                                Not Synced
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleResyncMessage(msg.id)}
                              disabled={resyncingMessageId === msg.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#6D5DFB]/10 text-[#6D5DFB] hover:bg-[#6D5DFB] hover:text-white transition-all cursor-pointer disabled:opacity-50"
                            >
                              {resyncingMessageId === msg.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <UploadCloud className="w-3 h-3" />
                              )}
                              <span>{msg.synced_to_sheet ? 'Re-sync' : 'Sync'}</span>
                            </button>

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
                          <th className="py-3.5 px-5">Sheet Sync</th>
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
                            <td className="py-4 px-5 whitespace-nowrap">
                              {msg.synced_to_sheet ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#22C55E]/10 text-[#15803D] border border-[#22C55E]/20">
                                  <Check className="w-3 h-3 text-[#22C55E]" />
                                  Synced
                                </span>
                              ) : (
                                <div className="flex flex-col gap-1 items-start">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    <Clock className="w-3 h-3 text-amber-500" />
                                    Not Synced
                                  </span>
                                  {msg.sheet_sync_error && (
                                    <span className="text-[10px] text-rose-600 max-w-[150px] truncate" title={msg.sheet_sync_error}>
                                      {msg.sheet_sync_error}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-5 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-2 justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleResyncMessage(msg.id)}
                                  disabled={resyncingMessageId === msg.id}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#6D5DFB]/10 text-[#6D5DFB] hover:bg-[#6D5DFB] hover:text-white transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                                  title="Push this inquiry to Google Sheet"
                                >
                                  {resyncingMessageId === msg.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <UploadCloud className="w-3.5 h-3.5" />
                                  )}
                                  <span>{msg.synced_to_sheet ? 'Re-sync' : 'Sync to Sheet'}</span>
                                </button>

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
