import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { 
  Template, 
  Order, 
  AdminUser, 
  AdminDashboardStats, 
  PaymentStatus, 
  AccessStatus,
  ContactMessage,
  AppSettings
} from '../types';

interface DatabaseSchema {
  admins: AdminUser[];
  admin_passwords: Record<string, string>; // admin_id -> password_hash
  templates: Template[];
  orders: Order[];
  messages: ContactMessage[];
  settings: AppSettings;
}

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');
const TEMPLATES_PERM_FILE = path.join(DATA_DIR, 'templates_permanent.json');
const DELETED_TEMPLATES_FILE = path.join(DATA_DIR, 'deleted_templates.json');
const ORDERS_PERM_FILE = path.join(DATA_DIR, 'orders_permanent.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const INITIAL_TEMPLATE: Template = {
  id: 'tpl_master_budget',
  title: 'Master Budget & Wealth Planner',
  slug: 'master-budget-wealth-planner',
  description: 'A comprehensive, automated Google Sheets system to track personal income, expenses, savings, investments, and net worth with interactive visual dashboards.',
  category: 'Finance',
  price: 499,
  original_price: 1499,
  sale_price: 499,
  thumbnail_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
  demo_url: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/preview',
  access_url: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/copy',
  features: [
    'Automated Net Worth & Cashflow visual dashboards',
    'Smart category breakdown with 50/30/20 budget allocation',
    'Multi-currency & custom monthly expense loggers',
    'Debt snowball & savings goal milestone trackers',
    'Zero formulas or complex math required — 100% plug & play'
  ],
  included_items: [
    'Master Google Sheets Template (instant copy to your Google Drive)',
    'Quick Start Step-by-Step PDF & Video Guide',
    'Lifetime access & all future template updates',
    'Direct customer support via email'
  ],
  faq: [
    {
      question: 'What do I receive after purchase?',
      answer: 'Immediately after checkout, you get instant one-click access to copy the full Google Sheets template directly into your personal Google Drive account.'
    },
    {
      question: 'Can I edit and customize the template?',
      answer: 'Yes! Once copied to your Google Drive, the spreadsheet is 100% yours. You can change colors, add custom categories, adjust rows, and modify formulas freely.'
    },
    {
      question: 'Do I need special software or subscriptions?',
      answer: 'No paid software is required. You only need a standard, free Google account and a web browser or Google Sheets app on your phone, tablet, or computer.'
    },
    {
      question: 'How quickly will I receive access?',
      answer: 'Instantly! The access link appears immediately on your order confirmation screen and is also sent directly to your provided email address.'
    },
    {
      question: 'What is your refund policy?',
      answer: 'Due to the instant delivery nature of digital Google Sheets, access is immediate upon checkout. If you encounter any technical issue or broken formula that our support team cannot resolve within 24 hours, or in case of duplicate billing, you are eligible for a 100% full refund.'
    }
  ],
  status: 'Published',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  images: [
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1543286386-713bdd548da4?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200&auto=format&fit=crop&q=80'
  ],
  sheet_preview: {
    sheetName: 'Master Budget & Wealth Dashboard 2026',
    tabs: ['📊 Dashboard', '💵 Monthly Budget', '💳 Expense Log', '📈 Net Worth', '🎯 Goals'],
    kpis: [
      { label: 'Total Monthly Income', value: '₹84,500.00', change: '+12.4%', isPositive: true, color: '#22C55E' },
      { label: 'Total Expenses', value: '₹38,200.00', change: '-4.2%', isPositive: true, color: '#6D5DFB' },
      { label: 'Net Monthly Savings', value: '₹46,300.00', change: '+18.1%', isPositive: true, color: '#22C55E' },
      { label: 'Savings Rate', value: '54.8%', change: 'Optimal', isPositive: true, color: '#38BDF8' }
    ],
    headers: ['Date', 'Category', 'Description', 'Planned', 'Actual', 'Variance', 'Status'],
    rows: [
      { cells: ['Sep 01', 'Housing', 'Monthly Rent / Mortgage', '₹15,000', '₹15,000', '₹0', 'Paid'] },
      { cells: ['Sep 03', 'Consulting Income', 'Client Retainer Q3', '₹45,000', '₹45,000', '₹0', 'Received'] },
      { cells: ['Sep 05', 'Groceries', 'Organic Produce & Market', '₹4,500', '₹4,100', '+₹400', 'Under Budget'] },
      { cells: ['Sep 08', 'Software', 'Cloud & Productivity Tools', '₹1,200', '₹1,200', '₹0', 'Paid'] },
      { cells: ['Sep 12', 'Investments', 'Index Funds & Equities', '₹20,000', '₹20,000', '₹0', 'Executed'] }
    ],
    chartType: 'donut',
    chartData: [
      { label: 'Housing', value: 39, color: '#6D5DFB' },
      { label: 'Investments', value: 35, color: '#22C55E' },
      { label: 'Living & Food', value: 16, color: '#38BDF8' },
      { label: 'Savings', value: 10, color: '#F59E0B' }
    ]
  }
};

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    let baseData: DatabaseSchema | null = null;
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        baseData = JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error reading database file:', e);
    }

    // Default Seed Data if file missing or corrupt
    if (!baseData) {
      const defaultAdminId = 'adm_1';
      const defaultAdmin: AdminUser = {
        id: defaultAdminId,
        email: 'admin@onetaplink.com',
        created_at: new Date().toISOString()
      };

      baseData = {
        admins: [defaultAdmin],
        admin_passwords: {
          [defaultAdminId]: bcrypt.hashSync('admin12345', 10)
        },
        templates: [],
        orders: [],
        messages: [],
        settings: {}
      };
    }

    if (!baseData.messages) baseData.messages = [];
    if (!baseData.settings) baseData.settings = {};
    if (!baseData.templates || !Array.isArray(baseData.templates)) baseData.templates = [];
    if (!baseData.orders || !Array.isArray(baseData.orders)) baseData.orders = [];

    // Read deleted templates tracker so deleted templates never resurface
    const deletedIds = new Set<string>();
    try {
      if (fs.existsSync(DELETED_TEMPLATES_FILE)) {
        const delRaw = fs.readFileSync(DELETED_TEMPLATES_FILE, 'utf-8');
        const delArr: string[] = JSON.parse(delRaw);
        if (Array.isArray(delArr)) {
          delArr.forEach(id => {
            if (typeof id === 'string') {
              deletedIds.add(id);
              deletedIds.add(id.toLowerCase());
            }
          });
        }
      }
    } catch (delErr) {
      console.warn('Deleted templates read notice:', delErr);
    }

    // Filter out any templates that were explicitly deleted by ID, slug, or title
    if (deletedIds.size > 0) {
      baseData.templates = baseData.templates.filter(t => {
        const idMatch = deletedIds.has(t.id);
        const slugMatch = t.slug && (deletedIds.has(t.slug) || deletedIds.has(t.slug.toLowerCase()));
        const titleMatch = t.title && deletedIds.has(t.title.trim().toLowerCase());
        return !idMatch && !slugMatch && !titleMatch;
      });
    }

    // Deduplicate baseData templates by ID, slug, and title
    baseData.templates = this.deduplicateTemplates(baseData.templates);

    // Permanent Templates Sync: Merge any templates from templates_permanent.json if not deleted
    try {
      if (fs.existsSync(TEMPLATES_PERM_FILE)) {
        const permRaw = fs.readFileSync(TEMPLATES_PERM_FILE, 'utf-8');
        const permTemplates: Template[] = JSON.parse(permRaw);
        if (Array.isArray(permTemplates)) {
          for (const pt of permTemplates) {
            if (!pt || !pt.id) continue;
            const ptSlug = (pt.slug || '').trim().toLowerCase();
            const ptTitle = (pt.title || '').trim().toLowerCase();

            if (deletedIds.has(pt.id) || (ptSlug && deletedIds.has(ptSlug)) || (ptTitle && deletedIds.has(ptTitle))) {
              continue;
            }
            // Prevent resurrected default initial template if user already has other templates
            if (pt.id === INITIAL_TEMPLATE.id && baseData.templates.length > 0 && !baseData.templates.some(t => t.id === INITIAL_TEMPLATE.id)) {
              continue;
            }
            const exists = baseData.templates.some(t => 
              t.id === pt.id || 
              (ptSlug && (t.slug || '').trim().toLowerCase() === ptSlug) ||
              (ptTitle && (t.title || '').trim().toLowerCase() === ptTitle)
            );
            if (!exists) {
              baseData.templates.push(pt);
            }
          }
        }
      }
    } catch (permErr) {
      console.warn('Permanent templates read notice:', permErr);
    }

    baseData.templates = this.deduplicateTemplates(baseData.templates);

    // Support TEMPLATES_JSON environment variable (e.g. for Render, Railway hosting)
    // Ensures templates are permanent and never reset even across ephemeral container restarts
    if (process.env.TEMPLATES_JSON) {
      try {
        const envTemplates = JSON.parse(process.env.TEMPLATES_JSON);
        if (Array.isArray(envTemplates) && envTemplates.length > 0) {
          baseData.templates = this.deduplicateTemplates(envTemplates);
        }
      } catch (envErr) {
        console.warn('Failed to parse TEMPLATES_JSON environment variable:', envErr);
      }
    }

    // Permanent Orders Sync: Merge any orders from orders_permanent.json
    try {
      if (fs.existsSync(ORDERS_PERM_FILE)) {
        const ordRaw = fs.readFileSync(ORDERS_PERM_FILE, 'utf-8');
        const permOrders: Order[] = JSON.parse(ordRaw);
        if (Array.isArray(permOrders)) {
          for (const po of permOrders) {
            const exists = baseData.orders.some(o => 
              o.id === po.id || 
              (po.razorpay_payment_id && o.razorpay_payment_id === po.razorpay_payment_id) ||
              (po.payment_reference && o.payment_reference === po.payment_reference)
            );
            if (!exists) {
              baseData.orders.push(po);
            }
          }
        }
      }
    } catch (ordErr) {
      console.warn('Permanent orders read notice:', ordErr);
    }

    // Only seed INITIAL_TEMPLATE on completely fresh installation if not deleted and no env templates provided
    if (baseData.templates.length === 0 && !deletedIds.has(INITIAL_TEMPLATE.id) && !process.env.TEMPLATES_JSON) {
      baseData.templates = [INITIAL_TEMPLATE];
    }

    this.saveDataDirect(baseData);
    this.syncPermanentFiles(baseData);
    return baseData;
  }

  private saveDataDirect(data: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing database file:', e);
    }
  }

  public syncPermanentFiles(data?: DatabaseSchema) {
    const current = data || this.data;
    try {
      if (current.templates) {
        fs.writeFileSync(TEMPLATES_PERM_FILE, JSON.stringify(current.templates, null, 2), 'utf-8');
      }
      if (current.orders) {
        fs.writeFileSync(ORDERS_PERM_FILE, JSON.stringify(current.orders, null, 2), 'utf-8');
      }
    } catch (e) {
      console.error('Error syncing permanent ledger files:', e);
    }
  }

  private save() {
    this.saveDataDirect(this.data);
    this.syncPermanentFiles();
  }

  // --- ADMIN AUTH ---
  public verifyAdmin(email: string, password: string): AdminUser | null {
    const admin = this.data.admins.find(a => a.email.toLowerCase() === email.toLowerCase());
    if (!admin) return null;

    const hash = this.data.admin_passwords[admin.id];
    if (!hash) return null;

    const match = bcrypt.compareSync(password, hash);
    return match ? admin : null;
  }

  public getAdminById(id: string): AdminUser | null {
    return this.data.admins.find(a => a.id === id) || null;
  }

  public getAdminByEmail(email: string): AdminUser | null {
    return this.data.admins.find(a => a.email.toLowerCase() === email.toLowerCase()) || null;
  }

  public setAdminPassword(email: string, newPassword: string): AdminUser {
    const cleanEmail = email.trim().toLowerCase();
    let admin = this.getAdminByEmail(cleanEmail);
    if (!admin) {
      admin = {
        id: `adm_${Date.now()}`,
        email: cleanEmail,
        created_at: new Date().toISOString()
      };
      this.data.admins.push(admin);
    }

    const salt = bcrypt.genSaltSync(10);
    this.data.admin_passwords[admin.id] = bcrypt.hashSync(newPassword, salt);
    this.save();
    return admin;
  }

  public deleteAdmin(email: string): boolean {
    const cleanEmail = email.trim().toLowerCase();
    const adminIndex = this.data.admins.findIndex(a => a.email.toLowerCase() === cleanEmail);
    if (adminIndex === -1) return false;

    const admin = this.data.admins[adminIndex];
    delete this.data.admin_passwords[admin.id];
    this.data.admins.splice(adminIndex, 1);
    this.save();
    return true;
  }

  public isAuthorizedAdmin(email: string): boolean {
    if (!email) return false;
    const clean = email.trim().toLowerCase();
    const envAdmin = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    if (envAdmin && clean === envAdmin) return true;
    // Primary authorized owner account
    if (clean === 'robert0218012@gmail.com') return true;
    return this.data.admins.some(a => a.email.toLowerCase() === clean);
  }

  public createOrGetAdminUser(email: string, adminId?: string): AdminUser | null {
    const cleanEmail = email.trim().toLowerCase();
    const existing = this.getAdminByEmail(cleanEmail);
    if (existing) return existing;

    // Security Gate: Only allow if email is authorized
    if (!this.isAuthorizedAdmin(cleanEmail)) {
      return null;
    }

    const newAdmin: AdminUser = {
      id: adminId || `adm_${Date.now()}`,
      email: cleanEmail,
      created_at: new Date().toISOString()
    };
    this.data.admins.push(newAdmin);
    this.save();
    return newAdmin;
  }

  // --- TEMPLATES ---
  public deduplicateTemplates(templates: Template[]): Template[] {
    if (!Array.isArray(templates)) return [];
    const seenIds = new Set<string>();
    const seenSlugs = new Set<string>();
    const seenTitles = new Set<string>();
    const clean: Template[] = [];

    for (const t of templates) {
      if (!t || !t.id) continue;
      const idKey = t.id.trim();
      const slugKey = (t.slug || '').trim().toLowerCase();
      const titleKey = (t.title || '').trim().toLowerCase();

      if (seenIds.has(idKey)) continue;
      if (slugKey && seenSlugs.has(slugKey)) continue;
      if (titleKey && seenTitles.has(titleKey)) continue;

      seenIds.add(idKey);
      if (slugKey) seenSlugs.add(slugKey);
      if (titleKey) seenTitles.add(titleKey);
      clean.push(t);
    }
    return clean;
  }

  public cleanupDuplicates(): Template[] {
    this.data.templates = this.deduplicateTemplates(this.data.templates);
    this.save();
    return this.data.templates;
  }

  public getPublishedTemplates(): Template[] {
    this.data.templates = this.deduplicateTemplates(this.data.templates);
    // Strip private access_url for public safety
    return this.data.templates
      .filter(t => t.status === 'Published')
      .map(t => {
        const { access_url, ...safe } = t;
        return safe as Template;
      });
  }

  public getAllTemplatesAdmin(): Template[] {
    this.data.templates = this.deduplicateTemplates(this.data.templates);
    return this.data.templates;
  }

  public getTemplateBySlug(slug: string, isAdmin = false): Template | null {
    const cleanSlug = (slug || '').trim().toLowerCase();
    const template = this.data.templates.find(t => (t.slug || '').trim().toLowerCase() === cleanSlug || t.id === slug);
    if (!template) return null;

    if (!isAdmin && template.status !== 'Published') {
      return null;
    }

    if (!isAdmin) {
      const { access_url, ...safe } = template;
      return safe as Template;
    }

    return template;
  }

  public getTemplateById(id: string, isAdmin = false): Template | null {
    const template = this.data.templates.find(t => t.id === id);
    if (!template) return null;

    if (!isAdmin && template.status !== 'Published') {
      return null;
    }

    if (!isAdmin) {
      const { access_url, ...safe } = template;
      return safe as Template;
    }

    return template;
  }

  public createTemplate(templateData: Omit<Template, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Template {
    const cleanSlug = (templateData.slug || '').trim().toLowerCase();
    const cleanTitle = (templateData.title || '').trim().toLowerCase();
    const cleanId = (templateData.id || '').trim();

    // Prevent duplicate creation if a template with this ID, slug, or title already exists
    const existingIndex = this.data.templates.findIndex(t => 
      (cleanId && t.id === cleanId) || 
      (cleanSlug && (t.slug || '').trim().toLowerCase() === cleanSlug) ||
      (cleanTitle && (t.title || '').trim().toLowerCase() === cleanTitle)
    );

    const now = new Date().toISOString();

    if (existingIndex !== -1) {
      const existing = this.data.templates[existingIndex];
      const updated: Template = {
        ...existing,
        ...templateData,
        id: existing.id,
        updated_at: now
      };
      this.data.templates[existingIndex] = updated;
      this.data.templates = this.deduplicateTemplates(this.data.templates);
      this.save();
      return updated;
    }

    const id = cleanId || `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newTemplate: Template = {
      ...templateData,
      id,
      created_at: now,
      updated_at: now
    };

    this.data.templates.unshift(newTemplate);
    this.data.templates = this.deduplicateTemplates(this.data.templates);
    this.save();
    return newTemplate;
  }

  public updateTemplate(id: string, updates: Partial<Template>): Template | null {
    const index = this.data.templates.findIndex(t => t.id === id);
    if (index === -1) return null;

    const existing = this.data.templates[index];
    const updated: Template = {
      ...existing,
      ...updates,
      id: existing.id, // Immutable ID
      created_at: existing.created_at,
      updated_at: new Date().toISOString()
    };

    this.data.templates[index] = updated;
    this.data.templates = this.deduplicateTemplates(this.data.templates);
    this.save();
    return updated;
  }

  public deleteTemplate(id: string, slug?: string, title?: string): boolean {
    const cleanId = (id || '').trim();
    const cleanSlug = (slug || '').trim().toLowerCase();
    const cleanTitle = (title || '').trim().toLowerCase();

    // Find ALL matching templates in memory (including duplicate instances)
    const matched = this.data.templates.filter(t => 
      (cleanId && (t.id === cleanId || t.slug === cleanId)) ||
      (cleanSlug && (t.slug || '').trim().toLowerCase() === cleanSlug) ||
      (cleanTitle && (t.title || '').trim().toLowerCase() === cleanTitle)
    );

    // Filter out ALL instances matching this ID, slug, or title
    this.data.templates = this.data.templates.filter(t => 
      (!cleanId || (t.id !== cleanId && t.slug !== cleanId)) &&
      (!cleanSlug || (t.slug || '').trim().toLowerCase() !== cleanSlug) &&
      (!cleanTitle || (t.title || '').trim().toLowerCase() !== cleanTitle)
    );

    // Record all IDs, slugs, and titles to deleted templates file so they NEVER resurrect upon restart
    try {
      let deletedList: string[] = [];
      if (fs.existsSync(DELETED_TEMPLATES_FILE)) {
        const raw = fs.readFileSync(DELETED_TEMPLATES_FILE, 'utf-8');
        deletedList = JSON.parse(raw);
        if (!Array.isArray(deletedList)) deletedList = [];
      }
      const toRecord = [
        cleanId, 
        cleanSlug, 
        cleanTitle,
        ...matched.map(t => t.id), 
        ...matched.map(t => t.slug),
        ...matched.map(t => (t.title || '').trim().toLowerCase())
      ].filter(Boolean);

      toRecord.forEach(item => {
        if (item && !deletedList.includes(item)) {
          deletedList.push(item);
        }
      });
      fs.writeFileSync(DELETED_TEMPLATES_FILE, JSON.stringify(deletedList, null, 2), 'utf-8');
    } catch (delErr) {
      console.warn('Failed to record deleted template ID:', delErr);
    }

    this.save();
    return true;
  }

  // --- ORDERS & CHECKOUT ---
  public createPendingRazorpayOrder(payload: {
    customer_name: string;
    customer_email: string;
    user_id?: string;
    template_id: string;
    razorpay_order_id: string;
  }): Order | null {
    const template = this.data.templates.find(t => t.id === payload.template_id);
    if (!template) return null;

    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const now = new Date().toISOString();

    const newOrder: Order = {
      id: orderId,
      customer_name: payload.customer_name.trim(),
      customer_email: payload.customer_email.trim().toLowerCase(),
      user_id: payload.user_id,
      template_id: template.id,
      template_title: template.title,
      template_thumbnail: template.thumbnail_url,
      amount: template.sale_price ?? template.price,
      currency: 'INR',
      payment_status: 'Pending',
      access_status: 'Pending',
      payment_reference: payload.razorpay_order_id,
      razorpay_order_id: payload.razorpay_order_id,
      created_at: now,
      updated_at: now
    };

    this.data.orders.unshift(newOrder);
    this.save();
    return newOrder;
  }

  public getOrderByRazorpayOrderId(razorpayOrderId: string): Order | null {
    return this.data.orders.find(o => o.razorpay_order_id === razorpayOrderId) || null;
  }

  public getOrderByRazorpayPaymentId(razorpayPaymentId: string): Order | null {
    return this.data.orders.find(o => o.razorpay_payment_id === razorpayPaymentId || o.payment_reference === razorpayPaymentId) || null;
  }

  public markRazorpayOrderPaid(params: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    template_id: string;
    user_id?: string;
    customer_name?: string;
    customer_email?: string;
  }): Order | null {
    // 1. Check if already marked as paid with this payment ID (prevent duplicates)
    const existingPayment = this.getOrderByRazorpayPaymentId(params.razorpay_payment_id);
    if (existingPayment && existingPayment.payment_status === 'Paid') {
      const template = this.data.templates.find(t => t.id === existingPayment.template_id);
      if (template) existingPayment.access_url = template.access_url;
      return existingPayment;
    }

    // 2. Find pending order by razorpay_order_id
    let order = this.getOrderByRazorpayOrderId(params.razorpay_order_id);
    const template = this.data.templates.find(t => t.id === params.template_id);
    if (!template) return null;

    const now = new Date().toISOString();

    if (!order) {
      // If order wasn't saved in memory before (e.g. server restart during payment), create new paid order
      const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      order = {
        id: orderId,
        customer_name: (params.customer_name || 'Customer').trim(),
        customer_email: (params.customer_email || 'customer@example.com').trim().toLowerCase(),
        user_id: params.user_id,
        template_id: template.id,
        template_title: template.title,
        template_thumbnail: template.thumbnail_url,
        amount: template.sale_price ?? template.price,
        currency: 'INR',
        payment_status: 'Paid',
        access_status: 'Granted',
        payment_reference: params.razorpay_payment_id,
        razorpay_order_id: params.razorpay_order_id,
        razorpay_payment_id: params.razorpay_payment_id,
        created_at: now,
        updated_at: now,
        access_url: template.access_url
      };
      this.data.orders.unshift(order);
    } else {
      order.payment_status = 'Paid';
      order.access_status = 'Granted';
      order.payment_reference = params.razorpay_payment_id;
      order.razorpay_payment_id = params.razorpay_payment_id;
      if (params.user_id && !order.user_id) order.user_id = params.user_id;
      if (params.customer_name) order.customer_name = params.customer_name.trim();
      if (params.customer_email) order.customer_email = params.customer_email.trim().toLowerCase();
      order.access_url = template.access_url;
      order.updated_at = now;
    }

    this.save();
    return order;
  }

  public getUserOrders(userId: string, email?: string): Order[] {
    const cleanEmail = email?.trim().toLowerCase();
    const cleanUid = userId?.trim();

    // Collect orders from memory and permanent ledger
    const map = new Map<string, Order>();

    // Load from permanent ledger first
    try {
      if (fs.existsSync(ORDERS_PERM_FILE)) {
        const raw = fs.readFileSync(ORDERS_PERM_FILE, 'utf-8');
        const perm: Order[] = JSON.parse(raw);
        if (Array.isArray(perm)) {
          perm.forEach(o => {
            const key = o.razorpay_payment_id || o.payment_reference || o.razorpay_order_id || o.id;
            if (key) map.set(key, o);
          });
        }
      }
    } catch (e) {
      console.warn('Orders ledger read notice:', e);
    }

    // Merge in-memory orders
    this.data.orders.forEach(o => {
      const key = o.razorpay_payment_id || o.payment_reference || o.razorpay_order_id || o.id;
      if (key) map.set(key, o);
    });

    return Array.from(map.values())
      .filter(o => {
        if (o.payment_status !== 'Paid') return false;
        if (cleanUid && cleanUid !== 'guest-checkout' && o.user_id && o.user_id === cleanUid) return true;
        if (cleanEmail && o.customer_email && o.customer_email.toLowerCase() === cleanEmail) return true;
        return false;
      })
      .map(o => {
        const t = this.data.templates.find(tpl => tpl.id === o.template_id);
        return {
          ...o,
          access_url: t ? t.access_url : o.access_url
        };
      });
  }

  public getOrdersByEmail(email: string): Order[] {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return [];

    const map = new Map<string, Order>();

    // Check permanent ledger
    try {
      if (fs.existsSync(ORDERS_PERM_FILE)) {
        const raw = fs.readFileSync(ORDERS_PERM_FILE, 'utf-8');
        const perm: Order[] = JSON.parse(raw);
        if (Array.isArray(perm)) {
          perm.forEach(o => {
            const key = o.razorpay_payment_id || o.payment_reference || o.razorpay_order_id || o.id;
            if (key) map.set(key, o);
          });
        }
      }
    } catch (e) {
      console.warn('Permanent order lookup notice:', e);
    }

    this.data.orders.forEach(o => {
      const key = o.razorpay_payment_id || o.payment_reference || o.razorpay_order_id || o.id;
      if (key) map.set(key, o);
    });

    return Array.from(map.values())
      .filter(o => {
        if (o.payment_status !== 'Paid') return false;
        return o.customer_email && o.customer_email.toLowerCase() === cleanEmail;
      })
      .map(o => {
        const t = this.data.templates.find(tpl => tpl.id === o.template_id);
        return {
          ...o,
          access_url: t ? t.access_url : o.access_url
        };
      });
  }

  public clearUserOrders(userId?: string, email?: string): number {
    const cleanEmail = email?.trim().toLowerCase();
    const cleanUid = userId?.trim();
    const initialLen = this.data.orders.length;
    this.data.orders = this.data.orders.filter(o => {
      if (cleanUid && cleanUid !== 'guest-checkout' && o.user_id && o.user_id === cleanUid) return false;
      if (cleanEmail && o.customer_email?.toLowerCase() === cleanEmail) return false;
      return true;
    });
    if (this.data.orders.length !== initialLen) {
      this.save();
    }
    return initialLen - this.data.orders.length;
  }

  public createOrder(payload: {
    customer_name: string;
    customer_email: string;
    template_id: string;
    payment_reference?: string;
    user_id?: string;
  }): Order | null {
    const template = this.data.templates.find(t => t.id === payload.template_id);
    if (!template) return null;

    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const now = new Date().toISOString();

    const newOrder: Order = {
      id: orderId,
      customer_name: payload.customer_name.trim(),
      customer_email: payload.customer_email.trim().toLowerCase(),
      user_id: payload.user_id,
      template_id: template.id,
      template_title: template.title,
      template_thumbnail: template.thumbnail_url,
      amount: template.sale_price ?? template.price,
      currency: 'INR',
      payment_status: 'Paid', // Verified server-side upon checkout
      access_status: 'Granted',
      payment_reference: payload.payment_reference || `PAY-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      created_at: now,
      updated_at: now,
      access_url: template.access_url
    };

    this.data.orders.unshift(newOrder);
    this.save();
    return newOrder;
  }

  public getOrderById(orderId: string): Order | null {
    const order = this.data.orders.find(o => o.id === orderId);
    if (!order) return null;

    // Attach current access URL if payment is Paid
    if (order.payment_status === 'Paid') {
      const template = this.data.templates.find(t => t.id === order.template_id);
      if (template) {
        order.access_url = template.access_url;
      }
    } else {
      order.access_url = undefined;
    }

    return order;
  }

  public getAllOrders(): Order[] {
    return this.data.orders;
  }

  public updateOrderStatus(orderId: string, payment_status: PaymentStatus, access_status?: AccessStatus): Order | null {
    const order = this.data.orders.find(o => o.id === orderId);
    if (!order) return null;

    order.payment_status = payment_status;
    if (access_status) {
      order.access_status = access_status;
    } else if (payment_status === 'Paid') {
      order.access_status = 'Granted';
    } else if (payment_status === 'Refunded' || payment_status === 'Failed') {
      order.access_status = 'Revoked';
    }

    order.updated_at = new Date().toISOString();
    this.save();
    return order;
  }

  public deleteOrder(orderId: string): boolean {
    const cleanId = (orderId || '').trim();
    if (!cleanId) return false;
    const index = this.data.orders.findIndex(o => 
      o.id === cleanId || 
      o.id.toLowerCase() === cleanId.toLowerCase() ||
      (o.razorpay_order_id && o.razorpay_order_id.trim() === cleanId) ||
      (o.razorpay_payment_id && o.razorpay_payment_id.trim() === cleanId) ||
      (o.payment_reference && o.payment_reference.trim() === cleanId)
    );
    if (index === -1) return false;
    this.data.orders.splice(index, 1);
    this.save();
    return true;
  }

  public restoreSampleTemplate(): Template {
    // Remove from deleted list if restoring
    try {
      if (fs.existsSync(DELETED_TEMPLATES_FILE)) {
        const raw = fs.readFileSync(DELETED_TEMPLATES_FILE, 'utf-8');
        let deletedList: string[] = JSON.parse(raw);
        if (Array.isArray(deletedList)) {
          deletedList = deletedList.filter(id => id !== INITIAL_TEMPLATE.id);
          fs.writeFileSync(DELETED_TEMPLATES_FILE, JSON.stringify(deletedList, null, 2), 'utf-8');
        }
      }
    } catch (e) {
      console.warn('Error clearing INITIAL_TEMPLATE from deleted list:', e);
    }

    const existing = this.data.templates.find(t => t.id === INITIAL_TEMPLATE.id);
    if (!existing) {
      this.data.templates.push(INITIAL_TEMPLATE);
      this.save();
      return INITIAL_TEMPLATE;
    }
    return existing;
  }

  // --- STATS ---
  public clearTestData(clearAllOrders: boolean = false): void {
    if (clearAllOrders) {
      this.data.orders = [];
    } else {
      this.data.orders = this.data.orders.filter(o => {
        const isTestEmail = o.customer_email.toLowerCase().includes('example.com') || 
                            o.customer_email.toLowerCase().includes('test') ||
                            o.customer_email.toLowerCase() === 'rahul@gmail.com';
        const isTestRef = (o.payment_reference || '').startsWith('test_') || 
                          (o.payment_reference || '').startsWith('demo_') ||
                          (o.payment_reference || '').startsWith('pay_test_') ||
                          (o.payment_reference || '').includes('test_device');
        const isZeroAmount = o.amount === 0;
        const isHardcodedTestOrder = o.id === 'ord_1788770661911_PMXY';
        return !(isTestEmail || isTestRef || isZeroAmount || isHardcodedTestOrder);
      });
    }
    this.data.messages = [];
    this.save();
  }

  public getDashboardStats(): AdminDashboardStats {
    const paidOrders = this.data.orders.filter(o => o.payment_status === 'Paid');
    const total_sales = paidOrders.reduce((sum, o) => sum + o.amount, 0);
    const total_orders = this.data.orders.length;
    const total_templates = this.data.templates.length;
    const published_templates = this.data.templates.filter(t => t.status === 'Published').length;
    const recent_orders = this.data.orders.slice(0, 10);

    return {
      total_sales,
      total_orders,
      total_templates,
      published_templates,
      recent_orders
    };
  }

  // --- CONTACT MESSAGES ---
  public createContactMessage(payload: {
    name: string;
    email: string;
    category: string;
    order_id?: string;
    subject?: string;
    message: string;
    synced_to_sheet?: boolean;
    sheet_sync_error?: string;
  }): ContactMessage {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const ticket_id = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();

    const newMessage: ContactMessage = {
      id,
      ticket_id,
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      category: payload.category.trim(),
      order_id: payload.order_id?.trim() || undefined,
      subject: payload.subject?.trim() || undefined,
      message: payload.message.trim(),
      created_at: now,
      synced_to_sheet: !!payload.synced_to_sheet,
      sheet_sync_error: payload.sheet_sync_error
    };

    if (!this.data.messages) {
      this.data.messages = [];
    }

    this.data.messages.unshift(newMessage);
    this.save();
    return newMessage;
  }

  public getAllContactMessages(): ContactMessage[] {
    return this.data.messages || [];
  }

  public updateContactMessageSync(id: string, synced: boolean, error?: string): void {
    if (!this.data.messages) return;
    const msg = this.data.messages.find(m => m.id === id);
    if (msg) {
      msg.synced_to_sheet = synced;
      msg.sheet_sync_error = error;
      this.save();
    }
  }

  public deleteContactMessage(id: string): boolean {
    if (!this.data.messages) return false;
    const initialLen = this.data.messages.length;
    this.data.messages = this.data.messages.filter(m => m.id !== id);
    if (this.data.messages.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- SETTINGS ---
  public getSettings(): AppSettings {
    return this.data.settings || {};
  }

  public updateSettings(settings: Partial<AppSettings>): AppSettings {
    const sanitizedSettings: Partial<AppSettings> = {};
    if (typeof settings.google_sheet_webhook_url === 'string') {
      sanitizedSettings.google_sheet_webhook_url = settings.google_sheet_webhook_url.trim();
    }
    if (typeof settings.google_sheet_orders_webhook_url === 'string') {
      sanitizedSettings.google_sheet_orders_webhook_url = settings.google_sheet_orders_webhook_url.trim();
    }
    if (typeof settings.google_sheet_inquiry_webhook_url === 'string') {
      sanitizedSettings.google_sheet_inquiry_webhook_url = settings.google_sheet_inquiry_webhook_url.trim();
    }

    this.data.settings = {
      ...(this.data.settings || {}),
      ...sanitizedSettings
    };

    // Strip any legacy razorpay keys from database file for security
    delete (this.data.settings as any).razorpay_key_id;
    delete (this.data.settings as any).razorpay_key_secret;
    delete (this.data.settings as any).razorpay_webhook_secret;

    this.save();
    return this.data.settings;
  }

  public getRazorpayCredentials(): {
    key_id: string;
    key_secret: string;
    webhook_secret: string;
    mode: 'live' | 'test' | 'unconfigured';
    is_configured: boolean;
    is_live: boolean;
  } {
    // Only read from environment variables for maximum security (no DB / UI exposure)
    const key_id = process.env.RAZORPAY_KEY_ID?.trim() || '';
    const key_secret = process.env.RAZORPAY_KEY_SECRET?.trim() || '';
    const webhook_secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || '';

    const is_live = key_id.startsWith('rzp_live_');
    const is_test = key_id.startsWith('rzp_test_');
    const mode: 'live' | 'test' | 'unconfigured' = is_live
      ? 'live'
      : is_test
      ? 'test'
      : 'unconfigured';

    return {
      key_id,
      key_secret,
      webhook_secret,
      mode,
      is_configured: !!(key_id && key_secret),
      is_live
    };
  }
}

export const db = new Database();
