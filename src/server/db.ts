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

export function getEnvAdmins(): Array<{ id: string; email: string; password: string }> {
  const result: Array<{ id: string; email: string; password: string }> = [];
  const rawEmails = (process.env.ADMIN_EMAIL || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  const rawPasswords = (process.env.ADMIN_PASSWORD || '')
    .split(',')
    .map(p => p.trim())
    .filter(Boolean);

  rawEmails.forEach((email, idx) => {
    const password = rawPasswords[idx] || rawPasswords[0] || '';
    if (email && password && !result.some(a => a.email === email)) {
      result.push({
        id: `adm_${result.length + 1}`,
        email,
        password
      });
    }
  });

  // Also support numbered variables: ADMIN_EMAIL_2 / ADMIN_PASSWORD_2 ... up to 20
  for (let i = 2; i <= 20; i++) {
    const email = (process.env[`ADMIN_EMAIL_${i}`] || '').trim().toLowerCase();
    const password = (process.env[`ADMIN_PASSWORD_${i}`] || rawPasswords[0] || '').trim();
    if (email && password && !result.some(a => a.email === email)) {
      result.push({
        id: `adm_${result.length + 1}`,
        email,
        password
      });
    }
  }

  return result;
}

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

    const envAdmins = getEnvAdmins();

    // Default Seed Data if file missing or corrupt
    if (!baseData) {
      baseData = {
        admins: [],
        admin_passwords: {},
        templates: [],
        orders: [],
        messages: [],
        settings: {}
      };
    }

    if (!Array.isArray(baseData.admins)) baseData.admins = [];
    if (!baseData.admin_passwords) baseData.admin_passwords = {};

    // Always sync all configured ADMIN_EMAIL / ADMIN_PASSWORD entries into database
    if (envAdmins.length > 0) {
      const envEmailsSet = new Set(envAdmins.map(a => a.email));
      // Remove old default adm_1 if not in envAdmins
      baseData.admins = baseData.admins.filter(a => a.id !== 'adm_1' || envEmailsSet.has(a.email.toLowerCase()));

      for (const envAdmin of envAdmins) {
        let existingAdmin = baseData.admins.find(a => a.email.toLowerCase() === envAdmin.email);
        if (!existingAdmin) {
          existingAdmin = {
            id: envAdmin.id,
            email: envAdmin.email,
            created_at: new Date().toISOString()
          };
          baseData.admins.push(existingAdmin);
        }
        const currentHash = baseData.admin_passwords[existingAdmin.id];
        if (!currentHash || !bcrypt.compareSync(envAdmin.password, currentHash)) {
          baseData.admin_passwords[existingAdmin.id] = bcrypt.hashSync(envAdmin.password, 10);
        }
      }
    } else if (baseData.admins.length === 0) {
      console.warn('[Security Warning] ADMIN_EMAIL or ADMIN_PASSWORD environment variable is not set. Default admin initialization skipped and login blocked until configured.');
    }

    if (!baseData.messages) baseData.messages = [];
    if (!baseData.settings) baseData.settings = {};
    delete (baseData.settings as any).google_sheet_webhook_url;
    delete (baseData.settings as any).google_sheet_orders_webhook_url;
    delete (baseData.settings as any).google_sheet_inquiry_webhook_url;
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

    // Permanent Orders Sync: Merge any real orders from orders_permanent.json
    try {
      if (fs.existsSync(ORDERS_PERM_FILE)) {
        const ordRaw = fs.readFileSync(ORDERS_PERM_FILE, 'utf-8');
        const permOrders: Order[] = JSON.parse(ordRaw);
        if (Array.isArray(permOrders)) {
          for (const po of permOrders) {
            // Never re-inject dummy/test seed orders
            const isDummy = po.customer_email?.toLowerCase().includes('example.com') ||
                            po.id === 'ord_1789890533083_HLFD' ||
                            po.id === 'ord_1789888694728_8MUL' ||
                            po.id === 'ord_1788770661911_PMXY';
            if (isDummy) continue;

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
    const cleanEmail = (email || '').trim().toLowerCase();
    const envAdmins = getEnvAdmins();

    if (envAdmins.length === 0 && !(process.env.ADMIN_PASSWORD || '').trim()) {
      console.warn('[Security Warning] ADMIN_PASSWORD is not set in environment variables. Admin login is blocked until ADMIN_PASSWORD is configured.');
      return null;
    }

    const matchedEnvAdmin = envAdmins.find(a => a.email === cleanEmail && a.password === password);
    let admin = this.data.admins.find(a => a.email.toLowerCase() === cleanEmail);

    if (matchedEnvAdmin) {
      if (!admin) {
        return this.setAdminPassword(cleanEmail, matchedEnvAdmin.password);
      }
      return admin;
    }

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
    const envAdmins = getEnvAdmins();
    if (envAdmins.some(a => a.email === clean)) return true;
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
    customer_phone?: string;
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

  // --- STATS ---
  public clearTestData(clearAllOrders: boolean = false): void {
    if (clearAllOrders) {
      this.data.orders = [];
    } else {
      this.data.orders = this.data.orders.filter(o => {
        const isTestEmail = o.customer_email.toLowerCase().includes('example.com') || 
                            o.customer_email.toLowerCase().includes('test');
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
      created_at: now
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
    this.data.settings = {
      ...(this.data.settings || {}),
      ...(settings as AppSettings)
    };
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
