var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_config = require("dotenv/config");
var import_express = __toESM(require("express"), 1);
var import_node_path2 = __toESM(require("node:path"), 1);
var import_node_fs2 = __toESM(require("node:fs"), 1);
var import_node_crypto = __toESM(require("node:crypto"), 1);
var import_vite = require("vite");

// src/server/pgDb.ts
var import_pg = __toESM(require("pg"), 1);
var import_bcryptjs2 = __toESM(require("bcryptjs"), 1);

// src/server/db.ts
var import_node_fs = __toESM(require("node:fs"), 1);
var import_node_path = __toESM(require("node:path"), 1);
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var DATA_DIR = process.env.DATA_DIR || import_node_path.default.join(process.cwd(), "data");
var DB_FILE = import_node_path.default.join(DATA_DIR, "store.json");
var TEMPLATES_PERM_FILE = import_node_path.default.join(DATA_DIR, "templates_permanent.json");
var DELETED_TEMPLATES_FILE = import_node_path.default.join(DATA_DIR, "deleted_templates.json");
var ORDERS_PERM_FILE = import_node_path.default.join(DATA_DIR, "orders_permanent.json");
if (!import_node_fs.default.existsSync(DATA_DIR)) {
  import_node_fs.default.mkdirSync(DATA_DIR, { recursive: true });
}
var INITIAL_TEMPLATE = {
  id: "tpl_master_budget",
  title: "Master Budget & Wealth Planner",
  slug: "master-budget-wealth-planner",
  description: "A comprehensive, automated Google Sheets system to track personal income, expenses, savings, investments, and net worth with interactive visual dashboards.",
  category: "Finance",
  price: 499,
  original_price: 1499,
  sale_price: 499,
  thumbnail_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80",
  demo_url: "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/preview",
  access_url: "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/copy",
  features: [
    "Automated Net Worth & Cashflow visual dashboards",
    "Smart category breakdown with 50/30/20 budget allocation",
    "Multi-currency & custom monthly expense loggers",
    "Debt snowball & savings goal milestone trackers",
    "Zero formulas or complex math required \u2014 100% plug & play"
  ],
  included_items: [
    "Master Google Sheets Template (instant copy to your Google Drive)",
    "Quick Start Step-by-Step PDF & Video Guide",
    "Lifetime access & all future template updates",
    "Direct customer support via email"
  ],
  faq: [
    {
      question: "What do I receive after purchase?",
      answer: "Immediately after checkout, you get instant one-click access to copy the full Google Sheets template directly into your personal Google Drive account."
    },
    {
      question: "Can I edit and customize the template?",
      answer: "Yes! Once copied to your Google Drive, the spreadsheet is 100% yours. You can change colors, add custom categories, adjust rows, and modify formulas freely."
    },
    {
      question: "Do I need special software or subscriptions?",
      answer: "No paid software is required. You only need a standard, free Google account and a web browser or Google Sheets app on your phone, tablet, or computer."
    },
    {
      question: "How quickly will I receive access?",
      answer: "Instantly! The access link appears immediately on your order confirmation screen and is also sent directly to your provided email address."
    },
    {
      question: "What is your refund policy?",
      answer: "Due to the instant delivery nature of digital Google Sheets, access is immediate upon checkout. If you encounter any technical issue or broken formula that our support team cannot resolve within 24 hours, or in case of duplicate billing, you are eligible for a 100% full refund."
    }
  ],
  status: "Published",
  created_at: (/* @__PURE__ */ new Date()).toISOString(),
  updated_at: (/* @__PURE__ */ new Date()).toISOString(),
  images: [
    "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1543286386-713bdd548da4?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200&auto=format&fit=crop&q=80"
  ],
  sheet_preview: {
    sheetName: "Master Budget & Wealth Dashboard 2026",
    tabs: ["\u{1F4CA} Dashboard", "\u{1F4B5} Monthly Budget", "\u{1F4B3} Expense Log", "\u{1F4C8} Net Worth", "\u{1F3AF} Goals"],
    kpis: [
      { label: "Total Monthly Income", value: "\u20B984,500.00", change: "+12.4%", isPositive: true, color: "#22C55E" },
      { label: "Total Expenses", value: "\u20B938,200.00", change: "-4.2%", isPositive: true, color: "#6D5DFB" },
      { label: "Net Monthly Savings", value: "\u20B946,300.00", change: "+18.1%", isPositive: true, color: "#22C55E" },
      { label: "Savings Rate", value: "54.8%", change: "Optimal", isPositive: true, color: "#38BDF8" }
    ],
    headers: ["Date", "Category", "Description", "Planned", "Actual", "Variance", "Status"],
    rows: [
      { cells: ["Sep 01", "Housing", "Monthly Rent / Mortgage", "\u20B915,000", "\u20B915,000", "\u20B90", "Paid"] },
      { cells: ["Sep 03", "Consulting Income", "Client Retainer Q3", "\u20B945,000", "\u20B945,000", "\u20B90", "Received"] },
      { cells: ["Sep 05", "Groceries", "Organic Produce & Market", "\u20B94,500", "\u20B94,100", "+\u20B9400", "Under Budget"] },
      { cells: ["Sep 08", "Software", "Cloud & Productivity Tools", "\u20B91,200", "\u20B91,200", "\u20B90", "Paid"] },
      { cells: ["Sep 12", "Investments", "Index Funds & Equities", "\u20B920,000", "\u20B920,000", "\u20B90", "Executed"] }
    ],
    chartType: "donut",
    chartData: [
      { label: "Housing", value: 39, color: "#6D5DFB" },
      { label: "Investments", value: 35, color: "#22C55E" },
      { label: "Living & Food", value: 16, color: "#38BDF8" },
      { label: "Savings", value: 10, color: "#F59E0B" }
    ]
  }
};
var Database = class {
  constructor() {
    this.data = this.loadData();
  }
  loadData() {
    let baseData = null;
    try {
      if (import_node_fs.default.existsSync(DB_FILE)) {
        const raw = import_node_fs.default.readFileSync(DB_FILE, "utf-8");
        baseData = JSON.parse(raw);
      }
    } catch (e) {
      console.error("Error reading database file:", e);
    }
    if (!baseData) {
      const defaultAdminId = "adm_1";
      const defaultAdmin = {
        id: defaultAdminId,
        email: "admin@onetaplink.com",
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      baseData = {
        admins: [defaultAdmin],
        admin_passwords: {
          [defaultAdminId]: import_bcryptjs.default.hashSync("admin12345", 10)
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
    const deletedIds = /* @__PURE__ */ new Set();
    try {
      if (import_node_fs.default.existsSync(DELETED_TEMPLATES_FILE)) {
        const delRaw = import_node_fs.default.readFileSync(DELETED_TEMPLATES_FILE, "utf-8");
        const delArr = JSON.parse(delRaw);
        if (Array.isArray(delArr)) {
          delArr.forEach((id) => {
            if (typeof id === "string") {
              deletedIds.add(id);
              deletedIds.add(id.toLowerCase());
            }
          });
        }
      }
    } catch (delErr) {
      console.warn("Deleted templates read notice:", delErr);
    }
    if (deletedIds.size > 0) {
      baseData.templates = baseData.templates.filter((t) => {
        const idMatch = deletedIds.has(t.id);
        const slugMatch = t.slug && (deletedIds.has(t.slug) || deletedIds.has(t.slug.toLowerCase()));
        const titleMatch = t.title && deletedIds.has(t.title.trim().toLowerCase());
        return !idMatch && !slugMatch && !titleMatch;
      });
    }
    baseData.templates = this.deduplicateTemplates(baseData.templates);
    try {
      if (import_node_fs.default.existsSync(TEMPLATES_PERM_FILE)) {
        const permRaw = import_node_fs.default.readFileSync(TEMPLATES_PERM_FILE, "utf-8");
        const permTemplates = JSON.parse(permRaw);
        if (Array.isArray(permTemplates)) {
          for (const pt of permTemplates) {
            if (!pt || !pt.id) continue;
            const ptSlug = (pt.slug || "").trim().toLowerCase();
            const ptTitle = (pt.title || "").trim().toLowerCase();
            if (deletedIds.has(pt.id) || ptSlug && deletedIds.has(ptSlug) || ptTitle && deletedIds.has(ptTitle)) {
              continue;
            }
            if (pt.id === INITIAL_TEMPLATE.id && baseData.templates.length > 0 && !baseData.templates.some((t) => t.id === INITIAL_TEMPLATE.id)) {
              continue;
            }
            const exists = baseData.templates.some(
              (t) => t.id === pt.id || ptSlug && (t.slug || "").trim().toLowerCase() === ptSlug || ptTitle && (t.title || "").trim().toLowerCase() === ptTitle
            );
            if (!exists) {
              baseData.templates.push(pt);
            }
          }
        }
      }
    } catch (permErr) {
      console.warn("Permanent templates read notice:", permErr);
    }
    baseData.templates = this.deduplicateTemplates(baseData.templates);
    if (process.env.TEMPLATES_JSON) {
      try {
        const envTemplates = JSON.parse(process.env.TEMPLATES_JSON);
        if (Array.isArray(envTemplates) && envTemplates.length > 0) {
          baseData.templates = this.deduplicateTemplates(envTemplates);
        }
      } catch (envErr) {
        console.warn("Failed to parse TEMPLATES_JSON environment variable:", envErr);
      }
    }
    try {
      if (import_node_fs.default.existsSync(ORDERS_PERM_FILE)) {
        const ordRaw = import_node_fs.default.readFileSync(ORDERS_PERM_FILE, "utf-8");
        const permOrders = JSON.parse(ordRaw);
        if (Array.isArray(permOrders)) {
          for (const po of permOrders) {
            const isDummy = po.customer_email?.toLowerCase().includes("example.com") || po.id === "ord_1789890533083_HLFD" || po.id === "ord_1789888694728_8MUL" || po.id === "ord_1788770661911_PMXY";
            if (isDummy) continue;
            const exists = baseData.orders.some(
              (o) => o.id === po.id || po.razorpay_payment_id && o.razorpay_payment_id === po.razorpay_payment_id || po.payment_reference && o.payment_reference === po.payment_reference
            );
            if (!exists) {
              baseData.orders.push(po);
            }
          }
        }
      }
    } catch (ordErr) {
      console.warn("Permanent orders read notice:", ordErr);
    }
    if (baseData.templates.length === 0 && !deletedIds.has(INITIAL_TEMPLATE.id) && !process.env.TEMPLATES_JSON) {
      baseData.templates = [INITIAL_TEMPLATE];
    }
    this.saveDataDirect(baseData);
    this.syncPermanentFiles(baseData);
    return baseData;
  }
  saveDataDirect(data) {
    try {
      import_node_fs.default.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("Error writing database file:", e);
    }
  }
  syncPermanentFiles(data) {
    const current = data || this.data;
    try {
      if (current.templates) {
        import_node_fs.default.writeFileSync(TEMPLATES_PERM_FILE, JSON.stringify(current.templates, null, 2), "utf-8");
      }
      if (current.orders) {
        import_node_fs.default.writeFileSync(ORDERS_PERM_FILE, JSON.stringify(current.orders, null, 2), "utf-8");
      }
    } catch (e) {
      console.error("Error syncing permanent ledger files:", e);
    }
  }
  save() {
    this.saveDataDirect(this.data);
    this.syncPermanentFiles();
  }
  // --- ADMIN AUTH ---
  verifyAdmin(email, password) {
    const admin = this.data.admins.find((a) => a.email.toLowerCase() === email.toLowerCase());
    if (!admin) return null;
    const hash = this.data.admin_passwords[admin.id];
    if (!hash) return null;
    const match = import_bcryptjs.default.compareSync(password, hash);
    return match ? admin : null;
  }
  getAdminById(id) {
    return this.data.admins.find((a) => a.id === id) || null;
  }
  getAdminByEmail(email) {
    return this.data.admins.find((a) => a.email.toLowerCase() === email.toLowerCase()) || null;
  }
  setAdminPassword(email, newPassword) {
    const cleanEmail = email.trim().toLowerCase();
    let admin = this.getAdminByEmail(cleanEmail);
    if (!admin) {
      admin = {
        id: `adm_${Date.now()}`,
        email: cleanEmail,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      this.data.admins.push(admin);
    }
    const salt = import_bcryptjs.default.genSaltSync(10);
    this.data.admin_passwords[admin.id] = import_bcryptjs.default.hashSync(newPassword, salt);
    this.save();
    return admin;
  }
  deleteAdmin(email) {
    const cleanEmail = email.trim().toLowerCase();
    const adminIndex = this.data.admins.findIndex((a) => a.email.toLowerCase() === cleanEmail);
    if (adminIndex === -1) return false;
    const admin = this.data.admins[adminIndex];
    delete this.data.admin_passwords[admin.id];
    this.data.admins.splice(adminIndex, 1);
    this.save();
    return true;
  }
  isAuthorizedAdmin(email) {
    if (!email) return false;
    const clean = email.trim().toLowerCase();
    const envAdmin = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    if (envAdmin && clean === envAdmin) return true;
    if (clean === "robert0218012@gmail.com") return true;
    return this.data.admins.some((a) => a.email.toLowerCase() === clean);
  }
  createOrGetAdminUser(email, adminId) {
    const cleanEmail = email.trim().toLowerCase();
    const existing = this.getAdminByEmail(cleanEmail);
    if (existing) return existing;
    if (!this.isAuthorizedAdmin(cleanEmail)) {
      return null;
    }
    const newAdmin = {
      id: adminId || `adm_${Date.now()}`,
      email: cleanEmail,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.admins.push(newAdmin);
    this.save();
    return newAdmin;
  }
  // --- TEMPLATES ---
  deduplicateTemplates(templates) {
    if (!Array.isArray(templates)) return [];
    const seenIds = /* @__PURE__ */ new Set();
    const seenSlugs = /* @__PURE__ */ new Set();
    const seenTitles = /* @__PURE__ */ new Set();
    const clean = [];
    for (const t of templates) {
      if (!t || !t.id) continue;
      const idKey = t.id.trim();
      const slugKey = (t.slug || "").trim().toLowerCase();
      const titleKey = (t.title || "").trim().toLowerCase();
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
  cleanupDuplicates() {
    this.data.templates = this.deduplicateTemplates(this.data.templates);
    this.save();
    return this.data.templates;
  }
  getPublishedTemplates() {
    this.data.templates = this.deduplicateTemplates(this.data.templates);
    return this.data.templates.filter((t) => t.status === "Published").map((t) => {
      const { access_url, ...safe } = t;
      return safe;
    });
  }
  getAllTemplatesAdmin() {
    this.data.templates = this.deduplicateTemplates(this.data.templates);
    return this.data.templates;
  }
  getTemplateBySlug(slug, isAdmin = false) {
    const cleanSlug = (slug || "").trim().toLowerCase();
    const template = this.data.templates.find((t) => (t.slug || "").trim().toLowerCase() === cleanSlug || t.id === slug);
    if (!template) return null;
    if (!isAdmin && template.status !== "Published") {
      return null;
    }
    if (!isAdmin) {
      const { access_url, ...safe } = template;
      return safe;
    }
    return template;
  }
  getTemplateById(id, isAdmin = false) {
    const template = this.data.templates.find((t) => t.id === id);
    if (!template) return null;
    if (!isAdmin && template.status !== "Published") {
      return null;
    }
    if (!isAdmin) {
      const { access_url, ...safe } = template;
      return safe;
    }
    return template;
  }
  createTemplate(templateData) {
    const cleanSlug = (templateData.slug || "").trim().toLowerCase();
    const cleanTitle = (templateData.title || "").trim().toLowerCase();
    const cleanId = (templateData.id || "").trim();
    const existingIndex = this.data.templates.findIndex(
      (t) => cleanId && t.id === cleanId || cleanSlug && (t.slug || "").trim().toLowerCase() === cleanSlug || cleanTitle && (t.title || "").trim().toLowerCase() === cleanTitle
    );
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (existingIndex !== -1) {
      const existing = this.data.templates[existingIndex];
      const updated = {
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
    const newTemplate = {
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
  updateTemplate(id, updates) {
    const index = this.data.templates.findIndex((t) => t.id === id);
    if (index === -1) return null;
    const existing = this.data.templates[index];
    const updated = {
      ...existing,
      ...updates,
      id: existing.id,
      // Immutable ID
      created_at: existing.created_at,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.templates[index] = updated;
    this.data.templates = this.deduplicateTemplates(this.data.templates);
    this.save();
    return updated;
  }
  deleteTemplate(id, slug, title) {
    const cleanId = (id || "").trim();
    const cleanSlug = (slug || "").trim().toLowerCase();
    const cleanTitle = (title || "").trim().toLowerCase();
    const matched = this.data.templates.filter(
      (t) => cleanId && (t.id === cleanId || t.slug === cleanId) || cleanSlug && (t.slug || "").trim().toLowerCase() === cleanSlug || cleanTitle && (t.title || "").trim().toLowerCase() === cleanTitle
    );
    this.data.templates = this.data.templates.filter(
      (t) => (!cleanId || t.id !== cleanId && t.slug !== cleanId) && (!cleanSlug || (t.slug || "").trim().toLowerCase() !== cleanSlug) && (!cleanTitle || (t.title || "").trim().toLowerCase() !== cleanTitle)
    );
    try {
      let deletedList = [];
      if (import_node_fs.default.existsSync(DELETED_TEMPLATES_FILE)) {
        const raw = import_node_fs.default.readFileSync(DELETED_TEMPLATES_FILE, "utf-8");
        deletedList = JSON.parse(raw);
        if (!Array.isArray(deletedList)) deletedList = [];
      }
      const toRecord = [
        cleanId,
        cleanSlug,
        cleanTitle,
        ...matched.map((t) => t.id),
        ...matched.map((t) => t.slug),
        ...matched.map((t) => (t.title || "").trim().toLowerCase())
      ].filter(Boolean);
      toRecord.forEach((item) => {
        if (item && !deletedList.includes(item)) {
          deletedList.push(item);
        }
      });
      import_node_fs.default.writeFileSync(DELETED_TEMPLATES_FILE, JSON.stringify(deletedList, null, 2), "utf-8");
    } catch (delErr) {
      console.warn("Failed to record deleted template ID:", delErr);
    }
    this.save();
    return true;
  }
  // --- ORDERS & CHECKOUT ---
  createPendingRazorpayOrder(payload) {
    const template = this.data.templates.find((t) => t.id === payload.template_id);
    if (!template) return null;
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newOrder = {
      id: orderId,
      customer_name: payload.customer_name.trim(),
      customer_email: payload.customer_email.trim().toLowerCase(),
      user_id: payload.user_id,
      template_id: template.id,
      template_title: template.title,
      template_thumbnail: template.thumbnail_url,
      amount: template.sale_price ?? template.price,
      currency: "INR",
      payment_status: "Pending",
      access_status: "Pending",
      payment_reference: payload.razorpay_order_id,
      razorpay_order_id: payload.razorpay_order_id,
      created_at: now,
      updated_at: now
    };
    this.data.orders.unshift(newOrder);
    this.save();
    return newOrder;
  }
  getOrderByRazorpayOrderId(razorpayOrderId) {
    return this.data.orders.find((o) => o.razorpay_order_id === razorpayOrderId) || null;
  }
  getOrderByRazorpayPaymentId(razorpayPaymentId) {
    return this.data.orders.find((o) => o.razorpay_payment_id === razorpayPaymentId || o.payment_reference === razorpayPaymentId) || null;
  }
  markRazorpayOrderPaid(params) {
    const existingPayment = this.getOrderByRazorpayPaymentId(params.razorpay_payment_id);
    if (existingPayment && existingPayment.payment_status === "Paid") {
      const template2 = this.data.templates.find((t) => t.id === existingPayment.template_id);
      if (template2) existingPayment.access_url = template2.access_url;
      return existingPayment;
    }
    let order = this.getOrderByRazorpayOrderId(params.razorpay_order_id);
    const template = this.data.templates.find((t) => t.id === params.template_id);
    if (!template) return null;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (!order) {
      const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      order = {
        id: orderId,
        customer_name: (params.customer_name || "Customer").trim(),
        customer_email: (params.customer_email || "customer@example.com").trim().toLowerCase(),
        user_id: params.user_id,
        template_id: template.id,
        template_title: template.title,
        template_thumbnail: template.thumbnail_url,
        amount: template.sale_price ?? template.price,
        currency: "INR",
        payment_status: "Paid",
        access_status: "Granted",
        payment_reference: params.razorpay_payment_id,
        razorpay_order_id: params.razorpay_order_id,
        razorpay_payment_id: params.razorpay_payment_id,
        created_at: now,
        updated_at: now,
        access_url: template.access_url
      };
      this.data.orders.unshift(order);
    } else {
      order.payment_status = "Paid";
      order.access_status = "Granted";
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
  getUserOrders(userId, email) {
    const cleanEmail = email?.trim().toLowerCase();
    const cleanUid = userId?.trim();
    const map = /* @__PURE__ */ new Map();
    try {
      if (import_node_fs.default.existsSync(ORDERS_PERM_FILE)) {
        const raw = import_node_fs.default.readFileSync(ORDERS_PERM_FILE, "utf-8");
        const perm = JSON.parse(raw);
        if (Array.isArray(perm)) {
          perm.forEach((o) => {
            const key = o.razorpay_payment_id || o.payment_reference || o.razorpay_order_id || o.id;
            if (key) map.set(key, o);
          });
        }
      }
    } catch (e) {
      console.warn("Orders ledger read notice:", e);
    }
    this.data.orders.forEach((o) => {
      const key = o.razorpay_payment_id || o.payment_reference || o.razorpay_order_id || o.id;
      if (key) map.set(key, o);
    });
    return Array.from(map.values()).filter((o) => {
      if (o.payment_status !== "Paid") return false;
      if (cleanUid && cleanUid !== "guest-checkout" && o.user_id && o.user_id === cleanUid) return true;
      if (cleanEmail && o.customer_email && o.customer_email.toLowerCase() === cleanEmail) return true;
      return false;
    }).map((o) => {
      const t = this.data.templates.find((tpl) => tpl.id === o.template_id);
      return {
        ...o,
        access_url: t ? t.access_url : o.access_url
      };
    });
  }
  getOrdersByEmail(email) {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return [];
    const map = /* @__PURE__ */ new Map();
    try {
      if (import_node_fs.default.existsSync(ORDERS_PERM_FILE)) {
        const raw = import_node_fs.default.readFileSync(ORDERS_PERM_FILE, "utf-8");
        const perm = JSON.parse(raw);
        if (Array.isArray(perm)) {
          perm.forEach((o) => {
            const key = o.razorpay_payment_id || o.payment_reference || o.razorpay_order_id || o.id;
            if (key) map.set(key, o);
          });
        }
      }
    } catch (e) {
      console.warn("Permanent order lookup notice:", e);
    }
    this.data.orders.forEach((o) => {
      const key = o.razorpay_payment_id || o.payment_reference || o.razorpay_order_id || o.id;
      if (key) map.set(key, o);
    });
    return Array.from(map.values()).filter((o) => {
      if (o.payment_status !== "Paid") return false;
      return o.customer_email && o.customer_email.toLowerCase() === cleanEmail;
    }).map((o) => {
      const t = this.data.templates.find((tpl) => tpl.id === o.template_id);
      return {
        ...o,
        access_url: t ? t.access_url : o.access_url
      };
    });
  }
  clearUserOrders(userId, email) {
    const cleanEmail = email?.trim().toLowerCase();
    const cleanUid = userId?.trim();
    const initialLen = this.data.orders.length;
    this.data.orders = this.data.orders.filter((o) => {
      if (cleanUid && cleanUid !== "guest-checkout" && o.user_id && o.user_id === cleanUid) return false;
      if (cleanEmail && o.customer_email?.toLowerCase() === cleanEmail) return false;
      return true;
    });
    if (this.data.orders.length !== initialLen) {
      this.save();
    }
    return initialLen - this.data.orders.length;
  }
  createOrder(payload) {
    const template = this.data.templates.find((t) => t.id === payload.template_id);
    if (!template) return null;
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newOrder = {
      id: orderId,
      customer_name: payload.customer_name.trim(),
      customer_email: payload.customer_email.trim().toLowerCase(),
      user_id: payload.user_id,
      template_id: template.id,
      template_title: template.title,
      template_thumbnail: template.thumbnail_url,
      amount: template.sale_price ?? template.price,
      currency: "INR",
      payment_status: "Paid",
      // Verified server-side upon checkout
      access_status: "Granted",
      payment_reference: payload.payment_reference || `PAY-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      created_at: now,
      updated_at: now,
      access_url: template.access_url
    };
    this.data.orders.unshift(newOrder);
    this.save();
    return newOrder;
  }
  getOrderById(orderId) {
    const order = this.data.orders.find((o) => o.id === orderId);
    if (!order) return null;
    if (order.payment_status === "Paid") {
      const template = this.data.templates.find((t) => t.id === order.template_id);
      if (template) {
        order.access_url = template.access_url;
      }
    } else {
      order.access_url = void 0;
    }
    return order;
  }
  getAllOrders() {
    return this.data.orders;
  }
  updateOrderStatus(orderId, payment_status, access_status) {
    const order = this.data.orders.find((o) => o.id === orderId);
    if (!order) return null;
    order.payment_status = payment_status;
    if (access_status) {
      order.access_status = access_status;
    } else if (payment_status === "Paid") {
      order.access_status = "Granted";
    } else if (payment_status === "Refunded" || payment_status === "Failed") {
      order.access_status = "Revoked";
    }
    order.updated_at = (/* @__PURE__ */ new Date()).toISOString();
    this.save();
    return order;
  }
  deleteOrder(orderId) {
    const cleanId = (orderId || "").trim();
    if (!cleanId) return false;
    const index = this.data.orders.findIndex(
      (o) => o.id === cleanId || o.id.toLowerCase() === cleanId.toLowerCase() || o.razorpay_order_id && o.razorpay_order_id.trim() === cleanId || o.razorpay_payment_id && o.razorpay_payment_id.trim() === cleanId || o.payment_reference && o.payment_reference.trim() === cleanId
    );
    if (index === -1) return false;
    this.data.orders.splice(index, 1);
    this.save();
    return true;
  }
  restoreSampleTemplate() {
    try {
      if (import_node_fs.default.existsSync(DELETED_TEMPLATES_FILE)) {
        const raw = import_node_fs.default.readFileSync(DELETED_TEMPLATES_FILE, "utf-8");
        let deletedList = JSON.parse(raw);
        if (Array.isArray(deletedList)) {
          deletedList = deletedList.filter((id) => id !== INITIAL_TEMPLATE.id);
          import_node_fs.default.writeFileSync(DELETED_TEMPLATES_FILE, JSON.stringify(deletedList, null, 2), "utf-8");
        }
      }
    } catch (e) {
      console.warn("Error clearing INITIAL_TEMPLATE from deleted list:", e);
    }
    const existing = this.data.templates.find((t) => t.id === INITIAL_TEMPLATE.id);
    if (!existing) {
      this.data.templates.push(INITIAL_TEMPLATE);
      this.save();
      return INITIAL_TEMPLATE;
    }
    return existing;
  }
  // --- STATS ---
  clearTestData(clearAllOrders = false) {
    if (clearAllOrders) {
      this.data.orders = [];
    } else {
      this.data.orders = this.data.orders.filter((o) => {
        const isTestEmail = o.customer_email.toLowerCase().includes("example.com") || o.customer_email.toLowerCase().includes("test") || o.customer_email.toLowerCase() === "rahul@gmail.com";
        const isTestRef = (o.payment_reference || "").startsWith("test_") || (o.payment_reference || "").startsWith("demo_") || (o.payment_reference || "").startsWith("pay_test_") || (o.payment_reference || "").includes("test_device");
        const isZeroAmount = o.amount === 0;
        const isHardcodedTestOrder = o.id === "ord_1788770661911_PMXY";
        return !(isTestEmail || isTestRef || isZeroAmount || isHardcodedTestOrder);
      });
    }
    this.data.messages = [];
    this.save();
  }
  getDashboardStats() {
    const paidOrders = this.data.orders.filter((o) => o.payment_status === "Paid");
    const total_sales = paidOrders.reduce((sum, o) => sum + o.amount, 0);
    const total_orders = this.data.orders.length;
    const total_templates = this.data.templates.length;
    const published_templates = this.data.templates.filter((t) => t.status === "Published").length;
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
  createContactMessage(payload) {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const ticket_id = `TKT-${Math.floor(1e5 + Math.random() * 9e5)}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newMessage = {
      id,
      ticket_id,
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      category: payload.category.trim(),
      order_id: payload.order_id?.trim() || void 0,
      subject: payload.subject?.trim() || void 0,
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
  getAllContactMessages() {
    return this.data.messages || [];
  }
  updateContactMessageSync(id, synced, error) {
    if (!this.data.messages) return;
    const msg = this.data.messages.find((m) => m.id === id);
    if (msg) {
      msg.synced_to_sheet = synced;
      msg.sheet_sync_error = error;
      this.save();
    }
  }
  deleteContactMessage(id) {
    if (!this.data.messages) return false;
    const initialLen = this.data.messages.length;
    this.data.messages = this.data.messages.filter((m) => m.id !== id);
    if (this.data.messages.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }
  // --- SETTINGS ---
  getSettings() {
    return this.data.settings || {};
  }
  updateSettings(settings) {
    const sanitizedSettings = {};
    if (typeof settings.google_sheet_webhook_url === "string") {
      sanitizedSettings.google_sheet_webhook_url = settings.google_sheet_webhook_url.trim();
    }
    if (typeof settings.google_sheet_orders_webhook_url === "string") {
      sanitizedSettings.google_sheet_orders_webhook_url = settings.google_sheet_orders_webhook_url.trim();
    }
    if (typeof settings.google_sheet_inquiry_webhook_url === "string") {
      sanitizedSettings.google_sheet_inquiry_webhook_url = settings.google_sheet_inquiry_webhook_url.trim();
    }
    this.data.settings = {
      ...this.data.settings || {},
      ...sanitizedSettings
    };
    delete this.data.settings.razorpay_key_id;
    delete this.data.settings.razorpay_key_secret;
    delete this.data.settings.razorpay_webhook_secret;
    this.save();
    return this.data.settings;
  }
  getRazorpayCredentials() {
    const key_id = process.env.RAZORPAY_KEY_ID?.trim() || "";
    const key_secret = process.env.RAZORPAY_KEY_SECRET?.trim() || "";
    const webhook_secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || "";
    const is_live = key_id.startsWith("rzp_live_");
    const is_test = key_id.startsWith("rzp_test_");
    const mode = is_live ? "live" : is_test ? "test" : "unconfigured";
    return {
      key_id,
      key_secret,
      webhook_secret,
      mode,
      is_configured: !!(key_id && key_secret),
      is_live
    };
  }
};
var db = new Database();

// src/server/pgDb.ts
var { Pool } = import_pg.default;
var DatabaseService = class {
  constructor() {
    this.pool = null;
    this.isPostgres = false;
    this.isInitialized = false;
    this.localOtpResets = /* @__PURE__ */ new Map();
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl && dbUrl.trim().length > 0) {
      try {
        const isLocalhost = dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1");
        this.pool = new Pool({
          connectionString: dbUrl,
          ssl: isLocalhost ? false : { rejectUnauthorized: false },
          max: 10,
          idleTimeoutMillis: 3e4,
          connectionTimeoutMillis: 1e4
        });
        this.pool.on("error", (err) => {
          console.error("[PostgreSQL Pool Error (Handled)]", err?.message || err);
        });
        this.isPostgres = true;
        console.log("[PostgreSQL] Database pool created with DATABASE_URL.");
      } catch (err) {
        console.error("[PostgreSQL] Failed to initialize connection pool, falling back to local storage:", err);
        this.pool = null;
        this.isPostgres = false;
      }
    } else {
      console.log("[PostgreSQL] No DATABASE_URL provided. Running with local fallback store.");
      this.isPostgres = false;
    }
  }
  async initialize() {
    if (this.isInitialized) return;
    if (!this.pool || !this.isPostgres) {
      this.isInitialized = true;
      return;
    }
    try {
      const client = await this.pool.connect();
      try {
        console.log("[PostgreSQL] Connected successfully. Initializing tables...");
        await client.query(`
          CREATE TABLE IF NOT EXISTS admins (
            id VARCHAR(255) PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `);
        await client.query(`
          CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(255) PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(255),
            password_hash VARCHAR(255),
            phone VARCHAR(50),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `);
        await client.query(`
          ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
        `).catch(() => {
        });
        await client.query(`
          CREATE TABLE IF NOT EXISTS templates (
            id VARCHAR(255) PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            description TEXT,
            category VARCHAR(100),
            price NUMERIC(10, 2) NOT NULL,
            original_price NUMERIC(10, 2),
            sale_price NUMERIC(10, 2),
            thumbnail_url TEXT,
            demo_url TEXT,
            access_url TEXT,
            features JSONB DEFAULT '[]'::jsonb,
            included_items JSONB DEFAULT '[]'::jsonb,
            faq JSONB DEFAULT '[]'::jsonb,
            images JSONB DEFAULT '[]'::jsonb,
            sheet_preview JSONB,
            status VARCHAR(50) DEFAULT 'Published',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `);
        await client.query(`
          CREATE TABLE IF NOT EXISTS orders (
            id VARCHAR(255) PRIMARY KEY,
            customer_name VARCHAR(255),
            customer_email VARCHAR(255) NOT NULL,
            user_id VARCHAR(255),
            template_id VARCHAR(255),
            template_title VARCHAR(255),
            template_thumbnail TEXT,
            amount NUMERIC(10, 2) NOT NULL,
            currency VARCHAR(10) DEFAULT 'INR',
            payment_status VARCHAR(50) DEFAULT 'Pending',
            access_status VARCHAR(50) DEFAULT 'Pending',
            payment_reference VARCHAR(255),
            payment_gateway VARCHAR(50) DEFAULT 'razorpay',
            customer_phone VARCHAR(50),
            instamojo_payment_request_id VARCHAR(255),
            instamojo_payment_id VARCHAR(255),
            razorpay_order_id VARCHAR(255),
            razorpay_payment_id VARCHAR(255),
            access_url TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `);
        await client.query(`
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(50) DEFAULT 'razorpay';
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255);
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(255);
          ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
          CREATE INDEX IF NOT EXISTS idx_orders_cust_email ON orders(customer_email);
          CREATE INDEX IF NOT EXISTS idx_orders_rzp_order ON orders(razorpay_order_id);
          CREATE INDEX IF NOT EXISTS idx_orders_rzp_pay ON orders(razorpay_payment_id);
        `);
        await client.query(`
          CREATE TABLE IF NOT EXISTS messages (
            id VARCHAR(255) PRIMARY KEY,
            ticket_id VARCHAR(100),
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            category VARCHAR(100),
            order_id VARCHAR(255),
            subject VARCHAR(255),
            message TEXT NOT NULL,
            status VARCHAR(50) DEFAULT 'New',
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
        `);
        await client.query(`
          CREATE TABLE IF NOT EXISTS settings (
            key VARCHAR(255) PRIMARY KEY,
            value JSONB,
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `);
        await client.query(`
          CREATE TABLE IF NOT EXISTS password_resets (
            id VARCHAR(255) PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            otp_code VARCHAR(10) NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_pwd_resets_email ON password_resets(email);
        `);
        await this.seedInitialData(client);
        console.log("[PostgreSQL] Database tables initialized and verified.");
      } finally {
        client.release();
      }
      this.isInitialized = true;
    } catch (error) {
      console.error("[PostgreSQL] Initialization error, falling back to local store:", error);
      this.isPostgres = false;
      this.isInitialized = true;
    }
  }
  async seedInitialData(client) {
    try {
      const adminCountRes = await client.query("SELECT COUNT(*) FROM admins");
      if (parseInt(adminCountRes.rows[0].count, 10) === 0) {
        const storeAdmins = db.data?.admins || [];
        for (const admin of storeAdmins) {
          const passHash = db.data?.admin_passwords?.[admin.id];
          if (passHash) {
            await client.query(
              `INSERT INTO admins (id, email, password_hash, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (email) DO NOTHING`,
              [admin.id, admin.email.toLowerCase(), passHash, admin.created_at || (/* @__PURE__ */ new Date()).toISOString(), (/* @__PURE__ */ new Date()).toISOString()]
            );
          }
        }
        console.log("[PostgreSQL] Seeded initial admins.");
      }
      const templateCountRes = await client.query("SELECT COUNT(*) FROM templates");
      if (parseInt(templateCountRes.rows[0].count, 10) === 0) {
        const storeTemplates = db.getAllTemplatesAdmin();
        for (const t of storeTemplates) {
          await client.query(
            `INSERT INTO templates (
              id, title, slug, description, category, price, original_price, sale_price,
              thumbnail_url, demo_url, access_url, features, included_items, faq, images,
              sheet_preview, status, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            ON CONFLICT (id) DO NOTHING`,
            [
              t.id,
              t.title,
              t.slug,
              t.description || "",
              t.category || "Finance",
              t.price || 0,
              t.original_price || null,
              t.sale_price || null,
              t.thumbnail_url || "",
              t.demo_url || null,
              t.access_url || "",
              JSON.stringify(t.features || []),
              JSON.stringify(t.included_items || []),
              JSON.stringify(t.faq || []),
              JSON.stringify(t.images || []),
              t.sheet_preview ? JSON.stringify(t.sheet_preview) : null,
              t.status || "Published",
              t.created_at || (/* @__PURE__ */ new Date()).toISOString(),
              t.updated_at || (/* @__PURE__ */ new Date()).toISOString()
            ]
          );
        }
        console.log("[PostgreSQL] Seeded initial templates.");
      }
    } catch (seedErr) {
      console.warn("[PostgreSQL] Seeding warning:", seedErr);
    }
  }
  // ==========================================
  // CUSTOMER AUTHENTICATION (POSTGRESQL)
  // ==========================================
  async createUser(data) {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanName = data.name.trim();
    const cleanPhone = (data.phone || "").trim();
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const passwordHash = data.password ? import_bcryptjs2.default.hashSync(data.password.trim(), 10) : null;
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query(
        `INSERT INTO users (id, email, name, password_hash, phone, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, email, name, phone, created_at`,
        [id, cleanEmail, cleanName, passwordHash, cleanPhone || null, now, now]
      );
      const row = res.rows[0];
      return {
        id: row.id,
        uid: row.id,
        email: row.email,
        displayName: row.name || "",
        name: row.name || "",
        phone: row.phone || "",
        created_at: row.created_at
      };
    }
    return {
      id,
      uid: id,
      email: cleanEmail,
      displayName: cleanName,
      name: cleanName,
      phone: cleanPhone,
      created_at: now
    };
  }
  async verifyUser(email, password) {
    const cleanEmail = email.trim().toLowerCase();
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query(
        "SELECT id, email, name, phone, password_hash, created_at FROM users WHERE LOWER(email) = $1",
        [cleanEmail]
      );
      if (res.rows.length === 0) return null;
      const user = res.rows[0];
      if (!user.password_hash) return null;
      const isMatch = import_bcryptjs2.default.compareSync(password, user.password_hash);
      if (!isMatch) return null;
      return {
        id: user.id,
        uid: user.id,
        email: user.email,
        displayName: user.name || "",
        name: user.name || "",
        phone: user.phone || "",
        created_at: user.created_at
      };
    }
    return null;
  }
  async getUserByEmail(email) {
    const cleanEmail = email.trim().toLowerCase();
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query(
        "SELECT id, email, name, phone, created_at FROM users WHERE LOWER(email) = $1",
        [cleanEmail]
      );
      if (res.rows.length === 0) return null;
      const user = res.rows[0];
      return {
        id: user.id,
        uid: user.id,
        email: user.email,
        displayName: user.name || "",
        name: user.name || "",
        phone: user.phone || "",
        created_at: user.created_at
      };
    }
    return null;
  }
  async getUserById(id) {
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query(
        "SELECT id, email, name, phone, created_at FROM users WHERE id = $1",
        [id]
      );
      if (res.rows.length === 0) return null;
      const user = res.rows[0];
      return {
        id: user.id,
        uid: user.id,
        email: user.email,
        displayName: user.name || "",
        name: user.name || "",
        phone: user.phone || "",
        created_at: user.created_at
      };
    }
    return null;
  }
  // ==========================================
  // ADMIN AUTHENTICATION (POSTGRESQL)
  // ==========================================
  async verifyAdmin(email, password) {
    const cleanEmail = email.trim().toLowerCase();
    const envAdminPass = process.env.ADMIN_PASSWORD?.trim();
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query(
        "SELECT id, email, password_hash, created_at FROM admins WHERE LOWER(email) = $1",
        [cleanEmail]
      );
      if (res.rows.length === 0) {
        if (envAdminPass && password === envAdminPass) {
          return this.setAdminPassword(cleanEmail, password);
        }
        return db.verifyAdmin(cleanEmail, password);
      }
      const admin = res.rows[0];
      const isEnvMatch = !!(envAdminPass && password === envAdminPass);
      const isHashMatch = admin.password_hash ? import_bcryptjs2.default.compareSync(password, admin.password_hash) : false;
      if (!isHashMatch && !isEnvMatch) return null;
      if (isEnvMatch && !isHashMatch) {
        await this.setAdminPassword(cleanEmail, password);
      }
      return {
        id: admin.id,
        email: admin.email,
        created_at: admin.created_at
      };
    }
    return db.verifyAdmin(cleanEmail, password);
  }
  async setAdminPassword(email, newPassword) {
    const cleanEmail = email.trim().toLowerCase();
    const id = `adm_${Date.now()}`;
    const salt = import_bcryptjs2.default.genSaltSync(10);
    const hash = import_bcryptjs2.default.hashSync(newPassword, salt);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (this.isPostgres && this.pool) {
      await this.pool.query(
        `INSERT INTO admins (id, email, password_hash, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE SET password_hash = $3, updated_at = $5`,
        [id, cleanEmail, hash, now, now]
      );
      const res = await this.pool.query("SELECT id, email, created_at FROM admins WHERE LOWER(email) = $1", [cleanEmail]);
      const row = res.rows[0];
      db.setAdminPassword(cleanEmail, newPassword);
      return {
        id: row.id,
        email: row.email,
        created_at: row.created_at
      };
    }
    return db.setAdminPassword(cleanEmail, newPassword);
  }
  async deleteAdmin(email) {
    const cleanEmail = email.trim().toLowerCase();
    if (this.isPostgres && this.pool) {
      await this.pool.query("DELETE FROM admins WHERE LOWER(email) = $1", [cleanEmail]);
    }
    return db.deleteAdmin(cleanEmail);
  }
  async getAdminById(id) {
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query("SELECT id, email, created_at FROM admins WHERE id = $1", [id]);
      if (res.rows.length > 0) {
        return {
          id: res.rows[0].id,
          email: res.rows[0].email,
          created_at: res.rows[0].created_at
        };
      }
    }
    return db.getAdminById(id);
  }
  async getAdminByEmail(email) {
    const cleanEmail = email.trim().toLowerCase();
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query("SELECT id, email, created_at FROM admins WHERE LOWER(email) = $1", [cleanEmail]);
      if (res.rows.length > 0) {
        return {
          id: res.rows[0].id,
          email: res.rows[0].email,
          created_at: res.rows[0].created_at
        };
      }
    }
    return null;
  }
  async hasAdmins() {
    if (this.isPostgres && this.pool) {
      try {
        const res = await this.pool.query("SELECT COUNT(*) FROM admins");
        return parseInt(res.rows[0].count, 10) > 0;
      } catch (err) {
        console.error("[PostgreSQL] Error checking admins count:", err);
      }
    }
    const storeAdmins = db.data?.admins || [];
    return storeAdmins.length > 0;
  }
  // ==========================================
  // TEMPLATES MANAGEMENT (POSTGRESQL)
  // ==========================================
  async getPublishedTemplates() {
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query(
        `SELECT id, title, slug, description, category, price, original_price, sale_price,
                thumbnail_url, demo_url, features, included_items, faq, images, sheet_preview,
                status, created_at, updated_at
         FROM templates
         WHERE status = 'Published'
         ORDER BY created_at DESC`
      );
      return res.rows.map(this.mapTemplateRow);
    }
    return db.getPublishedTemplates();
  }
  async getAllTemplates() {
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query(
        `SELECT * FROM templates ORDER BY created_at DESC`
      );
      return res.rows.map(this.mapTemplateRow);
    }
    return db.getAllTemplatesAdmin();
  }
  async getTemplateById(id, includeAccessUrl = false) {
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query("SELECT * FROM templates WHERE id = $1", [id]);
      if (res.rows.length === 0) return null;
      const t = this.mapTemplateRow(res.rows[0]);
      if (!includeAccessUrl && t.status !== "Published") return null;
      if (!includeAccessUrl) {
        const { access_url, ...safe } = t;
        return safe;
      }
      return t;
    }
    return db.getTemplateById(id, includeAccessUrl);
  }
  async getTemplateBySlug(slug, includeAccessUrl = false) {
    const cleanSlug = slug.trim().toLowerCase();
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query("SELECT * FROM templates WHERE LOWER(slug) = $1", [cleanSlug]);
      if (res.rows.length === 0) return null;
      const t = this.mapTemplateRow(res.rows[0]);
      if (!includeAccessUrl && t.status !== "Published") return null;
      if (!includeAccessUrl) {
        const { access_url, ...safe } = t;
        return safe;
      }
      return t;
    }
    return db.getTemplateBySlug(cleanSlug, includeAccessUrl);
  }
  async createTemplate(data) {
    const id = data.id?.trim() || `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (this.isPostgres && this.pool) {
      await this.pool.query(
        `INSERT INTO templates (
          id, title, slug, description, category, price, original_price, sale_price,
          thumbnail_url, demo_url, access_url, features, included_items, faq, images,
          sheet_preview, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          slug = EXCLUDED.slug,
          description = EXCLUDED.description,
          category = EXCLUDED.category,
          price = EXCLUDED.price,
          original_price = EXCLUDED.original_price,
          sale_price = EXCLUDED.sale_price,
          thumbnail_url = EXCLUDED.thumbnail_url,
          demo_url = EXCLUDED.demo_url,
          access_url = EXCLUDED.access_url,
          features = EXCLUDED.features,
          included_items = EXCLUDED.included_items,
          faq = EXCLUDED.faq,
          images = EXCLUDED.images,
          sheet_preview = EXCLUDED.sheet_preview,
          status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at`,
        [
          id,
          data.title,
          data.slug,
          data.description || "",
          data.category || "Finance",
          data.price || 0,
          data.original_price || null,
          data.sale_price || null,
          data.thumbnail_url || "",
          data.demo_url || null,
          data.access_url || "",
          JSON.stringify(data.features || []),
          JSON.stringify(data.included_items || []),
          JSON.stringify(data.faq || []),
          JSON.stringify(data.images || []),
          data.sheet_preview ? JSON.stringify(data.sheet_preview) : null,
          data.status || "Published",
          now,
          now
        ]
      );
      db.createTemplate(data);
      const res = await this.getTemplateById(id, true);
      return res;
    }
    return db.createTemplate(data);
  }
  async updateTemplate(id, updates) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (this.isPostgres && this.pool) {
      const current = await this.getTemplateById(id, true);
      if (!current) return null;
      const merged = { ...current, ...updates, updated_at: now };
      await this.pool.query(
        `UPDATE templates SET
          title = $1,
          slug = $2,
          description = $3,
          category = $4,
          price = $5,
          original_price = $6,
          sale_price = $7,
          thumbnail_url = $8,
          demo_url = $9,
          access_url = $10,
          features = $11,
          included_items = $12,
          faq = $13,
          images = $14,
          sheet_preview = $15,
          status = $16,
          updated_at = $17
        WHERE id = $18`,
        [
          merged.title,
          merged.slug,
          merged.description || "",
          merged.category || "Finance",
          merged.price || 0,
          merged.original_price || null,
          merged.sale_price || null,
          merged.thumbnail_url || "",
          merged.demo_url || null,
          merged.access_url || "",
          JSON.stringify(merged.features || []),
          JSON.stringify(merged.included_items || []),
          JSON.stringify(merged.faq || []),
          JSON.stringify(merged.images || []),
          merged.sheet_preview ? JSON.stringify(merged.sheet_preview) : null,
          merged.status || "Published",
          now,
          id
        ]
      );
      db.updateTemplate(id, updates);
      return await this.getTemplateById(id, true);
    }
    return db.updateTemplate(id, updates);
  }
  async deleteTemplate(id, slug, title) {
    const cleanId = (id || "").trim();
    const cleanSlug = (slug || "").trim().toLowerCase();
    const cleanTitle = (title || "").trim().toLowerCase();
    if (this.isPostgres && this.pool) {
      await this.pool.query(
        `DELETE FROM templates WHERE id = $1 OR LOWER(slug) = $2 OR LOWER(title) = $3`,
        [cleanId, cleanSlug || cleanId, cleanTitle || cleanId]
      );
    }
    return db.deleteTemplate(id, slug, title);
  }
  async cleanupDuplicateTemplates() {
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query(`
        DELETE FROM templates a
        USING templates b
        WHERE a.id < b.id 
          AND (LOWER(a.slug) = LOWER(b.slug) OR LOWER(a.title) = LOWER(b.title))
      `);
      return res.rowCount || 0;
    }
    return db.cleanupDuplicates().length;
  }
  // ==========================================
  // ORDERS & PURCHASES (RAZORPAY & POSTGRESQL)
  // ==========================================
  getRazorpayCredentials() {
    const keyId = (process.env.RAZORPAY_KEY_ID || "").trim();
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
    const isTestMode = process.env.RAZORPAY_TEST_MODE !== "false";
    const isConfigured = Boolean(
      keyId && keySecret && !keyId.includes("placeholder") && !keySecret.includes("placeholder")
    );
    return {
      key_id: keyId,
      key_secret: keySecret,
      is_configured: isConfigured,
      test_mode: isTestMode,
      mode: !isConfigured ? "simulation" : isTestMode ? "test" : "live"
    };
  }
  /**
   * Retrieves previous customer details (Name, Email, Mobile No) from past orders or user profile
   * so returning customers never have to type their mobile number or details again.
   */
  async getLastCustomerCheckoutDetails(userId, email) {
    const cleanEmail = email?.trim().toLowerCase();
    const cleanUid = userId?.trim();
    if (!cleanEmail && (!cleanUid || cleanUid === "guest-checkout")) return null;
    if (this.isPostgres && this.pool) {
      const orderRes = await this.pool.query(
        `SELECT customer_name, customer_email, customer_phone 
         FROM orders 
         WHERE (user_id = $1 OR LOWER(customer_email) = $2)
           AND customer_phone IS NOT NULL 
           AND TRIM(customer_phone) != ''
         ORDER BY created_at DESC 
         LIMIT 1`,
        [cleanUid && cleanUid !== "guest-checkout" ? cleanUid : null, cleanEmail || null]
      );
      if (orderRes.rows.length > 0) {
        const row = orderRes.rows[0];
        return {
          name: row.customer_name || void 0,
          email: row.customer_email || cleanEmail,
          phone: row.customer_phone || void 0
        };
      }
      const userRes = await this.pool.query(
        `SELECT name, email, phone FROM users WHERE (id = $1 OR LOWER(email) = $2) LIMIT 1`,
        [cleanUid && cleanUid !== "guest-checkout" ? cleanUid : null, cleanEmail || null]
      );
      if (userRes.rows.length > 0) {
        const row = userRes.rows[0];
        return {
          name: row.name || void 0,
          email: row.email || cleanEmail,
          phone: row.phone || void 0
        };
      }
      return null;
    }
    const allOrders = db.getAllOrders();
    const matchedOrders = allOrders.filter((o) => {
      const matchUid = cleanUid && cleanUid !== "guest-checkout" && o.user_id === cleanUid;
      const matchEmail = cleanEmail && o.customer_email?.toLowerCase() === cleanEmail;
      return (matchUid || matchEmail) && o.customer_phone && String(o.customer_phone).trim() !== "";
    });
    if (matchedOrders.length > 0) {
      matchedOrders.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      const latest = matchedOrders[0];
      return {
        name: latest.customer_name,
        email: latest.customer_email || cleanEmail,
        phone: latest.customer_phone
      };
    }
    return null;
  }
  async createPendingRazorpayOrder(payload) {
    const template = await this.getTemplateById(payload.template_id, true);
    if (!template) return null;
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const amount = template.sale_price ?? template.price;
    const newOrder = {
      id: orderId,
      customer_name: payload.customer_name.trim(),
      customer_email: payload.customer_email.trim().toLowerCase(),
      user_id: payload.user_id || void 0,
      template_id: template.id,
      template_title: template.title,
      template_thumbnail: template.thumbnail_url,
      amount,
      currency: "INR",
      payment_status: "Pending",
      access_status: "Pending",
      payment_reference: payload.razorpay_order_id,
      razorpay_order_id: payload.razorpay_order_id,
      created_at: now,
      updated_at: now
    };
    if (this.isPostgres && this.pool) {
      await this.pool.query(
        `INSERT INTO orders (
          id, customer_name, customer_email, user_id, template_id, template_title,
          template_thumbnail, amount, currency, payment_status, access_status,
          payment_reference, razorpay_order_id, razorpay_payment_id, access_url,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (id) DO NOTHING`,
        [
          newOrder.id,
          newOrder.customer_name,
          newOrder.customer_email,
          newOrder.user_id || null,
          newOrder.template_id,
          newOrder.template_title || "",
          newOrder.template_thumbnail || "",
          newOrder.amount,
          newOrder.currency,
          newOrder.payment_status,
          newOrder.access_status,
          newOrder.payment_reference,
          newOrder.razorpay_order_id,
          null,
          null,
          now,
          now
        ]
      );
    }
    db.createPendingRazorpayOrder(payload);
    return newOrder;
  }
  async markRazorpayOrderPaid(params) {
    const template = await this.getTemplateById(params.template_id, true);
    if (!template) return null;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (this.isPostgres && this.pool) {
      const existingPayRes = await this.pool.query(
        `SELECT * FROM orders WHERE razorpay_payment_id = $1 OR payment_reference = $1`,
        [params.razorpay_payment_id]
      );
      if (existingPayRes.rows.length > 0 && existingPayRes.rows[0].payment_status === "Paid") {
        const row = existingPayRes.rows[0];
        row.access_url = template.access_url;
        return this.mapOrderRow(row);
      }
      const pendingRes = await this.pool.query(
        `SELECT * FROM orders WHERE razorpay_order_id = $1 LIMIT 1`,
        [params.razorpay_order_id]
      );
      let orderId;
      if (pendingRes.rows.length > 0) {
        orderId = pendingRes.rows[0].id;
        await this.pool.query(
          `UPDATE orders SET
            payment_status = 'Paid',
            access_status = 'Granted',
            payment_reference = $1,
            razorpay_payment_id = $1,
            user_id = COALESCE(user_id, $2),
            customer_name = COALESCE($3, customer_name),
            customer_email = COALESCE($4, customer_email),
            access_url = $5,
            updated_at = $6
          WHERE id = $7`,
          [
            params.razorpay_payment_id,
            params.user_id || null,
            params.customer_name?.trim() || null,
            params.customer_email?.trim().toLowerCase() || null,
            template.access_url,
            now,
            orderId
          ]
        );
      } else {
        orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        await this.pool.query(
          `INSERT INTO orders (
            id, customer_name, customer_email, user_id, template_id, template_title,
            template_thumbnail, amount, currency, payment_status, access_status,
            payment_reference, razorpay_order_id, razorpay_payment_id, access_url,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
          [
            orderId,
            (params.customer_name || "Customer").trim(),
            (params.customer_email || "customer@example.com").trim().toLowerCase(),
            params.user_id || null,
            template.id,
            template.title,
            template.thumbnail_url,
            template.sale_price ?? template.price,
            "INR",
            "Paid",
            "Granted",
            params.razorpay_payment_id,
            params.razorpay_order_id,
            params.razorpay_payment_id,
            template.access_url,
            now,
            now
          ]
        );
      }
      db.markRazorpayOrderPaid(params);
      const finalRes = await this.pool.query("SELECT * FROM orders WHERE id = $1", [orderId]);
      return this.mapOrderRow(finalRes.rows[0]);
    }
    return db.markRazorpayOrderPaid(params);
  }
  /**
   * Authoritative lookup of user purchases with strict deduplication
   */
  async getUserOrders(userId, email) {
    const cleanEmail = email?.trim().toLowerCase();
    const cleanUid = userId?.trim();
    if (this.isPostgres && this.pool) {
      let query = `SELECT * FROM orders WHERE payment_status = 'Paid' AND (`;
      const params = [];
      if (cleanUid && cleanUid !== "guest-checkout" && cleanEmail) {
        query += `user_id = $1 OR LOWER(customer_email) = $2)`;
        params.push(cleanUid, cleanEmail);
      } else if (cleanUid && cleanUid !== "guest-checkout") {
        query += `user_id = $1)`;
        params.push(cleanUid);
      } else if (cleanEmail) {
        query += `LOWER(customer_email) = $1)`;
        params.push(cleanEmail);
      } else {
        return [];
      }
      query += ` ORDER BY created_at DESC`;
      const res = await this.pool.query(query, params);
      const orders = res.rows.map(this.mapOrderRow);
      for (const ord of orders) {
        const tmpl = await this.getTemplateById(ord.template_id, true);
        if (tmpl) {
          ord.access_url = tmpl.access_url;
          ord.template_title = tmpl.title;
          ord.template_thumbnail = tmpl.thumbnail_url;
        }
      }
      return this.deduplicateOrders(orders);
    }
    const fallback = db.getUserOrders(cleanUid || "guest-checkout", cleanEmail);
    return this.deduplicateOrders(fallback);
  }
  async getAllOrders() {
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query("SELECT * FROM orders ORDER BY created_at DESC");
      return res.rows.map(this.mapOrderRow);
    }
    return db.getAllOrders();
  }
  async getOrderById(id) {
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query(
        "SELECT * FROM orders WHERE id = $1 OR instamojo_payment_request_id = $1 OR instamojo_payment_id = $1 OR razorpay_order_id = $1 OR payment_reference = $1 LIMIT 1",
        [id]
      );
      if (res.rows.length === 0) return null;
      return this.mapOrderRow(res.rows[0]);
    }
    return db.getOrderById(id);
  }
  async updateOrderStatus(id, paymentStatus, accessStatus) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (this.isPostgres && this.pool) {
      await this.pool.query(
        `UPDATE orders SET payment_status = $1, access_status = COALESCE($2, access_status), updated_at = $3 WHERE id = $4`,
        [paymentStatus, accessStatus || null, now, id]
      );
      db.updateOrderStatus(id, paymentStatus, accessStatus);
      return await this.getOrderById(id);
    }
    return db.updateOrderStatus(id, paymentStatus, accessStatus);
  }
  async deleteOrder(id) {
    if (this.isPostgres && this.pool) {
      await this.pool.query("DELETE FROM orders WHERE id = $1", [id]);
    }
    return db.deleteOrder(id);
  }
  async clearAllOrders() {
    if (this.isPostgres && this.pool) {
      await this.pool.query("DELETE FROM orders");
    }
    db.clearTestData(true);
    return true;
  }
  // Deduplicate orders so no user ever sees duplicate purchases
  deduplicateOrders(orders) {
    const seenPaymentIds = /* @__PURE__ */ new Set();
    const seenOrderIds = /* @__PURE__ */ new Set();
    const seenProductIds = /* @__PURE__ */ new Set();
    const seenInternalIds = /* @__PURE__ */ new Set();
    const uniqueOrders = [];
    for (const ord of orders) {
      const mojoPayId = (ord.instamojo_payment_id || "").trim();
      const mojoReqId = (ord.instamojo_payment_request_id || "").trim();
      const rzpPayId = (ord.razorpay_payment_id || "").trim();
      const rzpOrderId = (ord.razorpay_order_id || "").trim();
      const refId = (ord.payment_reference || "").trim();
      const ordId = (ord.id || "").trim();
      const prodId = (ord.template_id || "").trim();
      if (mojoPayId && seenPaymentIds.has(mojoPayId)) continue;
      if (mojoReqId && seenPaymentIds.has(mojoReqId)) continue;
      if (rzpPayId && seenPaymentIds.has(rzpPayId)) continue;
      if (rzpOrderId && seenOrderIds.has(rzpOrderId)) continue;
      if (refId && seenPaymentIds.has(refId)) continue;
      if (ordId && seenInternalIds.has(ordId)) continue;
      if (prodId && seenProductIds.has(prodId)) continue;
      if (mojoPayId) seenPaymentIds.add(mojoPayId);
      if (mojoReqId) seenPaymentIds.add(mojoReqId);
      if (rzpPayId) seenPaymentIds.add(rzpPayId);
      if (rzpOrderId) seenOrderIds.add(rzpOrderId);
      if (refId) seenPaymentIds.add(refId);
      if (ordId) seenInternalIds.add(ordId);
      if (prodId) seenProductIds.add(prodId);
      uniqueOrders.push(ord);
    }
    return uniqueOrders;
  }
  // ==========================================
  // MESSAGES / CONTACT INQUIRIES (POSTGRESQL)
  // ==========================================
  async createMessage(payload) {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const ticketId = `OTL-${Date.now().toString().slice(-6)}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const msg = {
      id,
      ticket_id: ticketId,
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      category: payload.category.trim(),
      order_id: payload.orderId?.trim(),
      subject: payload.subject?.trim(),
      message: payload.message.trim(),
      created_at: now
    };
    if (this.isPostgres && this.pool) {
      await this.pool.query(
        `INSERT INTO messages (id, ticket_id, name, email, category, order_id, subject, message, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [msg.id, msg.ticket_id, msg.name, msg.email, msg.category, msg.order_id || null, msg.subject || null, msg.message, "New", now]
      );
    }
    db.createContactMessage(payload);
    return msg;
  }
  async getAllMessages() {
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query("SELECT * FROM messages ORDER BY created_at DESC");
      return res.rows.map((r) => ({
        id: r.id,
        ticket_id: r.ticket_id || r.id,
        name: r.name,
        email: r.email,
        category: r.category,
        order_id: r.order_id,
        subject: r.subject,
        message: r.message,
        created_at: r.created_at
      }));
    }
    return db.getAllContactMessages();
  }
  async deleteMessage(id) {
    if (this.isPostgres && this.pool) {
      await this.pool.query("DELETE FROM messages WHERE id = $1", [id]);
    }
    return db.deleteContactMessage(id);
  }
  // Row Mappers
  mapTemplateRow(row) {
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      category: row.category,
      price: Number(row.price),
      original_price: row.original_price ? Number(row.original_price) : void 0,
      sale_price: row.sale_price ? Number(row.sale_price) : void 0,
      thumbnail_url: row.thumbnail_url,
      demo_url: row.demo_url,
      access_url: row.access_url,
      features: typeof row.features === "string" ? JSON.parse(row.features) : row.features || [],
      included_items: typeof row.included_items === "string" ? JSON.parse(row.included_items) : row.included_items || [],
      faq: typeof row.faq === "string" ? JSON.parse(row.faq) : row.faq || [],
      images: typeof row.images === "string" ? JSON.parse(row.images) : row.images || [],
      sheet_preview: typeof row.sheet_preview === "string" ? JSON.parse(row.sheet_preview) : row.sheet_preview || void 0,
      status: row.status,
      created_at: typeof row.created_at === "object" ? row.created_at.toISOString() : row.created_at,
      updated_at: typeof row.updated_at === "object" ? row.updated_at.toISOString() : row.updated_at
    };
  }
  mapOrderRow(row) {
    return {
      id: row.id,
      customer_name: row.customer_name,
      customer_email: row.customer_email,
      user_id: row.user_id,
      template_id: row.template_id,
      template_title: row.template_title,
      template_thumbnail: row.template_thumbnail,
      amount: Number(row.amount),
      currency: row.currency || "INR",
      payment_status: row.payment_status,
      access_status: row.access_status,
      payment_reference: row.payment_reference,
      razorpay_order_id: row.razorpay_order_id,
      razorpay_payment_id: row.razorpay_payment_id,
      access_url: row.access_url,
      created_at: typeof row.created_at === "object" ? row.created_at.toISOString() : row.created_at,
      updated_at: typeof row.updated_at === "object" ? row.updated_at.toISOString() : row.updated_at
    };
  }
  // ==========================================
  // PASSWORD RESET (EMAIL OTP)
  // ==========================================
  async savePasswordResetOtp(email, otpCode, expiresMinutes = 15) {
    const cleanEmail = email.trim().toLowerCase();
    const id = `otp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1e3);
    this.localOtpResets.set(cleanEmail, { otp: otpCode, expiresAt: expiresAt.getTime() });
    if (this.isPostgres && this.pool) {
      try {
        await this.pool.query("DELETE FROM password_resets WHERE LOWER(email) = $1", [cleanEmail]);
        await this.pool.query(
          `INSERT INTO password_resets (id, email, otp_code, expires_at, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [id, cleanEmail, otpCode, expiresAt.toISOString()]
        );
      } catch (err) {
        console.error("[PostgreSQL] Failed to save OTP in DB, fallback in memory:", err);
      }
    }
  }
  async verifyPasswordResetOtp(email, otpCode) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otpCode.trim();
    if (this.isPostgres && this.pool) {
      try {
        const res = await this.pool.query(
          `SELECT * FROM password_resets 
           WHERE LOWER(email) = $1 AND otp_code = $2 AND expires_at > NOW()
           ORDER BY created_at DESC LIMIT 1`,
          [cleanEmail, cleanOtp]
        );
        if (res.rows.length > 0) {
          return true;
        }
      } catch (err) {
        console.error("[PostgreSQL] Error verifying OTP in DB:", err);
      }
    }
    const memoryOtp = this.localOtpResets.get(cleanEmail);
    if (memoryOtp && memoryOtp.otp === cleanOtp && memoryOtp.expiresAt > Date.now()) {
      return true;
    }
    return false;
  }
  async resetPasswordWithOtp(email, otpCode, newPassword) {
    const cleanEmail = email.trim().toLowerCase();
    const isValid = await this.verifyPasswordResetOtp(cleanEmail, otpCode);
    if (!isValid) {
      return { success: false, error: "Invalid or expired OTP verification code. Please request a new code." };
    }
    const salt = import_bcryptjs2.default.genSaltSync(10);
    const passwordHash = import_bcryptjs2.default.hashSync(newPassword.trim(), salt);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    this.localOtpResets.delete(cleanEmail);
    if (this.isPostgres && this.pool) {
      try {
        await this.pool.query("DELETE FROM password_resets WHERE LOWER(email) = $1", [cleanEmail]);
        await this.pool.query(
          "UPDATE users SET password_hash = $1, updated_at = $2 WHERE LOWER(email) = $3",
          [passwordHash, now, cleanEmail]
        );
        await this.pool.query(
          "UPDATE admins SET password_hash = $1, updated_at = $2 WHERE LOWER(email) = $3",
          [passwordHash, now, cleanEmail]
        );
      } catch (err) {
        console.error("[PostgreSQL] Error updating password after OTP:", err);
      }
    }
    try {
      db.setAdminPassword(cleanEmail, newPassword);
    } catch {
    }
    return { success: true };
  }
  async invalidatePasswordResetOtp(email) {
    const cleanEmail = email.trim().toLowerCase();
    this.localOtpResets.delete(cleanEmail);
    if (this.isPostgres && this.pool) {
      try {
        await this.pool.query("DELETE FROM password_resets WHERE LOWER(email) = $1", [cleanEmail]);
      } catch (err) {
        console.error("[PostgreSQL] Error invalidating OTP in DB:", err);
      }
    }
  }
};
var pgDb = new DatabaseService();

// src/server/email.ts
async function sendOtpEmail({ to, otp, userName, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  let configuredFrom = process.env.RESEND_FROM_EMAIL?.trim() || "OneTapLink <support@onetaplink.site>";
  let configuredReplyTo = replyTo || process.env.RESEND_REPLY_TO?.trim();
  const isPublicProvider = /@(gmail|yahoo|hotmail|outlook)\.com/i.test(configuredFrom);
  let fromEmail = configuredFrom;
  if (isPublicProvider) {
    console.warn(`[Resend Notice] Resend cannot send directly from public email domains (${configuredFrom}). Setting ${configuredFrom} as reply_to.`);
    if (!configuredReplyTo) {
      configuredReplyTo = configuredFrom;
    }
    fromEmail = "OneTapLink <support@onetaplink.site>";
  }
  const cleanTo = to.trim().toLowerCase();
  const displayName = userName ? userName.trim() : cleanTo.split("@")[0];
  if (!apiKey) {
    console.log("\n==================================================");
    console.log(`  \u{1F4E7} [Resend Simulated Email]`);
    console.log(`  To:      ${cleanTo}`);
    console.log(`  OTP:     ${otp}  (Valid for 15 minutes)`);
    console.log(`  Notice:  Set RESEND_API_KEY in Railway Variables to send real live emails!`);
    console.log("==================================================\n");
    return { success: true, simulated: true };
  }
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Your OneTapLink Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0F172A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">

  <!-- Outer Background Table -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0F172A; padding: 40px 12px;">
    <tr>
      <td align="center">
        
        <!-- Main Card Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35); border: 1px solid #1E293B;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #090D16 0%, #17123A 50%, #2E1065 100%); padding: 36px 32px 32px 32px; text-align: center; border-bottom: 3px solid #6D5DFB;">
              
              <!-- Brand Badge -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 16px auto;">
                <tr>
                  <td style="background-color: rgba(109, 93, 251, 0.15); border: 1px solid rgba(129, 140, 248, 0.4); border-radius: 9999px; padding: 6px 16px;">
                    <span style="font-size: 11px; font-weight: 700; color: #A5B4FC; letter-spacing: 1px; text-transform: uppercase;">
                      \u26A1 Official Verification Service
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Logo Title -->
              <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px; color: #FFFFFF;">
                OneTap<span style="color: #818CF8;">Link</span>
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: #94A3B8; font-weight: 500;">
                Premium Digital Systems & Workspaces
              </p>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 36px 32px 28px 32px; background-color: #FFFFFF;">
              
              <!-- Security Shield Badge -->
              <div style="display: inline-block; background-color: #F5F3FF; border: 1px solid #DDD6FE; border-radius: 8px; padding: 6px 12px; margin-bottom: 16px;">
                <span style="font-size: 12px; font-weight: 700; color: #6D5DFB;">
                  \u{1F6E1}\uFE0F Password Reset Request
                </span>
              </div>

              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: #0F172A; line-height: 1.3;">
                Hi ${displayName}, here is your verification code
              </h2>
              
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                We received a request to access or reset the password for your <strong>OneTapLink</strong> account (<span style="color: #6D5DFB; font-weight: 600;">${cleanTo}</span>). Please use the 6-digit code below to securely verify your identity:
              </p>

              <!-- HERO OTP BOX -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0 28px 0;">
                <tr>
                  <td style="background: linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%); border: 2px dashed #6366F1; border-radius: 16px; padding: 26px 20px; text-align: center;">
                    
                    <span style="display: block; font-size: 11px; font-weight: 800; color: #4F46E5; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">
                      ONE-TIME PASSWORD (OTP)
                    </span>
                    
                    <div style="background-color: #FFFFFF; display: inline-block; padding: 12px 28px; border-radius: 12px; border: 1px solid #C7D2FE; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.12); margin-bottom: 10px;">
                      <span style="font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace; font-size: 38px; font-weight: 900; letter-spacing: 12px; color: #1E1B4B; text-align: center; display: inline-block; padding-left: 12px;">
                        ${otp}
                      </span>
                    </div>

                    <div style="margin-top: 8px;">
                      <span style="font-size: 12px; font-weight: 600; color: #6D5DFB;">
                        \u23F1\uFE0F Valid for 15 minutes \u2022 Single use only
                      </span>
                    </div>

                  </td>
                </tr>
              </table>

              <!-- Important Security Notices Box -->
              <div style="background-color: #F8FAFC; border-radius: 12px; padding: 16px 20px; border: 1px solid #E2E8F0; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #0F172A; text-transform: uppercase; letter-spacing: 0.5px;">
                  \u{1F512} Security Guidelines
                </p>
                <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #64748B; line-height: 1.7;">
                  <li><strong>Never share this code:</strong> OneTapLink staff will never ask for your verification code.</li>
                  <li><strong>Didn't request this?</strong> You can safely ignore this email; your account remains protected.</li>
                </ul>
              </div>

              <!-- Button CTA -->
              <div style="text-align: center; margin-top: 24px; margin-bottom: 12px;">
                <a href="https://www.onetaplink.site" style="display: inline-block; background: linear-gradient(135deg, #6D5DFB 0%, #4F46E5 100%); color: #FFFFFF; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 10px; box-shadow: 0 4px 14px rgba(109, 93, 251, 0.35);">
                  Open OneTapLink Store \u2192
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #475569;">
                OneTapLink Digital Systems
              </p>
              <p style="margin: 0 0 12px 0; font-size: 11px; color: #94A3B8; line-height: 1.5;">
                Instant Access Digital Templates & Premium Web Workspaces<br>
                <a href="https://www.onetaplink.site" style="color: #6D5DFB; text-decoration: none; font-weight: 600;">www.onetaplink.site</a>
              </p>
              <p style="margin: 0; font-size: 10px; color: #CBD5E1;">
                \xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} OneTapLink. All rights reserved. Automated security notification.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `;
  try {
    const emailPayload = {
      from: fromEmail,
      to: [cleanTo],
      subject: `Your OneTapLink Password Reset Code: ${otp}`,
      html: htmlContent
    };
    if (configuredReplyTo) {
      emailPayload.reply_to = configuredReplyTo;
    }
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(emailPayload)
    });
    const data = await response.json();
    if (!response.ok) {
      console.error("[Resend Email Error]", data);
      return { success: false, error: data?.message || "Failed to send reset email" };
    }
    console.log(`[Resend Email Sent] Reset OTP email sent successfully to ${cleanTo}, id: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error("[Resend Network Error]", err);
    return { success: false, error: err?.message || "Network error sending reset email" };
  }
}

// server.ts
process.on("uncaughtException", (err) => {
  console.error("[CRITICAL UNCAUGHT EXCEPTION]", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[CRITICAL UNHANDLED REJECTION]", reason);
});
var sessions = /* @__PURE__ */ new Map();
function createSessionToken(userId, email, role = "admin") {
  const token = import_node_crypto.default.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1e3;
  sessions.set(token, { userId, email, role, expiresAt });
  return token;
}
function adminAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
  }
  const token = authHeader.substring(7);
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now() || session.role !== "admin") {
    if (session) sessions.delete(token);
    return res.status(401).json({ error: "Unauthorized: Session expired or invalid" });
  }
  req.admin = session;
  next();
}
var rateLimits = /* @__PURE__ */ new Map();
function createRateLimiter(windowMs, maxRequests, message = "Too many requests, please try again later.") {
  return (req, res, next) => {
    const rawIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || req.socket.remoteAddress || "unknown";
    const key = `${req.path}_${rawIp}`;
    const now = Date.now();
    const timestamps = rateLimits.get(key) || [];
    const validTimestamps = timestamps.filter((t) => now - t < windowMs);
    if (validTimestamps.length >= maxRequests) {
      return res.status(429).json({ error: message });
    }
    validTimestamps.push(now);
    rateLimits.set(key, validTimestamps);
    next();
  };
}
var otpAttemptsMap = /* @__PURE__ */ new Map();
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = Number(process.env.PORT) || 3e3;
  const distPath = import_node_path2.default.join(process.cwd(), "dist");
  const hasDist = import_node_fs2.default.existsSync(import_node_path2.default.join(distPath, "index.html"));
  const isProduction = process.env.NODE_ENV === "production" || hasDist;
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });
  const authLimiter = createRateLimiter(15 * 60 * 1e3, 15, "Too many attempts. Please try again after 15 minutes.");
  const contactLimiter = createRateLimiter(15 * 60 * 1e3, 5, "Too many messages sent. Please wait a few minutes before submitting another inquiry.");
  const orderCreateLimiter = createRateLimiter(5 * 60 * 1e3, 10, "Too many order requests. Please wait a moment before trying again.");
  const otpSendLimiter = createRateLimiter(15 * 60 * 1e3, 5, "Too many verification code requests. Please wait a few minutes.");
  const otpVerifyLimiter = createRateLimiter(15 * 60 * 1e3, 10, "Too many verification attempts. Please try again later.");
  await pgDb.initialize();
  app.use(import_express.default.json({ limit: "10mb" }));
  app.use(import_express.default.urlencoded({ extended: true }));
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      database: pgDb.isPostgres ? "postgresql" : "local-json",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.post("/api/auth/signup", authLimiter, async (req, res) => {
    try {
      const { name, email, password, phone } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
      }
      const cleanEmail = email.trim().toLowerCase();
      const existing = await pgDb.getUserByEmail(cleanEmail);
      if (existing) {
        return res.status(400).json({ error: "An account with this email already exists. Please sign in." });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long." });
      }
      const user = await pgDb.createUser({
        name: name?.trim() || cleanEmail.split("@")[0],
        email: cleanEmail,
        password: password.trim(),
        phone: (phone || "").toString().trim()
      });
      const token = createSessionToken(user.id, user.email, "user");
      res.status(201).json({
        success: true,
        token,
        user
      });
    } catch (err) {
      console.error("Customer signup error:", err);
      res.status(500).json({ error: "Failed to create customer account." });
    }
  });
  app.post("/api/auth/login", authLimiter, async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
      }
      const cleanEmail = email.trim().toLowerCase();
      const user = await pgDb.verifyUser(cleanEmail, password.trim());
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password. Please try again." });
      }
      const token = createSessionToken(user.id, user.email, "user");
      res.json({
        success: true,
        token,
        user
      });
    } catch (err) {
      console.error("Customer login error:", err);
      res.status(500).json({ error: "Login failed." });
    }
  });
  app.post("/api/auth/forgot-password/send-otp", otpSendLimiter, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || !email.trim()) {
        return res.status(400).json({ error: "Please enter your registered email address." });
      }
      const cleanEmail = email.trim().toLowerCase();
      const user = await pgDb.getUserByEmail(cleanEmail);
      const dbAdmin = await pgDb.getAdminByEmail(cleanEmail).catch(() => null);
      if (!user && !dbAdmin) {
        return res.status(404).json({ error: "No account found with this email address. Please verify your email or sign up." });
      }
      const userName = user?.displayName || cleanEmail.split("@")[0];
      const otp = import_node_crypto.default.randomInt(1e5, 1e6).toString();
      otpAttemptsMap.delete(cleanEmail);
      await pgDb.savePasswordResetOtp(cleanEmail, otp, 15);
      const emailResult = await sendOtpEmail({
        to: cleanEmail,
        otp,
        userName
      });
      res.json({
        success: true,
        message: "A 6-digit verification code has been sent to your email.",
        simulated: emailResult.simulated || false
      });
    } catch (err) {
      console.error("Send OTP error:", err);
      res.status(500).json({ error: "Failed to send verification code. Please try again." });
    }
  });
  app.post("/api/auth/forgot-password/verify-otp", otpVerifyLimiter, async (req, res) => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ error: "Email and verification code are required." });
      }
      const cleanEmail = email.trim().toLowerCase();
      const cleanOtp = otp.trim();
      const failedAttempts = otpAttemptsMap.get(cleanEmail) || 0;
      if (failedAttempts >= 5) {
        await pgDb.invalidatePasswordResetOtp(cleanEmail).catch(() => {
        });
        return res.status(429).json({
          error: "Too many incorrect attempts. For security, this verification code has been locked. Please request a new code."
        });
      }
      const isValid = await pgDb.verifyPasswordResetOtp(cleanEmail, cleanOtp);
      if (!isValid) {
        const nextAttempts = failedAttempts + 1;
        otpAttemptsMap.set(cleanEmail, nextAttempts);
        const remaining = 5 - nextAttempts;
        return res.status(400).json({
          error: remaining > 0 ? `Invalid or expired verification code. (${remaining} attempt${remaining === 1 ? "" : "s"} remaining)` : "Invalid verification code. Maximum attempts reached, code has been locked."
        });
      }
      otpAttemptsMap.delete(cleanEmail);
      res.json({ success: true, message: "OTP verified successfully." });
    } catch (err) {
      console.error("Verify OTP error:", err);
      res.status(500).json({ error: "Verification failed." });
    }
  });
  app.post("/api/auth/forgot-password/reset", otpVerifyLimiter, async (req, res) => {
    try {
      const { email, otp, newPassword } = req.body;
      if (!email || !otp || !newPassword) {
        return res.status(400).json({ error: "Email, verification code, and new password are required." });
      }
      const cleanEmail = email.trim().toLowerCase();
      const cleanOtp = otp.trim();
      const cleanPassword = newPassword.trim();
      if (cleanPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long." });
      }
      const failedAttempts = otpAttemptsMap.get(cleanEmail) || 0;
      if (failedAttempts >= 5) {
        await pgDb.invalidatePasswordResetOtp(cleanEmail).catch(() => {
        });
        return res.status(429).json({
          error: "Too many failed attempts. Code locked for security. Please request a new code."
        });
      }
      const result = await pgDb.resetPasswordWithOtp(cleanEmail, cleanOtp, cleanPassword);
      if (!result.success) {
        otpAttemptsMap.set(cleanEmail, failedAttempts + 1);
        return res.status(400).json({ error: result.error || "Failed to reset password." });
      }
      otpAttemptsMap.delete(cleanEmail);
      res.json({
        success: true,
        message: "Your password has been reset successfully! You can now sign in with your new password."
      });
    } catch (err) {
      console.error("Reset password error:", err);
      res.status(500).json({ error: "Failed to reset password. Please try again." });
    }
  });
  app.get("/api/auth/me", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const token = authHeader.substring(7);
      const session = sessions.get(token);
      if (!session || session.expiresAt < Date.now()) {
        if (session) sessions.delete(token);
        return res.status(401).json({ error: "Session expired" });
      }
      if (session.role === "admin") {
        const admin = await pgDb.getAdminById(session.userId);
        return res.json({ success: true, role: "admin", user: admin });
      }
      const user = await pgDb.getUserById(session.userId) || await pgDb.getUserByEmail(session.email);
      if (!user) {
        return res.status(404).json({ error: "User account not found" });
      }
      res.json({ success: true, role: "user", user });
    } catch (err) {
      console.error("Session verify error:", err);
      res.status(500).json({ error: "Failed to verify session" });
    }
  });
  app.post("/api/auth/logout", (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      sessions.delete(authHeader.substring(7));
    }
    res.json({ success: true });
  });
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await pgDb.getPublishedTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });
  app.get("/api/templates/:slugOrId", async (req, res) => {
    try {
      const { slugOrId } = req.params;
      let template = await pgDb.getTemplateBySlug(slugOrId);
      if (!template) {
        template = await pgDb.getTemplateById(slugOrId);
      }
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });
  app.get("/api/razorpay/config", (_req, res) => {
    const creds = pgDb.getRazorpayCredentials();
    res.json({
      is_configured: creds.is_configured,
      key_id: creds.is_configured ? creds.key_id : "",
      test_mode: creds.test_mode,
      mode: creds.mode
    });
  });
  app.post("/api/razorpay/create-order", orderCreateLimiter, async (req, res) => {
    try {
      const { template_id, customer_name, customer_email, customer_phone, user_id } = req.body;
      if (!template_id) {
        return res.status(400).json({ error: "Template ID is required." });
      }
      const template = await pgDb.getTemplateById(template_id, true);
      if (!template || template.status !== "Published") {
        return res.status(404).json({ error: "Selected template is not available for purchase." });
      }
      const trustedPrice = template.sale_price ?? template.price;
      const creds = pgDb.getRazorpayCredentials();
      let razorpayOrderId;
      let isSimulation = false;
      let warningMsg;
      const cleanPhone = (customer_phone || "").trim().replace(/[^0-9+]/g, "");
      if (creds.is_configured) {
        try {
          const amountInPaise = Math.round(Number(trustedPrice) * 100);
          const rzpResponse = await fetch("https://api.razorpay.com/v1/orders", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Basic " + Buffer.from(`${creds.key_id}:${creds.key_secret}`).toString("base64")
            },
            body: JSON.stringify({
              amount: amountInPaise,
              currency: "INR",
              receipt: `ord_${Date.now()}`,
              notes: {
                template_id: template.id,
                template_name: template.title,
                customer_name: (customer_name || "Customer").trim(),
                customer_email: (customer_email || "").trim().toLowerCase(),
                customer_phone: cleanPhone,
                user_id: user_id || ""
              }
            })
          });
          const rzpData = await rzpResponse.json().catch(() => ({}));
          if (!rzpResponse.ok || !rzpData.id) {
            console.error("Razorpay Order API error:", rzpData);
            const errMsg = rzpData.error?.description || "Failed to create order with Razorpay.";
            return res.status(502).json({ error: errMsg, details: rzpData.error || rzpData });
          }
          razorpayOrderId = rzpData.id;
        } catch (apiErr) {
          console.error("Failed to communicate with Razorpay API:", apiErr);
          return res.status(502).json({
            error: "Network error communicating with Razorpay payment gateway.",
            details: apiErr.message
          });
        }
      } else {
        isSimulation = true;
        razorpayOrderId = `rzp_sim_order_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        warningMsg = "Razorpay Key ID & Key Secret not set in .env. Running in Test Simulation mode.";
      }
      const pendingOrder = await pgDb.createPendingRazorpayOrder({
        customer_name: customer_name || "Customer",
        customer_email: customer_email || "customer@example.com",
        user_id,
        template_id: template.id,
        razorpay_order_id: razorpayOrderId
      });
      res.status(200).json({
        success: true,
        key_id: creds.key_id,
        order_id: razorpayOrderId,
        amount: Math.round(Number(trustedPrice) * 100),
        // in paise
        currency: "INR",
        product_id: template.id,
        product_name: template.title,
        internal_order_id: pendingOrder?.id,
        is_test_simulation: isSimulation,
        test_mode: creds.test_mode,
        mode: creds.mode,
        warning: warningMsg
      });
    } catch (error) {
      console.error("Razorpay order creation error:", error);
      res.status(500).json({ error: "Internal server error while creating payment order." });
    }
  });
  app.post("/api/razorpay/verify-payment", async (req, res) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        template_id,
        user_id,
        customer_name,
        customer_email,
        customer_phone
      } = req.body;
      if (!razorpay_order_id || !razorpay_payment_id) {
        return res.status(400).json({ error: "razorpay_order_id and razorpay_payment_id are required." });
      }
      const creds = pgDb.getRazorpayCredentials();
      if (creds.is_configured) {
        if (!razorpay_signature || !razorpay_signature.trim()) {
          console.error("[Razorpay Verify] Rejected: razorpay_signature is strictly required.");
          return res.status(400).json({ error: "Tampered payment: Signature missing or invalid." });
        }
        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = import_node_crypto.default.createHmac("sha256", creds.key_secret).update(body).digest("hex");
        if (expectedSignature !== razorpay_signature.trim()) {
          console.error("[Razorpay Verify] Signature mismatch!");
          return res.status(400).json({ error: "Payment signature verification failed. Please contact support." });
        }
      } else {
        if (isProduction && process.env.ENABLE_PAYMENT_SIMULATION !== "true") {
          return res.status(403).json({ error: "Live Razorpay payment credentials are not configured." });
        }
      }
      const verifiedOrder = await pgDb.markRazorpayOrderPaid({
        razorpay_order_id,
        razorpay_payment_id,
        template_id: template_id || "",
        user_id,
        customer_name,
        customer_email,
        customer_phone
      });
      if (!verifiedOrder) {
        return res.status(500).json({ error: "Failed to record payment. Please contact support." });
      }
      const template = await pgDb.getTemplateById(verifiedOrder.template_id, true);
      const purchaseRecord = {
        userId: user_id || verifiedOrder.user_id || "anonymous",
        customerEmail: verifiedOrder.customer_email,
        customerName: verifiedOrder.customer_name,
        productId: verifiedOrder.template_id,
        productName: verifiedOrder.template_title || template?.title,
        amount: verifiedOrder.amount,
        paymentGateway: "razorpay",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        paymentStatus: "paid",
        purchasedAt: verifiedOrder.created_at || (/* @__PURE__ */ new Date()).toISOString(),
        accessUrl: template?.access_url || verifiedOrder.access_url,
        thumbnailUrl: template?.thumbnail_url || verifiedOrder.template_thumbnail
      };
      res.json({
        success: true,
        verified: true,
        order: verifiedOrder,
        purchase: purchaseRecord,
        message: "Payment verified successfully! Access unlocked."
      });
    } catch (error) {
      console.error("[Razorpay Verify] Error:", error);
      res.status(500).json({ error: "Internal server error while verifying payment." });
    }
  });
  app.post("/api/razorpay/simulate-payment", async (req, res) => {
    try {
      if (isProduction && process.env.ENABLE_PAYMENT_SIMULATION !== "true") {
        return res.status(403).json({ error: "Simulated payments are disabled in production mode." });
      }
      const { razorpay_order_id, template_id, user_id, customer_name, customer_email, customer_phone } = req.body;
      if (!razorpay_order_id || !template_id) {
        return res.status(400).json({ error: "razorpay_order_id and template_id are required." });
      }
      const template = await pgDb.getTemplateById(template_id, true);
      if (!template) {
        return res.status(404).json({ error: "Template not found." });
      }
      const simulatedPaymentId = `pay_SIM_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const verifiedOrder = await pgDb.markRazorpayOrderPaid({
        razorpay_order_id,
        razorpay_payment_id: simulatedPaymentId,
        template_id: template.id,
        user_id,
        customer_name,
        customer_email,
        customer_phone
      });
      if (!verifiedOrder) {
        return res.status(500).json({ error: "Failed to record simulated purchase." });
      }
      const purchaseRecord = {
        userId: user_id || verifiedOrder.user_id || "anonymous",
        customerEmail: verifiedOrder.customer_email,
        customerName: verifiedOrder.customer_name,
        productId: template.id,
        productName: template.title,
        amount: verifiedOrder.amount,
        paymentGateway: "razorpay",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: simulatedPaymentId,
        paymentStatus: "paid",
        purchasedAt: verifiedOrder.created_at || (/* @__PURE__ */ new Date()).toISOString(),
        accessUrl: template.access_url,
        thumbnailUrl: template.thumbnail_url
      };
      res.json({
        success: true,
        verified: true,
        order: verifiedOrder,
        purchase: purchaseRecord,
        message: "Test payment simulated successfully! Access unlocked."
      });
    } catch (error) {
      console.error("Simulate payment error:", error);
      res.status(500).json({ error: "Internal server error while simulating payment." });
    }
  });
  app.post("/api/razorpay/webhook", async (req, res) => {
    try {
      const creds = pgDb.getRazorpayCredentials();
      const signature = req.headers["x-razorpay-signature"];
      const rawBody = JSON.stringify(req.body);
      if (creds.is_configured) {
        if (!signature) {
          console.error("[Razorpay Webhook] Rejected: Missing x-razorpay-signature header");
          return res.status(400).send("Signature missing");
        }
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || creds.key_secret;
        const expectedSig = import_node_crypto.default.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
        if (expectedSig !== signature) {
          console.error("[Razorpay Webhook] Signature mismatch!");
          return res.status(400).send("Signature mismatch");
        }
      }
      const event = req.body?.event;
      const payment = req.body?.payload?.payment?.entity;
      if (event === "payment.captured" && payment) {
        const rzpOrderId = payment.order_id;
        const rzpPayId = payment.id;
        if (rzpOrderId && rzpPayId) {
          await pgDb.markRazorpayOrderPaid({
            razorpay_order_id: rzpOrderId,
            razorpay_payment_id: rzpPayId,
            template_id: payment.notes?.template_id || "",
            user_id: payment.notes?.user_id || "",
            customer_name: payment.notes?.customer_name || payment.email?.split("@")[0] || "",
            customer_email: payment.email || payment.notes?.customer_email || ""
          });
          console.log(`[Razorpay Webhook] Payment captured: ${rzpPayId} for order ${rzpOrderId}`);
        }
      }
      res.status(200).send("OK");
    } catch (error) {
      console.error("[Razorpay Webhook] Error:", error);
      res.status(500).send("Internal Error");
    }
  });
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const orderId = req.params.id;
      if (!orderId) {
        return res.status(400).json({ error: "Order ID is required" });
      }
      const order = await pgDb.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
      const session = token ? sessions.get(token) : null;
      const isAdmin = session && session.role === "admin";
      const isOwner = session && (order.user_id && session.userId === order.user_id || order.customer_email && session.email.toLowerCase() === order.customer_email.toLowerCase());
      const paymentRefQuery = (req.query.ref || req.query.payment_id || "").toString().trim();
      const hasPaymentProof = paymentRefQuery && (order.razorpay_payment_id === paymentRefQuery || order.payment_reference === paymentRefQuery);
      if (!isAdmin && !isOwner && !hasPaymentProof) {
        const safeOrder = {
          id: order.id,
          template_id: order.template_id,
          template_title: order.template_title,
          amount: order.amount,
          currency: order.currency,
          payment_status: order.payment_status,
          created_at: order.created_at,
          customer_name: order.customer_name ? `${order.customer_name.slice(0, 1)}***` : void 0
        };
        return res.json({ success: true, order: safeOrder });
      }
      if (order.payment_status === "Paid") {
        const template = await pgDb.getTemplateById(order.template_id, true);
        if (template) {
          order.access_url = template.access_url;
          order.template_title = template.title;
          order.template_thumbnail = template.thumbnail_url;
        }
      }
      res.json({ success: true, order });
    } catch (error) {
      console.error("Error fetching order by ID:", error);
      res.status(500).json({ error: "Failed to fetch order details" });
    }
  });
  app.get(["/api/user/purchases", "/api/user/purchases-lookup", "/api/user/purchases/:userId"], async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
      const session = token ? sessions.get(token) : null;
      const userId = (req.params.userId || req.query.userId || "").toString().trim();
      const email = (req.query.email || "").toString().trim();
      if (!userId && !email) {
        return res.status(400).json({ error: "User ID or email is required." });
      }
      if (email && !email.includes("@")) {
        const directOrder = await pgDb.getOrderById(email);
        if (directOrder && directOrder.payment_status === "Paid") {
          const tmpl = await pgDb.getTemplateById(directOrder.template_id, true);
          if (tmpl) directOrder.access_url = tmpl.access_url;
          return res.json({ success: true, purchases: [directOrder] });
        }
      }
      const isAuthorized = session && (session.role === "admin" || session.userId === userId || email && session.email.toLowerCase() === email.toLowerCase());
      if (!isAuthorized) {
        return res.status(401).json({ error: "Unauthorized: Please log in to view your purchases." });
      }
      const orders = await pgDb.getUserOrders(userId, email);
      res.json({ success: true, purchases: orders });
    } catch (error) {
      console.error("Error fetching user purchases:", error);
      res.status(500).json({ error: "Failed to fetch customer purchases" });
    }
  });
  app.get("/api/user/checkout-details", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
      const session = token ? sessions.get(token) : null;
      const userId = (req.query.userId || "").toString().trim();
      const email = (req.query.email || "").toString().trim().toLowerCase();
      if (!userId && !email) {
        return res.json({ success: true, found: false, details: null });
      }
      if (!session || session.userId !== userId && session.email.toLowerCase() !== email) {
        return res.json({ success: true, found: false, details: null });
      }
      const details = await pgDb.getLastCustomerCheckoutDetails(userId, email);
      if (details) {
        return res.json({ success: true, found: true, details });
      }
      return res.json({ success: true, found: false, details: null });
    } catch (error) {
      console.error("Error fetching checkout profile details:", error);
      res.status(500).json({ error: "Failed to fetch customer profile" });
    }
  });
  app.post("/api/contact", contactLimiter, async (req, res) => {
    try {
      const { name, email, category, orderId, subject, message } = req.body;
      const missingFields = [];
      if (!name || !name.trim()) missingFields.push("name");
      if (!email || !email.trim()) missingFields.push("email");
      if (!category || !category.trim()) missingFields.push("category");
      if (!message || !message.trim()) missingFields.push("message");
      if (missingFields.length > 0) {
        return res.status(400).json({
          error: "Please fill in all required fields.",
          missingFields
        });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Please enter a valid email address." });
      }
      const inquiry = await pgDb.createMessage({
        name,
        email,
        category,
        orderId,
        subject,
        message
      });
      res.status(201).json({
        success: true,
        ticket_id: inquiry.ticket_id,
        message: "Your inquiry has been submitted successfully."
      });
    } catch (error) {
      console.error("Contact submission error:", error);
      res.status(500).json({ error: "Failed to submit inquiry." });
    }
  });
  app.post("/api/admin/login", authLimiter, async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();
      const admin = await pgDb.verifyAdmin(cleanEmail, cleanPassword);
      if (admin) {
        const token = createSessionToken(admin.id, admin.email, "admin");
        return res.json({
          success: true,
          token,
          admin: {
            id: admin.id,
            email: admin.email
          }
        });
      }
      return res.status(401).json({ error: "Invalid email or password. Access denied." });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  app.post(["/api/admin/signup", "/api/admin/set-password"], authLimiter, async (req, res) => {
    try {
      const { email, password, deleteOldDefault, admin_setup_secret } = req.body;
      const cleanEmail = (email || "").trim().toLowerCase();
      const cleanPassword = (password || "").trim();
      if (!cleanEmail || !cleanPassword) {
        return res.status(400).json({ error: "Both email and password are required" });
      }
      if (cleanPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }
      const hasExistingAdmins = await pgDb.hasAdmins();
      if (hasExistingAdmins) {
        const authHeader = req.headers.authorization;
        const token2 = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
        const session = token2 ? sessions.get(token2) : null;
        const isAuthorizedAdmin = session && session.role === "admin" && session.expiresAt > Date.now();
        const configuredSecret = process.env.ADMIN_SETUP_SECRET;
        const isValidSecret = configuredSecret && admin_setup_secret === configuredSecret;
        if (!isAuthorizedAdmin && !isValidSecret) {
          return res.status(403).json({
            error: "Forbidden: Admin account already exists. You must be authenticated as an admin or provide the valid ADMIN_SETUP_SECRET to modify admin credentials."
          });
        }
      }
      const admin = await pgDb.setAdminPassword(cleanEmail, cleanPassword);
      if (deleteOldDefault && cleanEmail !== "admin@onetaplink.com") {
        await pgDb.deleteAdmin("admin@onetaplink.com");
      }
      const token = createSessionToken(admin.id, admin.email, "admin");
      res.json({
        success: true,
        token,
        admin: {
          id: admin.id,
          email: admin.email
        },
        message: "Admin account credentials updated successfully"
      });
    } catch (error) {
      console.error("Admin sign up error:", error);
      res.status(500).json({ error: error?.message || "Failed to update admin account" });
    }
  });
  app.get("/api/admin/me", adminAuthMiddleware, (req, res) => {
    const adminSession = req.admin;
    res.json({
      admin: {
        id: adminSession.userId,
        email: adminSession.email
      }
    });
  });
  app.get("/api/admin/stats", adminAuthMiddleware, async (req, res) => {
    try {
      const orders = await pgDb.getAllOrders();
      const templates = await pgDb.getAllTemplates();
      const paidOrders = orders.filter((o) => o.payment_status === "Paid");
      const totalSales = paidOrders.reduce((sum, o) => sum + Number(o.amount || 0), 0);
      res.json({
        total_sales: totalSales,
        total_orders: orders.length,
        total_templates: templates.length,
        published_templates: templates.filter((t) => t.status === "Published").length,
        recent_orders: orders.slice(0, 10)
      });
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ error: "Failed to load stats" });
    }
  });
  app.get("/api/admin/templates", adminAuthMiddleware, async (req, res) => {
    try {
      const templates = await pgDb.getAllTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching admin templates:", error);
      res.status(500).json({ error: "Failed to fetch admin templates" });
    }
  });
  app.post("/api/admin/templates", adminAuthMiddleware, async (req, res) => {
    try {
      const created = await pgDb.createTemplate(req.body);
      res.status(201).json(created);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(500).json({ error: "Failed to create template" });
    }
  });
  app.put("/api/admin/templates/:id", adminAuthMiddleware, async (req, res) => {
    try {
      const updated = await pgDb.updateTemplate(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating template:", error);
      res.status(500).json({ error: "Failed to update template" });
    }
  });
  app.delete("/api/admin/templates/:id", adminAuthMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const { slug, title } = req.query;
      await pgDb.deleteTemplate(id, slug, title);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ error: "Failed to delete template" });
    }
  });
  app.post("/api/admin/templates/cleanup-duplicates", adminAuthMiddleware, async (req, res) => {
    try {
      const count = await pgDb.cleanupDuplicateTemplates();
      const templates = await pgDb.getAllTemplates();
      res.json({ success: true, count, templates });
    } catch (error) {
      console.error("Error cleaning up templates:", error);
      res.status(500).json({ error: "Failed to cleanup duplicate templates" });
    }
  });
  app.get("/api/admin/orders", adminAuthMiddleware, async (req, res) => {
    try {
      const orders = await pgDb.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching admin orders:", error);
      res.status(500).json({ error: "Failed to load orders" });
    }
  });
  app.patch("/api/admin/orders/:orderId/status", adminAuthMiddleware, async (req, res) => {
    try {
      const { orderId } = req.params;
      const { payment_status, access_status } = req.body;
      const updated = await pgDb.updateOrderStatus(orderId, payment_status, access_status);
      if (!updated) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  });
  app.delete("/api/admin/orders/:orderId", adminAuthMiddleware, async (req, res) => {
    try {
      await pgDb.deleteOrder(req.params.orderId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ error: "Failed to delete order" });
    }
  });
  app.post("/api/admin/clear-test-data", adminAuthMiddleware, async (req, res) => {
    try {
      await pgDb.clearAllOrders();
      res.json({ success: true, message: "Orders cleared successfully" });
    } catch (error) {
      console.error("Error resetting test orders:", error);
      res.status(500).json({ error: "Failed to reset test orders" });
    }
  });
  app.get("/api/admin/messages", adminAuthMiddleware, async (req, res) => {
    try {
      const msgs = await pgDb.getAllMessages();
      res.json(msgs);
    } catch (error) {
      console.error("Error loading messages:", error);
      res.status(500).json({ error: "Failed to load contact messages" });
    }
  });
  app.delete("/api/admin/messages/:id", adminAuthMiddleware, async (req, res) => {
    try {
      await pgDb.deleteMessage(req.params.id);
      res.json({ success: true, message: "Message deleted" });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ error: "Failed to delete message" });
    }
  });
  app.post("/api/admin/upload-image", adminAuthMiddleware, async (req, res) => {
    try {
      const { image, name } = req.body;
      if (!image) {
        return res.status(400).json({ error: "Image data is required" });
      }
      const uploadDir = import_node_path2.default.join(process.cwd(), "public", "uploads");
      if (!import_node_fs2.default.existsSync(uploadDir)) {
        import_node_fs2.default.mkdirSync(uploadDir, { recursive: true });
      }
      if (image.startsWith("data:image/")) {
        const matches = image.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches) {
          const rawExt = matches[1].toLowerCase();
          const allowed = ["png", "jpg", "jpeg", "webp", "gif"];
          if (!allowed.includes(rawExt)) {
            return res.status(400).json({ error: "Invalid image format. Only PNG, JPG, WEBP, GIF are allowed." });
          }
          const ext = rawExt === "jpeg" ? "jpg" : rawExt;
          const base64Data = matches[2];
          const safeName = (name || `img_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, "_");
          const fileName = `${safeName}-${Date.now().toString().slice(-6)}.${ext}`;
          const filePath = import_node_path2.default.join(uploadDir, fileName);
          import_node_fs2.default.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
          return res.json({ success: true, url: `/uploads/${fileName}` });
        }
      }
      res.json({ success: true, url: image });
    } catch (error) {
      console.error("Image upload error:", error);
      res.status(500).json({ error: "Failed to process image upload" });
    }
  });
  app.get("/api/admin/settings", adminAuthMiddleware, (_req, res) => {
    res.json({
      database: pgDb.isPostgres ? "PostgreSQL (Connected)" : "Local Storage (Fallback)",
      database_connected: pgDb.isPostgres
    });
  });
  const publicPath = import_node_path2.default.join(process.cwd(), "public");
  app.use(import_express.default.static(publicPath));
  app.get("/favicon.ico", (_req, res) => {
    res.type("image/svg+xml").sendFile(import_node_path2.default.join(publicPath, "favicon.svg"));
  });
  const uploadsDir = import_node_path2.default.resolve(publicPath, "uploads");
  app.use("/uploads", (req, res, _next) => {
    const safeRelPath = import_node_path2.default.normalize(req.path).replace(/^(\.\.[\/\\])+/, "");
    const filePath = import_node_path2.default.resolve(uploadsDir, "." + safeRelPath);
    if (!filePath.startsWith(uploadsDir)) {
      return res.status(403).json({ error: "Access denied" });
    }
    if (import_node_fs2.default.existsSync(filePath) && import_node_fs2.default.statSync(filePath).isFile()) {
      return res.sendFile(filePath);
    }
    return res.status(404).json({ error: "Image not found" });
  });
  if (!isProduction) {
    const vite = await (0, import_vite.createServer)({
      server: {
        middlewareMode: true,
        watch: {
          ignored: [
            "**/data/**",
            "**/data/*/**",
            "**/public/uploads/**",
            "**/.git/**",
            "**/node_modules/**",
            "**/dist/**"
          ]
        }
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_node_path2.default.join(distPath, "index.html"));
    });
  }
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`
  \u{1F680} OneTapLink Store is running!`);
    console.log(`  \u279C  Listening on PORT: ${PORT}`);
    console.log(`  \u279C  Local:   http://localhost:${PORT}/`);
    console.log(`  \u279C  Admin:   http://localhost:${PORT}/admin`);
    console.log(`  \u279C  Database: ${pgDb.isPostgres ? "PostgreSQL" : "Local File Store"}
`);
  });
  server.on("error", (err) => {
    console.error(`[Server Error on port ${PORT}]`, err?.message || err);
  });
  if (PORT !== 3e3) {
    try {
      const p3000 = app.listen(3e3, "0.0.0.0", () => {
        console.log(`  \u279C  Also listening on port 3000 for Railway custom domain router.`);
      });
      p3000.on("error", (err) => {
        console.log(`[Notice] Port 3000 bind status:`, err?.message || err);
      });
    } catch (e) {
      console.log("[Notice] Could not bind port 3000:", e?.message || e);
    }
  }
}
startServer();
//# sourceMappingURL=server.cjs.map
