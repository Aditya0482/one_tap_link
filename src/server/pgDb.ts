import pg from 'pg';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { 
  Template, 
  Order, 
  AdminUser, 
  ContactMessage, 
  User, 
  PaymentStatus, 
  AccessStatus, 
  TemplateStatus 
} from '../types';
import { db as jsonDb } from './db';

const { Pool } = pg;

export class DatabaseService {
  private pool: pg.Pool | null = null;
  public isPostgres: boolean = false;
  private isInitialized: boolean = false;
  private localOtpResets: Map<string, { otp: string; expiresAt: number }> = new Map();

  constructor() {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl && dbUrl.trim().length > 0) {
      try {
        const isLocalhost = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
        this.pool = new Pool({
          connectionString: dbUrl,
          ssl: isLocalhost ? false : { rejectUnauthorized: false },
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000
        });

        // Prevent idle client errors from crashing the Node.js process
        this.pool.on('error', (err) => {
          console.error('[PostgreSQL Pool Error (Handled)]', err?.message || err);
        });

        this.isPostgres = true;
        console.log('[PostgreSQL] Database pool created with DATABASE_URL.');
      } catch (err) {
        console.error('[PostgreSQL] Failed to initialize connection pool, falling back to local storage:', err);
        this.pool = null;
        this.isPostgres = false;
      }
    } else {
      console.log('[PostgreSQL] No DATABASE_URL provided. Running with local fallback store.');
      this.isPostgres = false;
    }
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (!this.pool || !this.isPostgres) {
      this.isInitialized = true;
      return;
    }

    try {
      // Test connection
      const client = await this.pool.connect();
      try {
        console.log('[PostgreSQL] Connected successfully. Initializing tables...');

        // 1. Admins table
        await client.query(`
          CREATE TABLE IF NOT EXISTS admins (
            id VARCHAR(255) PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `);

        // 2. Users (Customers) table
        await client.query(`
          CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(255) PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(255),
            password_hash VARCHAR(255),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `);

        // 3. Templates table
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

        // 4. Orders table
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

        // Automated schema migrations for existing orders table
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


        // 5. Contact Inquiries table
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

        // 6. Settings table
        await client.query(`
          CREATE TABLE IF NOT EXISTS settings (
            key VARCHAR(255) PRIMARY KEY,
            value JSONB,
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `);

        // 7. Password Resets (Email OTP) table
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

        // Seed initial data if tables are fresh
        await this.seedInitialData(client);
        console.log('[PostgreSQL] Database tables initialized and verified.');
      } finally {
        client.release();
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('[PostgreSQL] Initialization error, falling back to local store:', error);
      this.isPostgres = false;
      this.isInitialized = true;
    }
  }

  private async seedInitialData(client: pg.PoolClient): Promise<void> {
    try {
      // 1. Seed Admins
      const adminCountRes = await client.query('SELECT COUNT(*) FROM admins');
      if (parseInt(adminCountRes.rows[0].count, 10) === 0) {
        const storeAdmins = (jsonDb as any).data?.admins || [];
        for (const admin of storeAdmins) {
          const passHash = (jsonDb as any).data?.admin_passwords?.[admin.id];
          if (passHash) {
            await client.query(
              `INSERT INTO admins (id, email, password_hash, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (email) DO NOTHING`,
              [admin.id, admin.email.toLowerCase(), passHash, admin.created_at || new Date().toISOString(), new Date().toISOString()]
            );
          }
        }
        console.log('[PostgreSQL] Seeded initial admins.');
      }

      // 2. Seed Templates
      const templateCountRes = await client.query('SELECT COUNT(*) FROM templates');
      if (parseInt(templateCountRes.rows[0].count, 10) === 0) {
        const storeTemplates = jsonDb.getAllTemplatesAdmin();
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
              t.description || '',
              t.category || 'Finance',
              t.price || 0,
              t.original_price || null,
              t.sale_price || null,
              t.thumbnail_url || '',
              t.demo_url || null,
              t.access_url || '',
              JSON.stringify(t.features || []),
              JSON.stringify(t.included_items || []),
              JSON.stringify(t.faq || []),
              JSON.stringify(t.images || []),
              t.sheet_preview ? JSON.stringify(t.sheet_preview) : null,
              t.status || 'Published',
              t.created_at || new Date().toISOString(),
              t.updated_at || new Date().toISOString()
            ]
          );
        }
        console.log('[PostgreSQL] Seeded initial templates.');
      }

      // 3. Seed Orders if any in store
      const orderCountRes = await client.query('SELECT COUNT(*) FROM orders');
      if (parseInt(orderCountRes.rows[0].count, 10) === 0) {
        const storeOrders = jsonDb.getAllOrders();
        for (const o of storeOrders) {
          await client.query(
            `INSERT INTO orders (
              id, customer_name, customer_email, user_id, template_id, template_title,
              template_thumbnail, amount, currency, payment_status, access_status,
              payment_reference, razorpay_order_id, razorpay_payment_id, access_url,
              created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            ON CONFLICT (id) DO NOTHING`,
            [
              o.id,
              o.customer_name,
              o.customer_email.toLowerCase(),
              o.user_id || null,
              o.template_id,
              o.template_title || '',
              o.template_thumbnail || '',
              o.amount,
              o.currency || 'INR',
              o.payment_status || 'Pending',
              o.access_status || 'Pending',
              o.payment_reference || '',
              o.razorpay_order_id || null,
              o.razorpay_payment_id || null,
              o.access_url || null,
              o.created_at || new Date().toISOString(),
              o.updated_at || new Date().toISOString()
            ]
          );
        }
      }
    } catch (seedErr) {
      console.warn('[PostgreSQL] Seeding warning:', seedErr);
    }
  }

  // ==========================================
  // CUSTOMER AUTHENTICATION (POSTGRESQL)
  // ==========================================
  public async createUser(data: { name: string; email: string; password?: string }): Promise<User> {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanName = data.name.trim();
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const passwordHash = data.password ? bcrypt.hashSync(data.password.trim(), 10) : null;

    if (this.isPostgres && this.pool) {
      const res = await this.pool.query(
        `INSERT INTO users (id, email, name, password_hash, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, email, name, created_at`,
        [id, cleanEmail, cleanName, passwordHash, now, now]
      );
      const row = res.rows[0];
      return {
        id: row.id,
        uid: row.id,
        email: row.email,
        displayName: row.name || '',
        created_at: row.created_at
      };
    }

    // Local fallback
    return {
      id,
      uid: id,
      email: cleanEmail,
      displayName: cleanName,
      created_at: now
    };
  }

  public async verifyUser(email: string, password: string): Promise<User | null> {
    const cleanEmail = email.trim().toLowerCase();

    if (this.isPostgres && this.pool) {
      const res = await this.pool.query(
        'SELECT id, email, name, password_hash, created_at FROM users WHERE LOWER(email) = $1',
        [cleanEmail]
      );
      if (res.rows.length === 0) return null;

      const user = res.rows[0];
      if (!user.password_hash) return null;

      const isMatch = bcrypt.compareSync(password, user.password_hash);
      if (!isMatch) return null;

      return {
        id: user.id,
        uid: user.id,
        email: user.email,
        displayName: user.name || '',
        created_at: user.created_at
      };
    }

    return null;
  }

  public async getUserByEmail(email: string): Promise<User | null> {
    const cleanEmail = email.trim().toLowerCase();
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query(
        'SELECT id, email, name, created_at FROM users WHERE LOWER(email) = $1',
        [cleanEmail]
      );
      if (res.rows.length === 0) return null;
      const user = res.rows[0];
      return {
        id: user.id,
        uid: user.id,
        email: user.email,
        displayName: user.name || '',
        created_at: user.created_at
      };
    }
    return null;
  }

  public async getUserById(id: string): Promise<User | null> {
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query(
        'SELECT id, email, name, created_at FROM users WHERE id = $1',
        [id]
      );
      if (res.rows.length === 0) return null;
      const user = res.rows[0];
      return {
        id: user.id,
        uid: user.id,
        email: user.email,
        displayName: user.name || '',
        created_at: user.created_at
      };
    }
    return null;
  }

  // ==========================================
  // ADMIN AUTHENTICATION (POSTGRESQL)
  // ==========================================
  public async verifyAdmin(email: string, password: string): Promise<AdminUser | null> {
    const cleanEmail = email.trim().toLowerCase();
    const envAdminPass = process.env.ADMIN_PASSWORD?.trim();

    if (this.isPostgres && this.pool) {
      const res = await this.pool.query(
        'SELECT id, email, password_hash, created_at FROM admins WHERE LOWER(email) = $1',
        [cleanEmail]
      );
      if (res.rows.length === 0) {
        // If not found in db, but password matches env ADMIN_PASSWORD, register new admin immediately!
        if (envAdminPass && password === envAdminPass) {
          return this.setAdminPassword(cleanEmail, password);
        }
        return jsonDb.verifyAdmin(cleanEmail, password);
      }
      const admin = res.rows[0];
      const isEnvMatch = !!(envAdminPass && password === envAdminPass);
      const isHashMatch = admin.password_hash ? bcrypt.compareSync(password, admin.password_hash) : false;

      if (!isHashMatch && !isEnvMatch) return null;

      // If matched via env password, sync hash into database
      if (isEnvMatch && !isHashMatch) {
        await this.setAdminPassword(cleanEmail, password);
      }

      return {
        id: admin.id,
        email: admin.email,
        created_at: admin.created_at
      };
    }

    return jsonDb.verifyAdmin(cleanEmail, password);
  }

  public async setAdminPassword(email: string, newPassword: string): Promise<AdminUser> {
    const cleanEmail = email.trim().toLowerCase();
    const id = `adm_${Date.now()}`;
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(newPassword, salt);
    const now = new Date().toISOString();

    if (this.isPostgres && this.pool) {
      await this.pool.query(
        `INSERT INTO admins (id, email, password_hash, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE SET password_hash = $3, updated_at = $5`,
        [id, cleanEmail, hash, now, now]
      );
      const res = await this.pool.query('SELECT id, email, created_at FROM admins WHERE LOWER(email) = $1', [cleanEmail]);
      const row = res.rows[0];
      // Keep JSON backup in sync
      jsonDb.setAdminPassword(cleanEmail, newPassword);
      return {
        id: row.id,
        email: row.email,
        created_at: row.created_at
      };
    }

    return jsonDb.setAdminPassword(cleanEmail, newPassword);
  }

  public async deleteAdmin(email: string): Promise<boolean> {
    const cleanEmail = email.trim().toLowerCase();
    if (this.isPostgres && this.pool) {
      await this.pool.query('DELETE FROM admins WHERE LOWER(email) = $1', [cleanEmail]);
    }
    return jsonDb.deleteAdmin(cleanEmail);
  }

  public async getAdminById(id: string): Promise<AdminUser | null> {
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query('SELECT id, email, created_at FROM admins WHERE id = $1', [id]);
      if (res.rows.length > 0) {
        return {
          id: res.rows[0].id,
          email: res.rows[0].email,
          created_at: res.rows[0].created_at
        };
      }
    }
    return jsonDb.getAdminById(id);
  }

  public async getAdminByEmail(email: string): Promise<AdminUser | null> {
    const cleanEmail = email.trim().toLowerCase();
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query('SELECT id, email, created_at FROM admins WHERE LOWER(email) = $1', [cleanEmail]);
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

  // ==========================================
  // TEMPLATES MANAGEMENT (POSTGRESQL)
  // ==========================================
  public async getPublishedTemplates(): Promise<Omit<Template, 'access_url'>[]> {
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
    return jsonDb.getPublishedTemplates();
  }

  public async getAllTemplates(): Promise<Template[]> {
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query(
        `SELECT * FROM templates ORDER BY created_at DESC`
      );
      return res.rows.map(this.mapTemplateRow);
    }
    return jsonDb.getAllTemplatesAdmin();
  }

  public async getTemplateById(id: string, includeAccessUrl = false): Promise<Template | null> {
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query('SELECT * FROM templates WHERE id = $1', [id]);
      if (res.rows.length === 0) return null;
      const t = this.mapTemplateRow(res.rows[0]);
      if (!includeAccessUrl && t.status !== 'Published') return null;
      if (!includeAccessUrl) {
        const { access_url, ...safe } = t;
        return safe as Template;
      }
      return t;
    }
    return jsonDb.getTemplateById(id, includeAccessUrl);
  }

  public async getTemplateBySlug(slug: string, includeAccessUrl = false): Promise<Template | null> {
    const cleanSlug = slug.trim().toLowerCase();
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query('SELECT * FROM templates WHERE LOWER(slug) = $1', [cleanSlug]);
      if (res.rows.length === 0) return null;
      const t = this.mapTemplateRow(res.rows[0]);
      if (!includeAccessUrl && t.status !== 'Published') return null;
      if (!includeAccessUrl) {
        const { access_url, ...safe } = t;
        return safe as Template;
      }
      return t;
    }
    return jsonDb.getTemplateBySlug(cleanSlug, includeAccessUrl);
  }

  public async createTemplate(data: Omit<Template, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<Template> {
    const id = data.id?.trim() || `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

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
          data.description || '',
          data.category || 'Finance',
          data.price || 0,
          data.original_price || null,
          data.sale_price || null,
          data.thumbnail_url || '',
          data.demo_url || null,
          data.access_url || '',
          JSON.stringify(data.features || []),
          JSON.stringify(data.included_items || []),
          JSON.stringify(data.faq || []),
          JSON.stringify(data.images || []),
          data.sheet_preview ? JSON.stringify(data.sheet_preview) : null,
          data.status || 'Published',
          now,
          now
        ]
      );
      jsonDb.createTemplate(data);
      const res = await this.getTemplateById(id, true);
      return res!;
    }

    return jsonDb.createTemplate(data);
  }

  public async updateTemplate(id: string, updates: Partial<Template>): Promise<Template | null> {
    const now = new Date().toISOString();

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
          merged.description || '',
          merged.category || 'Finance',
          merged.price || 0,
          merged.original_price || null,
          merged.sale_price || null,
          merged.thumbnail_url || '',
          merged.demo_url || null,
          merged.access_url || '',
          JSON.stringify(merged.features || []),
          JSON.stringify(merged.included_items || []),
          JSON.stringify(merged.faq || []),
          JSON.stringify(merged.images || []),
          merged.sheet_preview ? JSON.stringify(merged.sheet_preview) : null,
          merged.status || 'Published',
          now,
          id
        ]
      );
      jsonDb.updateTemplate(id, updates);
      return await this.getTemplateById(id, true);
    }

    return jsonDb.updateTemplate(id, updates);
  }

  public async deleteTemplate(id: string, slug?: string, title?: string): Promise<boolean> {
    const cleanId = (id || '').trim();
    const cleanSlug = (slug || '').trim().toLowerCase();
    const cleanTitle = (title || '').trim().toLowerCase();

    if (this.isPostgres && this.pool) {
      await this.pool.query(
        `DELETE FROM templates WHERE id = $1 OR LOWER(slug) = $2 OR LOWER(title) = $3`,
        [cleanId, cleanSlug || cleanId, cleanTitle || cleanId]
      );
    }

    return jsonDb.deleteTemplate(id, slug, title);
  }

  public async cleanupDuplicateTemplates(): Promise<number> {
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query(`
        DELETE FROM templates a
        USING templates b
        WHERE a.id < b.id 
          AND (LOWER(a.slug) = LOWER(b.slug) OR LOWER(a.title) = LOWER(b.title))
      `);
      return res.rowCount || 0;
    }
    return jsonDb.cleanupDuplicates().length;
  }

  // ==========================================
  // ORDERS & PURCHASES (RAZORPAY & POSTGRESQL)
  // ==========================================
  public getRazorpayCredentials(): {
    key_id: string;
    key_secret: string;
    is_configured: boolean;
    test_mode: boolean;
    mode: 'live' | 'test' | 'simulation';
  } {
    const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
    const isTestMode = process.env.RAZORPAY_TEST_MODE !== 'false';

    const isConfigured = Boolean(
      keyId && keySecret &&
      !keyId.includes('placeholder') &&
      !keySecret.includes('placeholder')
    );

    return {
      key_id: keyId,
      key_secret: keySecret,
      is_configured: isConfigured,
      test_mode: isTestMode,
      mode: !isConfigured ? 'simulation' : (isTestMode ? 'test' : 'live')
    };
  }



  /**
   * Retrieves previous customer details (Name, Email, Mobile No) from past orders or user profile
   * so returning customers never have to type their mobile number or details again.
   */
  public async getLastCustomerCheckoutDetails(userId?: string, email?: string): Promise<{
    name?: string;
    email?: string;
    phone?: string;
  } | null> {
    const cleanEmail = email?.trim().toLowerCase();
    const cleanUid = userId?.trim();

    if (!cleanEmail && (!cleanUid || cleanUid === 'guest-checkout')) return null;

    if (this.isPostgres && this.pool) {
      // 1. Check orders table for most recent order with phone
      const orderRes = await this.pool.query(
        `SELECT customer_name, customer_email, customer_phone 
         FROM orders 
         WHERE (user_id = $1 OR LOWER(customer_email) = $2)
           AND customer_phone IS NOT NULL 
           AND TRIM(customer_phone) != ''
         ORDER BY created_at DESC 
         LIMIT 1`,
        [cleanUid && cleanUid !== 'guest-checkout' ? cleanUid : null, cleanEmail || null]
      );

      if (orderRes.rows.length > 0) {
        const row = orderRes.rows[0];
        return {
          name: row.customer_name || undefined,
          email: row.customer_email || cleanEmail,
          phone: row.customer_phone || undefined
        };
      }

      // 2. Fallback check in users table
      const userRes = await this.pool.query(
        `SELECT name, email, phone FROM users WHERE (id = $1 OR LOWER(email) = $2) LIMIT 1`,
        [cleanUid && cleanUid !== 'guest-checkout' ? cleanUid : null, cleanEmail || null]
      );
      if (userRes.rows.length > 0) {
        const row = userRes.rows[0];
        return {
          name: row.name || undefined,
          email: row.email || cleanEmail,
          phone: row.phone || undefined
        };
      }

      return null;
    }

    // Local JSON fallback
    const allOrders: any[] = jsonDb.getAllOrders();
    const matchedOrders = allOrders.filter((o: any) => {
      const matchUid = cleanUid && cleanUid !== 'guest-checkout' && o.user_id === cleanUid;
      const matchEmail = cleanEmail && o.customer_email?.toLowerCase() === cleanEmail;
      return (matchUid || matchEmail) && o.customer_phone && String(o.customer_phone).trim() !== '';
    });

    if (matchedOrders.length > 0) {
      matchedOrders.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      const latest = matchedOrders[0];
      return {
        name: latest.customer_name,
        email: latest.customer_email || cleanEmail,
        phone: latest.customer_phone
      };
    }

    return null;
  }

  public async createPendingRazorpayOrder(payload: {
    customer_name: string;
    customer_email: string;
    user_id?: string;
    template_id: string;
    razorpay_order_id: string;
  }): Promise<Order | null> {
    const template = await this.getTemplateById(payload.template_id, true);
    if (!template) return null;

    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const now = new Date().toISOString();
    const amount = template.sale_price ?? template.price;

    const newOrder: Order = {
      id: orderId,
      customer_name: payload.customer_name.trim(),
      customer_email: payload.customer_email.trim().toLowerCase(),
      user_id: payload.user_id || undefined,
      template_id: template.id,
      template_title: template.title,
      template_thumbnail: template.thumbnail_url,
      amount,
      currency: 'INR',
      payment_status: 'Pending',
      access_status: 'Pending',
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
          newOrder.template_title || '',
          newOrder.template_thumbnail || '',
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

    // Keep JSON ledger updated
    jsonDb.createPendingRazorpayOrder(payload);
    return newOrder;
  }

  public async markRazorpayOrderPaid(params: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    template_id: string;
    user_id?: string;
    customer_name?: string;
    customer_email?: string;
  }): Promise<Order | null> {
    const template = await this.getTemplateById(params.template_id, true);
    if (!template) return null;

    const now = new Date().toISOString();

    if (this.isPostgres && this.pool) {
      // 1. Check if already marked paid for this payment ID
      const existingPayRes = await this.pool.query(
        `SELECT * FROM orders WHERE razorpay_payment_id = $1 OR payment_reference = $1`,
        [params.razorpay_payment_id]
      );
      if (existingPayRes.rows.length > 0 && existingPayRes.rows[0].payment_status === 'Paid') {
        const row = existingPayRes.rows[0];
        row.access_url = template.access_url;
        return this.mapOrderRow(row);
      }

      // 2. Find pending order by razorpay_order_id
      const pendingRes = await this.pool.query(
        `SELECT * FROM orders WHERE razorpay_order_id = $1 LIMIT 1`,
        [params.razorpay_order_id]
      );

      let orderId: string;
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
        // Fresh order creation
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
            (params.customer_name || 'Customer').trim(),
            (params.customer_email || 'customer@example.com').trim().toLowerCase(),
            params.user_id || null,
            template.id,
            template.title,
            template.thumbnail_url,
            template.sale_price ?? template.price,
            'INR',
            'Paid',
            'Granted',
            params.razorpay_payment_id,
            params.razorpay_order_id,
            params.razorpay_payment_id,
            template.access_url,
            now,
            now
          ]
        );
      }

      // Sync local JSON db
      jsonDb.markRazorpayOrderPaid(params);

      const finalRes = await this.pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
      return this.mapOrderRow(finalRes.rows[0]);
    }

    return jsonDb.markRazorpayOrderPaid(params);
  }

  /**
   * Authoritative lookup of user purchases with strict deduplication
   */
  public async getUserOrders(userId?: string, email?: string): Promise<Order[]> {
    const cleanEmail = email?.trim().toLowerCase();
    const cleanUid = userId?.trim();

    if (this.isPostgres && this.pool) {
      let query = `SELECT * FROM orders WHERE payment_status = 'Paid' AND (`;
      const params: any[] = [];

      if (cleanUid && cleanUid !== 'guest-checkout' && cleanEmail) {
        query += `user_id = $1 OR LOWER(customer_email) = $2)`;
        params.push(cleanUid, cleanEmail);
      } else if (cleanUid && cleanUid !== 'guest-checkout') {
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

      // Attach latest template access_url
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

    const fallback = jsonDb.getUserOrders(cleanUid || 'guest-checkout', cleanEmail);
    return this.deduplicateOrders(fallback);
  }

  public async getAllOrders(): Promise<Order[]> {
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query('SELECT * FROM orders ORDER BY created_at DESC');
      return res.rows.map(this.mapOrderRow);
    }
    return jsonDb.getAllOrders();
  }

  public async getOrderById(id: string): Promise<Order | null> {
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query(
        'SELECT * FROM orders WHERE id = $1 OR instamojo_payment_request_id = $1 OR instamojo_payment_id = $1 OR razorpay_order_id = $1 OR payment_reference = $1 LIMIT 1',
        [id]
      );
      if (res.rows.length === 0) return null;
      return this.mapOrderRow(res.rows[0]);
    }
    return jsonDb.getOrderById(id);
  }

  public async updateOrderStatus(id: string, paymentStatus: PaymentStatus, accessStatus?: AccessStatus): Promise<Order | null> {
    const now = new Date().toISOString();
    if (this.isPostgres && this.pool) {
      await this.pool.query(
        `UPDATE orders SET payment_status = $1, access_status = COALESCE($2, access_status), updated_at = $3 WHERE id = $4`,
        [paymentStatus, accessStatus || null, now, id]
      );
      jsonDb.updateOrderStatus(id, paymentStatus, accessStatus);
      return await this.getOrderById(id);
    }
    return jsonDb.updateOrderStatus(id, paymentStatus, accessStatus);
  }

  public async deleteOrder(id: string): Promise<boolean> {
    if (this.isPostgres && this.pool) {
      await this.pool.query('DELETE FROM orders WHERE id = $1', [id]);
    }
    return jsonDb.deleteOrder(id);
  }

  public async clearAllOrders(): Promise<boolean> {
    if (this.isPostgres && this.pool) {
      await this.pool.query('DELETE FROM orders');
    }
    (jsonDb as any).data.orders = [];
    (jsonDb as any).save();
    return true;
  }

  // Deduplicate orders so no user ever sees duplicate purchases
  private deduplicateOrders(orders: Order[]): Order[] {
    const seenPaymentIds = new Set<string>();
    const seenOrderIds = new Set<string>();
    const seenProductIds = new Set<string>();
    const seenInternalIds = new Set<string>();
    const uniqueOrders: Order[] = [];

    for (const ord of orders) {
      const mojoPayId = (ord.instamojo_payment_id || '').trim();
      const mojoReqId = (ord.instamojo_payment_request_id || '').trim();
      const rzpPayId = (ord.razorpay_payment_id || '').trim();
      const rzpOrderId = (ord.razorpay_order_id || '').trim();
      const refId = (ord.payment_reference || '').trim();
      const ordId = (ord.id || '').trim();
      const prodId = (ord.template_id || '').trim();

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
  public async createMessage(payload: {
    name: string;
    email: string;
    category: string;
    orderId?: string;
    subject?: string;
    message: string;
  }): Promise<ContactMessage> {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const ticketId = `OTL-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const msg: ContactMessage = {
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
        [msg.id, msg.ticket_id, msg.name, msg.email, msg.category, msg.order_id || null, msg.subject || null, msg.message, 'New', now]
      );
    }

    jsonDb.createContactMessage(payload as any);
    return msg;
  }

  public async getAllMessages(): Promise<ContactMessage[]> {
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query('SELECT * FROM messages ORDER BY created_at DESC');
      return res.rows.map(r => ({
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
    return jsonDb.getAllContactMessages();
  }

  public async deleteMessage(id: string): Promise<boolean> {
    if (this.isPostgres && this.pool) {
      await this.pool.query('DELETE FROM messages WHERE id = $1', [id]);
    }
    return jsonDb.deleteContactMessage(id);
  }


  // Row Mappers
  private mapTemplateRow(row: any): Template {
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      category: row.category,
      price: Number(row.price),
      original_price: row.original_price ? Number(row.original_price) : undefined,
      sale_price: row.sale_price ? Number(row.sale_price) : undefined,
      thumbnail_url: row.thumbnail_url,
      demo_url: row.demo_url,
      access_url: row.access_url,
      features: typeof row.features === 'string' ? JSON.parse(row.features) : (row.features || []),
      included_items: typeof row.included_items === 'string' ? JSON.parse(row.included_items) : (row.included_items || []),
      faq: typeof row.faq === 'string' ? JSON.parse(row.faq) : (row.faq || []),
      images: typeof row.images === 'string' ? JSON.parse(row.images) : (row.images || []),
      sheet_preview: typeof row.sheet_preview === 'string' ? JSON.parse(row.sheet_preview) : (row.sheet_preview || undefined),
      status: row.status as TemplateStatus,
      created_at: typeof row.created_at === 'object' ? row.created_at.toISOString() : row.created_at,
      updated_at: typeof row.updated_at === 'object' ? row.updated_at.toISOString() : row.updated_at
    };
  }

  private mapOrderRow(row: any): Order {
    return {
      id: row.id,
      customer_name: row.customer_name,
      customer_email: row.customer_email,
      user_id: row.user_id,
      template_id: row.template_id,
      template_title: row.template_title,
      template_thumbnail: row.template_thumbnail,
      amount: Number(row.amount),
      currency: row.currency || 'INR',
      payment_status: row.payment_status as PaymentStatus,
      access_status: row.access_status as AccessStatus,
      payment_reference: row.payment_reference,
      razorpay_order_id: row.razorpay_order_id,
      razorpay_payment_id: row.razorpay_payment_id,
      access_url: row.access_url,
      created_at: typeof row.created_at === 'object' ? row.created_at.toISOString() : row.created_at,
      updated_at: typeof row.updated_at === 'object' ? row.updated_at.toISOString() : row.updated_at
    };
  }

  // ==========================================
  // PASSWORD RESET (EMAIL OTP)
  // ==========================================
  public async savePasswordResetOtp(email: string, otpCode: string, expiresMinutes = 15): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    const id = `otp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

    // In-memory fallback
    this.localOtpResets.set(cleanEmail, { otp: otpCode, expiresAt: expiresAt.getTime() });

    if (this.isPostgres && this.pool) {
      try {
        await this.pool.query('DELETE FROM password_resets WHERE LOWER(email) = $1', [cleanEmail]);
        await this.pool.query(
          `INSERT INTO password_resets (id, email, otp_code, expires_at, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [id, cleanEmail, otpCode, expiresAt.toISOString()]
        );
      } catch (err) {
        console.error('[PostgreSQL] Failed to save OTP in DB, fallback in memory:', err);
      }
    }
  }

  public async verifyPasswordResetOtp(email: string, otpCode: string): Promise<boolean> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otpCode.trim();

    // Check Postgres
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
        console.error('[PostgreSQL] Error verifying OTP in DB:', err);
      }
    }

    // Fallback in-memory
    const memoryOtp = this.localOtpResets.get(cleanEmail);
    if (memoryOtp && memoryOtp.otp === cleanOtp && memoryOtp.expiresAt > Date.now()) {
      return true;
    }

    return false;
  }

  public async resetPasswordWithOtp(email: string, otpCode: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const isValid = await this.verifyPasswordResetOtp(cleanEmail, otpCode);
    if (!isValid) {
      return { success: false, error: 'Invalid or expired OTP verification code. Please request a new code.' };
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(newPassword.trim(), salt);
    const now = new Date().toISOString();

    // Delete used OTP
    this.localOtpResets.delete(cleanEmail);
    if (this.isPostgres && this.pool) {
      try {
        await this.pool.query('DELETE FROM password_resets WHERE LOWER(email) = $1', [cleanEmail]);

        // 1. Update user if exists
        await this.pool.query(
          'UPDATE users SET password_hash = $1, updated_at = $2 WHERE LOWER(email) = $3',
          [passwordHash, now, cleanEmail]
        );

        // 2. Update admin if exists
        await this.pool.query(
          'UPDATE admins SET password_hash = $1, updated_at = $2 WHERE LOWER(email) = $3',
          [passwordHash, now, cleanEmail]
        );
      } catch (err) {
        console.error('[PostgreSQL] Error updating password after OTP:', err);
      }
    }

    // Update local JSON fallback if present
    try {
      jsonDb.setAdminPassword(cleanEmail, newPassword);
    } catch {}

    return { success: true };
  }
}

export const pgDb = new DatabaseService();
