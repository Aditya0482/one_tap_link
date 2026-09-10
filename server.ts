import express, { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server/db';
import { TemplateStatus, PaymentStatus, AccessStatus, AppSettings } from './src/types';

// In-memory session store for admin tokens
const adminSessions = new Map<string, { adminId: string; email: string; expiresAt: number }>();

function createSessionToken(adminId: string, email: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  // 7-day session
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  adminSessions.set(token, { adminId, email, expiresAt });
  return token;
}

function adminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.substring(7);
  const session = adminSessions.get(token);

  if (!session || session.expiresAt < Date.now()) {
    if (session) adminSessions.delete(token);
    return res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
  }

  (req as any).admin = session;
  next();
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Basic API Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ==========================================
  // PUBLIC STOREFRONT ENDPOINTS
  // ==========================================

  // 1. Get all published templates (access_url stripped)
  app.get('/api/templates', (req, res) => {
    try {
      const templates = db.getPublishedTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({ error: 'Failed to fetch templates' });
    }
  });

  // 2. Get single template by slug or ID
  app.get('/api/templates/:slugOrId', (req, res) => {
    try {
      const { slugOrId } = req.params;
      let template = db.getTemplateBySlug(slugOrId);
      if (!template) {
        template = db.getTemplateById(slugOrId);
      }

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      res.json(template);
    } catch (error) {
      console.error('Error fetching template:', error);
      res.status(500).json({ error: 'Failed to fetch template' });
    }
  });

  // 3. Checkout: Create order & process payment (Server-Side Verified)
  app.post('/api/checkout', (req, res) => {
    try {
      const { customer_name, customer_email, template_id, user_id } = req.body;

      if (!customer_name || !customer_email || !template_id) {
        return res.status(400).json({ error: 'Please provide full name, email, and template selection.' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customer_email)) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }

      const order = db.createOrder({
        customer_name,
        customer_email,
        template_id,
        user_id
      });

      if (!order) {
        return res.status(404).json({ error: 'The selected template is unavailable.' });
      }

      // Sync Order to Google Sheets (Orders Webhook) if configured
      try {
        const settings = db.getSettings();
        const ordersWebhookUrl = process.env.GOOGLE_SHEETS_ORDERS_WEBHOOK_URL || settings.google_sheet_orders_webhook_url;
        if (ordersWebhookUrl && ordersWebhookUrl.trim().startsWith('http')) {
          const orderPayload = {
            order_id: order.id,
            timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            customer_name: order.customer_name,
            customer_email: order.customer_email,
            product_name: order.template_title,
            amount: order.amount,
            payment_id: order.razorpay_payment_id || 'DIRECT_FREE',
            order_ref: order.razorpay_order_id || order.id,
            status: order.payment_status
          };
          forwardToGoogleSheet(ordersWebhookUrl.trim(), orderPayload).catch(err => {
            console.error('[Google Sheet] Orders webhook forward error:', err);
          });
        }
      } catch (sheetErr) {
        console.error('[Google Sheet] Orders sync error in checkout:', sheetErr);
      }

      res.status(201).json({
        success: true,
        order
      });
    } catch (error) {
      console.error('Checkout error:', error);
      res.status(500).json({ error: 'Checkout processing failed' });
    }
  });

  // 3b. Razorpay Public Configuration
  app.get('/api/razorpay/config', (_req, res) => {
    const creds = db.getRazorpayCredentials();
    res.json({
      key_id: creds.key_id,
      is_configured: creds.is_configured,
      mode: creds.mode,
      is_live: creds.is_live
    });
  });

  // 3c. Razorpay: Create Order (Server-Side)
  app.post('/api/razorpay/create-order', async (req, res) => {
    try {
      const { template_id, customer_name, customer_email, user_id } = req.body;

      if (!template_id) {
        return res.status(400).json({ error: 'Template ID is required.' });
      }

      // Security: Always fetch product and price from trusted server DB
      const template = db.getTemplateById(template_id, true);
      if (!template || template.status !== 'Published') {
        return res.status(404).json({ error: 'Selected template is not available for purchase.' });
      }

      const trustedPrice = template.sale_price ?? template.price;
      const amountInPaise = Math.round(trustedPrice * 100);

      const creds = db.getRazorpayCredentials();
      const keyId = creds.key_id;
      const keySecret = creds.key_secret;

      let razorpayOrderId: string;
      let isSimulation = false;
      let warningMsg: string | undefined;

      if (keyId && keySecret) {
        // Real Razorpay API Order Creation
        try {
          const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
          const receipt = `rcpt_${Date.now().toString().slice(-8)}`;
          
          const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${authHeader}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              amount: amountInPaise,
              currency: 'INR',
              receipt,
              notes: {
                template_id: template.id,
                template_title: template.title,
                user_id: user_id || '',
                mode: creds.mode
              }
            })
          });

          if (!rzpResponse.ok) {
            const errData = await rzpResponse.json().catch(() => ({}));
            console.error('Razorpay Orders API error:', errData);
            return res.status(502).json({
              error: 'Failed to create order with Razorpay. Please check Razorpay keys.',
              details: (errData as any).error?.description || 'Razorpay Gateway Error'
            });
          }

          const rzpOrder = await rzpResponse.json() as { id: string; amount: number; currency: string };
          razorpayOrderId = rzpOrder.id;
        } catch (apiErr: any) {
          console.error('Failed to communicate with Razorpay API:', apiErr);
          return res.status(502).json({
            error: 'Network error communicating with Razorpay payment gateway.',
            details: apiErr.message
          });
        }
      } else {
        // Fallback Test Simulation mode when keys are not yet provided in secrets
        isSimulation = true;
        razorpayOrderId = `order_test_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        warningMsg = 'Razorpay Keys (RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET) not set. Running in Test Simulation mode.';
        console.warn(`[Razorpay] ${warningMsg}`);
      }

      // Record pending order in DB
      const pendingOrder = db.createPendingRazorpayOrder({
        customer_name: customer_name || 'Customer',
        customer_email: customer_email || 'customer@onetaplink.com',
        user_id,
        template_id: template.id,
        razorpay_order_id: razorpayOrderId
      });

      res.status(200).json({
        success: true,
        key_id: keyId || 'rzp_test_placeholder',
        order_id: razorpayOrderId,
        amount: amountInPaise,
        currency: 'INR',
        product_id: template.id,
        product_name: template.title,
        internal_order_id: pendingOrder?.id,
        is_test_simulation: isSimulation,
        mode: creds.mode,
        is_live: creds.is_live,
        warning: warningMsg
      });
    } catch (error: any) {
      console.error('Razorpay order creation error:', error);
      res.status(500).json({ error: 'Internal server error while creating payment order.' });
    }
  });

  // 3d. Razorpay: Verify Payment Signature & Grant Access
  app.post('/api/razorpay/verify-payment', async (req, res) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        template_id,
        user_id,
        customer_name,
        customer_email
      } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !template_id) {
        return res.status(400).json({ error: 'Missing required payment verification details.' });
      }

      // 1. Verify template exists
      const template = db.getTemplateById(template_id, true);
      if (!template) {
        return res.status(404).json({ error: 'Template not found.' });
      }

      // 2. Cryptographic Signature Verification
      const creds = db.getRazorpayCredentials();
      const keySecret = creds.key_secret;
      if (keySecret) {
        if (!razorpay_signature || razorpay_signature === 'simulated_test_signature') {
          return res.status(400).json({
            success: false,
            error: 'Payment verification failed: Valid cryptographic signature required.'
          });
        }
        const bodyToSign = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
          .createHmac('sha256', keySecret)
          .update(bodyToSign)
          .digest('hex');

        if (expectedSignature !== razorpay_signature) {
          console.error('[Razorpay] Signature mismatch!', {
            expected: expectedSignature,
            received: razorpay_signature
          });
          return res.status(400).json({
            success: false,
            error: 'Invalid payment signature. Verification failed.'
          });
        }
      }

      // 3. Mark order as Paid in backend DB & grant access
      const verifiedOrder = db.markRazorpayOrderPaid({
        razorpay_order_id,
        razorpay_payment_id,
        template_id: template.id,
        user_id,
        customer_name,
        customer_email
      });

      if (!verifiedOrder) {
        return res.status(500).json({ error: 'Failed to record completed purchase.' });
      }

      // Sync Paid Order to Google Sheets (Orders Webhook) if configured
      try {
        const settings = db.getSettings();
        const ordersWebhookUrl = process.env.GOOGLE_SHEETS_ORDERS_WEBHOOK_URL || settings.google_sheet_orders_webhook_url;
        if (ordersWebhookUrl && ordersWebhookUrl.trim().startsWith('http')) {
          const orderPayload = {
            order_id: verifiedOrder.id,
            timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            customer_name: verifiedOrder.customer_name,
            customer_email: verifiedOrder.customer_email,
            product_name: template.title,
            amount: verifiedOrder.amount,
            payment_id: razorpay_payment_id,
            order_ref: razorpay_order_id,
            status: 'paid'
          };
          forwardToGoogleSheet(ordersWebhookUrl.trim(), orderPayload).catch(err => {
            console.error('[Google Sheet] Orders webhook forward error on verify:', err);
          });
        }
      } catch (sheetErr) {
        console.error('[Google Sheet] Orders sync error on verify:', sheetErr);
      }

      // 4. Return verified purchase record (for local state and Firestore synchronization)
      const purchaseRecord = {
        userId: user_id || verifiedOrder.user_id || 'anonymous',
        customerEmail: verifiedOrder.customer_email,
        customerName: verifiedOrder.customer_name,
        productId: template.id,
        productName: template.title,
        amount: verifiedOrder.amount,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        paymentStatus: 'paid',
        purchasedAt: verifiedOrder.created_at || new Date().toISOString(),
        accessUrl: template.access_url,
        thumbnailUrl: template.thumbnail_url
      };

      res.json({
        success: true,
        verified: true,
        order: verifiedOrder,
        purchase: purchaseRecord,
        message: 'Payment verified successfully! Access unlocked.'
      });
    } catch (error: any) {
      console.error('Razorpay verification error:', error);
      res.status(500).json({ error: 'Internal server error while verifying payment.' });
    }
  });

  // 3e. Razorpay: Optional Webhook Endpoint for payment notifications
  app.post('/api/razorpay/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    try {
      const creds = db.getRazorpayCredentials();
      const webhookSecret = creds.webhook_secret;
      const signature = req.headers['x-razorpay-signature'] as string;

      if (webhookSecret && signature) {
        const rawBody = typeof req.body === 'string' ? req.body : req.body.toString('utf-8');
        const expectedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(rawBody)
          .digest('hex');

        if (expectedSignature !== signature) {
          console.warn('[Razorpay Webhook] Invalid webhook signature');
          return res.status(400).send('Invalid signature');
        }
      }

      const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (event.event === 'order.paid' || event.event === 'payment.captured') {
        const payment = event.payload?.payment?.entity;
        const orderId = payment?.order_id;
        const paymentId = payment?.id;
        const templateId = payment?.notes?.template_id;
        const userId = payment?.notes?.user_id;

        if (orderId && paymentId && templateId) {
          db.markRazorpayOrderPaid({
            razorpay_order_id: orderId,
            razorpay_payment_id: paymentId,
            template_id: templateId,
            user_id: userId,
            customer_name: payment?.notes?.customer_name,
            customer_email: payment?.email
          });
        }
      }

      res.status(200).json({ status: 'ok' });
    } catch (err) {
      console.error('Error handling webhook:', err);
      res.status(500).send('Webhook handler error');
    }
  });

  // 3f. Customer Purchases Lookup (Filtered by user Firebase UID and/or customer email across all devices)
  app.get(['/api/user/purchases', '/api/user/purchases-lookup', '/api/user/purchases/:userId'], (req, res) => {
    try {
      const userId = (req.params.userId || req.query.userId || '').toString().trim();
      const email = (req.query.email || '').toString().trim();
      if (!userId && !email) {
        return res.status(400).json({ error: 'User ID or email is required.' });
      }

      let orders = db.getUserOrders(userId, email);
      if (email && orders.length === 0) {
        orders = db.getOrdersByEmail(email);
      }
      res.json({ success: true, purchases: orders });
    } catch (error) {
      console.error('Error fetching user purchases:', error);
      res.status(500).json({ error: 'Failed to fetch customer purchases' });
    }
  });

  // 3g. Clear Customer Purchases (Removes user test purchases from server database)
  app.delete('/api/user/purchases/:userId', (req, res) => {
    try {
      const userId = req.params.userId;
      const email = req.query.email as string | undefined;
      const count = db.clearUserOrders(userId, email);
      res.json({ success: true, cleared: count });
    } catch (error) {
      console.error('Error clearing customer purchases:', error);
      res.status(500).json({ error: 'Failed to clear customer purchases' });
    }
  });

  // 4. Order lookup by Order ID (Protected: only delivers access_url if Paid)
  app.get('/api/orders/:id', (req, res) => {
    try {
      const order = db.getOrderById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json(order);
    } catch (error) {
      console.error('Order fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch order' });
    }
  });

  // 5. Contact Inquiries -> Stored & Synced directly to Google Sheet
  async function forwardToGoogleSheet(webhookUrl: string, payload: any): Promise<{ success: boolean; error?: string }> {
    try {
      if (webhookUrl.includes('docs.google.com/spreadsheets')) {
        return {
          success: false,
          error: 'The URL provided is a Google Sheets view link. Google requires a Google Apps Script Web App URL (starts with https://script.google.com/macros/s/.../exec) to receive webhook submissions.'
        };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout

      // Use text/plain so Google Apps Script parses in e.postData.contents without CORS/redirect issues
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload),
        redirect: 'follow',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseText = await response.text().catch(() => '');

      // Check if Google rejected and redirected to Google Login / 401/403 Unauthorized
      if (
        response.status === 401 || 
        response.status === 403 || 
        (response.url && (response.url.includes('accounts.google.com') || response.url.includes('/accounts'))) ||
        responseText.includes('drivelogo') ||
        responseText.includes('request-access') ||
        responseText.includes('需要存取權') ||
        responseText.includes('need access') ||
        responseText.includes('Sign in - Google Accounts')
      ) {
        return {
          success: false,
          error: "Permission Denied: Google Apps Script 'Who has access' is set to 'Only myself'. Please open Inquiry Sheet > Extensions > Apps Script > Deploy > Manage deployments > Edit (pencil icon) > set 'Who has access' to 'Anyone' > click Deploy."
        };
      }

      if (!response.ok && response.status !== 302) {
        return { success: false, error: `Google Sheet responded with status ${response.status}` };
      }

      // If response text is returned, check for script error
      if (responseText && responseText.includes('"status":"error"')) {
        try {
          const parsed = JSON.parse(responseText);
          return { success: false, error: parsed.message || 'Script error inside Google Sheet' };
        } catch (e) {
          return { success: false, error: 'Script returned error' };
        }
      }

      return { success: true };
    } catch (err: any) {
      console.error('Google Sheet forwarding error:', err?.message || err);
      return { success: false, error: err?.message || 'Failed to connect to Google Sheet webhook' };
    }
  }

  app.post('/api/contact', async (req, res) => {
    try {
      const { name, email, category, orderId, subject, message } = req.body;

      const missingFields: string[] = [];
      if (!name || !name.trim()) missingFields.push('Full Name');
      if (!email || !email.trim()) missingFields.push('Email Address');
      if (!category || !category.trim()) missingFields.push('Inquiry Category');
      if (!message || !message.trim()) missingFields.push('Message');

      if (missingFields.length > 0) {
        return res.status(400).json({
          error: `Please fill in all required fields: ${missingFields.join(', ')}.`,
          missingFields
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({
          error: 'Please enter a valid and deliverable email address.',
          missingFields: ['Valid Email Address']
        });
      }

      // Save in local database first so no message is ever lost
      const savedMessage = db.createContactMessage({
        name,
        email,
        category,
        order_id: orderId,
        subject,
        message
      });

      // Check for Google Sheet webhook (Inquiry Webhook)
      const settings = db.getSettings();
      const webhookUrl = process.env.GOOGLE_SHEETS_INQUIRY_WEBHOOK_URL || 
                         settings.google_sheet_inquiry_webhook_url || 
                         process.env.GOOGLE_SHEETS_WEBHOOK_URL || 
                         settings.google_sheet_webhook_url;

      let synced = false;
      let syncError: string | undefined;

      if (webhookUrl && webhookUrl.trim().startsWith('http')) {
        const sheetPayload = {
          ticket_id: savedMessage.ticket_id,
          timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          name: savedMessage.name,
          email: savedMessage.email,
          category: savedMessage.category,
          order_id: savedMessage.order_id || 'N/A',
          subject: savedMessage.subject || 'N/A',
          message: savedMessage.message
        };

        const result = await forwardToGoogleSheet(webhookUrl.trim(), sheetPayload);
        synced = result.success;
        syncError = result.error;
        db.updateContactMessageSync(savedMessage.id, synced, syncError);
      }

      res.status(201).json({
        success: true,
        ticket_id: savedMessage.ticket_id,
        synced_to_sheet: synced,
        message: 'Your inquiry has been registered successfully.'
      });
    } catch (error) {
      console.error('Contact submit error:', error);
      res.status(500).json({ error: 'Failed to process inquiry. Please try again or email us directly.' });
    }
  });

  // ==========================================
  // ADMIN AUTH & MANAGEMENT ENDPOINTS
  // ==========================================

  // Helper to authenticate against Firebase Auth
  async function verifyFirebaseCredentials(email: string, password: string): Promise<{ success: boolean; uid?: string; email?: string; error?: string }> {
    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      let apiKey = 'AIzaSyA5P693fc1mJXeCWk2rlbwvjecTt9CV6ks';
      if (fs.existsSync(configPath)) {
        const conf = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (conf.apiKey) apiKey = conf.apiKey;
      }

      const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true
        })
      });

      const data: any = await response.json();
      if (response.ok && data.localId) {
        return { success: true, uid: data.localId, email: data.email || email };
      }

      const errMsg = data?.error?.message || 'Invalid credentials';
      return { success: false, error: errMsg };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Firebase auth failed' };
    }
  }

  // Admin Login
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      // 1. Authenticate with Firebase Authentication first (for users created in Firebase Console)
      const fbResult = await verifyFirebaseCredentials(cleanEmail, cleanPassword);
      if (fbResult.success && fbResult.uid) {
        const admin = db.createOrGetFirebaseAdmin(fbResult.email || cleanEmail, fbResult.uid);
        const token = createSessionToken(admin.id, admin.email);
        return res.json({
          success: true,
          token,
          admin: {
            id: admin.id,
            email: admin.email
          }
        });
      }

      // 2. Fallback: check local store admin credentials
      const localAdmin = db.verifyAdmin(cleanEmail, cleanPassword);
      if (localAdmin) {
        const token = createSessionToken(localAdmin.id, localAdmin.email);
        return res.json({
          success: true,
          token,
          admin: {
            id: localAdmin.id,
            email: localAdmin.email
          }
        });
      }

      // 3. Informative error messages from Firebase
      if (fbResult.error === 'INVALID_LOGIN_CREDENTIALS') {
        return res.status(401).json({ error: 'Invalid email or password. Please verify your credentials.' });
      } else if (fbResult.error === 'USER_DISABLED') {
        return res.status(401).json({ error: 'This user account is disabled in Firebase.' });
      } else if (fbResult.error === 'OPERATION_NOT_ALLOWED' || fbResult.error === 'PASSWORD_LOGIN_DISABLED') {
        return res.status(401).json({ error: 'Email/Password sign-in method is disabled in Firebase.' });
      }

      return res.status(401).json({ error: 'Invalid email or password. Access denied.' });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Admin Sign Up / Register
  app.post(['/api/admin/signup', '/api/admin/set-password'], (req, res) => {
    try {
      const { email, password, deleteOldDefault } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanPassword = (password || '').trim();

      if (!cleanEmail || !cleanPassword) {
        return res.status(400).json({ error: 'Both email and password are required' });
      }

      if (cleanPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }

      const admin = db.setAdminPassword(cleanEmail, cleanPassword);

      // If requested or if setting a custom email, delete the old insecure default admin
      if (deleteOldDefault && cleanEmail !== 'admin@onetaplink.com') {
        db.deleteAdmin('admin@onetaplink.com');
      }

      const token = createSessionToken(admin.id, admin.email);
      res.json({
        success: true,
        token,
        admin: {
          id: admin.id,
          email: admin.email
        },
        message: 'Admin account created successfully'
      });
    } catch (error: any) {
      console.error('Sign up error:', error);
      res.status(500).json({ error: error?.message || 'Failed to create admin account' });
    }
  });

  // Admin Firebase Authentication Sync (Token verification + Whitelist check)
  app.post('/api/admin/firebase-auth', async (req, res) => {
    try {
      const { email, idToken, uid } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email required for Firebase authentication' });
      }

      const cleanEmail = email.trim().toLowerCase();

      // If idToken is provided, verify it against Firebase REST API
      if (idToken) {
        const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
        let apiKey = 'AIzaSyA5P693fc1mJXeCWk2rlbwvjecTt9CV6ks';
        if (fs.existsSync(configPath)) {
          const conf = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (conf.apiKey) apiKey = conf.apiKey;
        }

        const verifyRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken })
        });
        const verifyData: any = await verifyRes.json();
        if (!verifyRes.ok || !verifyData.users || verifyData.users.length === 0) {
          return res.status(401).json({ error: 'Invalid or expired Firebase authentication token' });
        }
        const verifiedEmail = verifyData.users[0].email?.toLowerCase();
        if (verifiedEmail !== cleanEmail) {
          return res.status(403).json({ error: 'Identity verification failed: Email mismatch' });
        }
      }

      // Security check: Must be an authorized admin email
      if (!db.isAuthorizedAdmin(cleanEmail)) {
        return res.status(403).json({ error: 'Access Denied: This account is not authorized as an administrator.' });
      }

      const admin = db.createOrGetFirebaseAdmin(cleanEmail, uid);
      if (!admin) {
        return res.status(403).json({ error: 'Access Denied: Account not authorized.' });
      }

      const token = createSessionToken(admin.id, admin.email);

      res.json({
        success: true,
        token,
        admin: {
          id: admin.id,
          email: admin.email
        }
      });
    } catch (error: any) {
      console.error('Firebase auth endpoint error:', error);
      res.status(500).json({ error: error?.message || 'Firebase login failed' });
    }
  });

  // Admin Profile Check
  app.get('/api/admin/me', adminAuthMiddleware, (req, res) => {
    const session = (req as any).admin;
    res.json({
      admin: {
        id: session.adminId,
        email: session.email
      }
    });
  });

  // Admin Dashboard Statistics
  app.get('/api/admin/stats', adminAuthMiddleware, (req, res) => {
    try {
      const stats = db.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error('Stats error:', error);
      res.status(500).json({ error: 'Failed to calculate stats' });
    }
  });

  // Admin: Reset / Clear Test Orders & Inquiries Data
  app.post('/api/admin/clear-test-data', adminAuthMiddleware, (req, res) => {
    try {
      const clearAll = req.body?.clearAll === true;
      db.clearTestData(clearAll);
      res.json({ success: true, message: 'All test data reset to zero successfully' });
    } catch (error) {
      console.error('Clear test data error:', error);
      res.status(500).json({ error: 'Failed to clear test data' });
    }
  });

  // Admin: Delete Single Order
  app.delete('/api/admin/orders/:id', adminAuthMiddleware, (req, res) => {
    try {
      const orderId = decodeURIComponent(req.params.id || '').trim();
      const deleted = db.deleteOrder(orderId);
      if (!deleted) {
        return res.status(404).json({ error: 'Order not found or already removed' });
      }
      res.json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
      console.error('Delete order error:', error);
      res.status(500).json({ error: 'Failed to delete order' });
    }
  });

  // Admin: Restore Sample Template
  app.post('/api/admin/restore-sample-template', adminAuthMiddleware, (req, res) => {
    try {
      const template = db.restoreSampleTemplate();
      res.json({ success: true, template });
    } catch (error) {
      console.error('Restore sample template error:', error);
      res.status(500).json({ error: 'Failed to restore sample template' });
    }
  });

  // Ensure uploads directory exists and is served statically
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));
  // If static middleware didn't find the file on ephemeral disk (e.g. wiped after container restart), redirect to fallback preview
  app.get('/uploads/:filename', (_req, res) => {
    res.redirect('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80');
  });

  // Admin: Upload Image (Base64 or URL)
  app.post('/api/admin/upload-image', adminAuthMiddleware, (req, res) => {
    try {
      const { image, name } = req.body;
      if (!image) {
        return res.status(400).json({ error: 'Image data is required' });
      }

      // If it's already an HTTP URL, return as is
      if (typeof image === 'string' && (image.startsWith('http://') || image.startsWith('https://'))) {
        return res.json({ url: image, success: true });
      }

      // Match base64 data URI
      const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: 'Invalid image format. Expected data URL or HTTP URL.' });
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      let ext = 'png';
      if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
      else if (mimeType.includes('webp')) ext = 'webp';
      else if (mimeType.includes('gif')) ext = 'gif';

      const safeName = name ? name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30) : 'img';
      const filename = `${safeName}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
      const filePath = path.join(uploadsDir, filename);

      try {
        fs.writeFileSync(filePath, buffer);
      } catch (writeErr) {
        console.warn('Local disk write notice (ephemeral storage):', writeErr);
      }

      // Return the base64 URI directly so client stores permanent data in Firestore.
      // This prevents the image from disappearing when Railway/Render container restarts.
      res.json({ url: image, filename, success: true });
    } catch (error: any) {
      console.error('Image upload error:', error);
      res.status(500).json({ error: 'Failed to upload image: ' + (error?.message || '') });
    }
  });

  // Admin: Get All Templates (Including Drafts & Access URLs)
  app.get('/api/admin/templates', adminAuthMiddleware, (req, res) => {
    try {
      const templates = db.getAllTemplatesAdmin();
      res.json(templates);
    } catch (error) {
      console.error('Admin templates fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch templates' });
    }
  });

  // Admin: Create New Template
  app.post('/api/admin/templates', adminAuthMiddleware, (req, res) => {
    try {
      const {
        title,
        slug,
        description,
        category,
        price,
        original_price,
        sale_price,
        thumbnail_url,
        demo_url,
        access_url,
        features,
        included_items,
        faq,
        status,
        sheet_preview,
        images,
        id
      } = req.body;

      if (!title || !description || price === undefined) {
        return res.status(400).json({ error: 'Title, description, and price are required' });
      }

      const formattedSlug = slug
        ? slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const newTemplate = db.createTemplate({
        id: id?.trim() || undefined,
        title: title.trim(),
        slug: formattedSlug || `tpl-${Date.now()}`,
        description: description.trim(),
        category: category || 'General',
        price: Number(price) || 0,
        original_price: original_price ? Number(original_price) : undefined,
        sale_price: sale_price ? Number(sale_price) : undefined,
        thumbnail_url: thumbnail_url?.trim() || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
        demo_url: demo_url?.trim() || undefined,
        access_url: access_url?.trim() || 'https://docs.google.com/spreadsheets/u/0/',
        features: Array.isArray(features) ? features : [],
        included_items: Array.isArray(included_items) ? included_items : [],
        faq: Array.isArray(faq) ? faq : [],
        status: (status as TemplateStatus) || 'Published',
        sheet_preview: sheet_preview || undefined,
        images: Array.isArray(images) ? images : []
      });

      res.status(201).json(newTemplate);
    } catch (error) {
      console.error('Create template error:', error);
      res.status(500).json({ error: 'Failed to create template' });
    }
  });

  // Admin: Update Template
  app.put('/api/admin/templates/:id', adminAuthMiddleware, (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (updates.slug) {
        updates.slug = updates.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      if (updates.price !== undefined) updates.price = Number(updates.price);
      if (updates.original_price !== undefined) updates.original_price = Number(updates.original_price);
      if (updates.sale_price !== undefined) updates.sale_price = Number(updates.sale_price);

      const updated = db.updateTemplate(id, updates);
      if (!updated) {
        return res.status(404).json({ error: 'Template not found' });
      }

      res.json(updated);
    } catch (error) {
      console.error('Update template error:', error);
      res.status(500).json({ error: 'Failed to update template' });
    }
  });

  // Admin: Delete Template
  app.delete('/api/admin/templates/:id', adminAuthMiddleware, (req, res) => {
    try {
      const { id } = req.params;
      const slug = (req.query.slug as string) || undefined;
      const title = (req.query.title as string) || undefined;
      db.deleteTemplate(id, slug, title);
      res.json({ success: true, message: 'Template deleted' });
    } catch (error) {
      console.error('Delete template error:', error);
      res.status(500).json({ error: 'Failed to delete template' });
    }
  });

  // Admin: Deduplicate & Clean Templates
  app.post('/api/admin/templates/cleanup-duplicates', adminAuthMiddleware, (_req, res) => {
    try {
      const templates = db.cleanupDuplicates();
      res.json({ success: true, count: templates.length, templates });
    } catch (error) {
      console.error('Cleanup templates error:', error);
      res.status(500).json({ error: 'Failed to cleanup duplicate templates' });
    }
  });

  // Admin: Get All Orders
  app.get('/api/admin/orders', adminAuthMiddleware, (req, res) => {
    try {
      const orders = db.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error('Admin orders fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  // Admin: Update Order Status
  app.patch('/api/admin/orders/:id/status', adminAuthMiddleware, (req, res) => {
    try {
      const { id } = req.params;
      const { payment_status, access_status } = req.body;

      if (!payment_status) {
        return res.status(400).json({ error: 'Payment status required' });
      }

      const updatedOrder = db.updateOrderStatus(id, payment_status as PaymentStatus, access_status as AccessStatus);
      if (!updatedOrder) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json(updatedOrder);
    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({ error: 'Failed to update order status' });
    }
  });

  // Admin: Get all customer contact messages
  app.get('/api/admin/messages', adminAuthMiddleware, (req, res) => {
    try {
      const messages = db.getAllContactMessages();
      res.json(messages);
    } catch (error) {
      console.error('Admin messages fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch contact messages' });
    }
  });

  // Admin: Delete customer contact message
  app.delete('/api/admin/messages/:id', adminAuthMiddleware, (req, res) => {
    try {
      const { id } = req.params;
      const success = db.deleteContactMessage(id);
      if (!success) {
        return res.status(404).json({ error: 'Inquiry not found' });
      }
      res.json({ success: true, message: 'Inquiry deleted successfully' });
    } catch (error) {
      console.error('Admin delete message error:', error);
      res.status(500).json({ error: 'Failed to delete contact inquiry' });
    }
  });

  // Admin: Get settings (Google Sheet Webhooks)
  app.get('/api/admin/settings', adminAuthMiddleware, (req, res) => {
    try {
      const settings = db.getSettings();

      res.json({
        google_sheet_webhook_url: settings.google_sheet_webhook_url || '',
        google_sheet_orders_webhook_url: process.env.GOOGLE_SHEETS_ORDERS_WEBHOOK_URL || settings.google_sheet_orders_webhook_url || '',
        google_sheet_inquiry_webhook_url: process.env.GOOGLE_SHEETS_INQUIRY_WEBHOOK_URL || settings.google_sheet_inquiry_webhook_url || settings.google_sheet_webhook_url || '',
        env_configured: !!(process.env.GOOGLE_SHEETS_WEBHOOK_URL || process.env.GOOGLE_SHEETS_ORDERS_WEBHOOK_URL || process.env.GOOGLE_SHEETS_INQUIRY_WEBHOOK_URL)
      });
    } catch (error) {
      console.error('Admin settings fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  // Admin: Update settings (Google Sheet Webhooks)
  app.post('/api/admin/settings', adminAuthMiddleware, (req, res) => {
    try {
      const {
        google_sheet_webhook_url,
        google_sheet_orders_webhook_url,
        google_sheet_inquiry_webhook_url
      } = req.body;

      const payloadToUpdate: Partial<AppSettings> = {};
      if (typeof google_sheet_webhook_url === 'string') {
        payloadToUpdate.google_sheet_webhook_url = google_sheet_webhook_url.trim();
      }
      if (typeof google_sheet_orders_webhook_url === 'string') {
        payloadToUpdate.google_sheet_orders_webhook_url = google_sheet_orders_webhook_url.trim();
      }
      if (typeof google_sheet_inquiry_webhook_url === 'string') {
        payloadToUpdate.google_sheet_inquiry_webhook_url = google_sheet_inquiry_webhook_url.trim();
      }

      db.updateSettings(payloadToUpdate);

      res.json({
        success: true,
        message: 'Settings updated successfully.'
      });
    } catch (error) {
      console.error('Admin settings update error:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // Admin: Test Google Sheet Webhook
  app.post('/api/admin/test-sheet-webhook', adminAuthMiddleware, async (req, res) => {
    try {
      const { webhook_url, type } = req.body;
      const settings = db.getSettings();
      
      let targetUrl = webhook_url;
      if (!targetUrl) {
        if (type === 'orders') {
          targetUrl = process.env.GOOGLE_SHEETS_ORDERS_WEBHOOK_URL || settings.google_sheet_orders_webhook_url;
        } else {
          targetUrl = process.env.GOOGLE_SHEETS_INQUIRY_WEBHOOK_URL || settings.google_sheet_inquiry_webhook_url || process.env.GOOGLE_SHEETS_WEBHOOK_URL || settings.google_sheet_webhook_url;
        }
      }

      if (!targetUrl || !targetUrl.trim().startsWith('http')) {
        return res.status(400).json({ error: 'Please provide a valid HTTP/HTTPS Webhook URL' });
      }

      let testPayload: any;

      if (type === 'orders') {
        testPayload = {
          order_id: `ORD-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          customer_name: 'OneTapLink Test Buyer',
          customer_email: 'buyer@example.com',
          product_name: 'Master Budget Planner (Test Row)',
          amount: 499,
          payment_id: `pay_test_${Date.now().toString().slice(-6)}`,
          order_ref: `order_test_${Date.now().toString().slice(-6)}`,
          status: 'paid'
        };
      } else {
        testPayload = {
          ticket_id: `TKT-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          name: 'OneTapLink Inquiry Tester',
          email: 'tester@example.com',
          category: 'General Support',
          order_id: 'TEST-ORD',
          subject: 'Google Sheet Webhook Connection Test',
          message: 'Congratulations! Your Google Sheet is successfully connected to OneTapLink inquiries.'
        };
      }

      const result = await forwardToGoogleSheet(targetUrl.trim(), testPayload);
      if (!result.success) {
        return res.status(502).json({ error: result.error || 'Failed to send test row to Google Sheet' });
      }

      res.json({ 
        success: true, 
        message: type === 'orders' 
          ? 'Test order row appended to Orders Google Sheet successfully!' 
          : 'Test inquiry row appended to Inquiry Google Sheet successfully!' 
      });
    } catch (error: any) {
      console.error('Test webhook error:', error);
      res.status(500).json({ error: error?.message || 'Webhook test failed' });
    }
  });

  // Admin: Resync a specific inquiry to Google Sheet
  app.post('/api/admin/resync-message/:id', adminAuthMiddleware, async (req, res) => {
    try {
      const msg = db.getAllContactMessages().find(m => m.id === req.params.id);
      if (!msg) {
        return res.status(404).json({ error: 'Inquiry not found' });
      }

      const settings = db.getSettings();
      const webhookUrl = process.env.GOOGLE_SHEETS_INQUIRY_WEBHOOK_URL || 
                         settings.google_sheet_inquiry_webhook_url || 
                         process.env.GOOGLE_SHEETS_WEBHOOK_URL || 
                         settings.google_sheet_webhook_url;

      if (!webhookUrl || !webhookUrl.trim().startsWith('http')) {
        return res.status(400).json({ error: 'Inquiries Webhook URL is not configured. Please save a valid Webhook URL first.' });
      }

      const sheetPayload = {
        ticket_id: msg.ticket_id,
        timestamp: new Date(msg.created_at || Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        name: msg.name,
        email: msg.email,
        category: msg.category,
        order_id: msg.order_id || 'N/A',
        subject: msg.subject || 'N/A',
        message: msg.message
      };

      const result = await forwardToGoogleSheet(webhookUrl.trim(), sheetPayload);
      if (!result.success) {
        db.updateContactMessageSync(msg.id, false, result.error);
        return res.status(502).json({ error: result.error || 'Failed to sync inquiry to Google Sheet' });
      }

      db.updateContactMessageSync(msg.id, true);
      res.json({ success: true, message: `Inquiry #${msg.ticket_id} synced to Google Sheet successfully!` });
    } catch (error: any) {
      console.error('Resync message error:', error);
      res.status(500).json({ error: error?.message || 'Failed to resync inquiry' });
    }
  });

  // ==========================================
  // STATIC ASSETS & VITE CLIENT MIDDLEWARE
  // ==========================================

  // Serve static assets directly from public/ (favicons, logos, uploads)
  const publicPath = path.join(process.cwd(), 'public');
  app.use(express.static(publicPath));

  app.get('/favicon.ico', (req, res) => {
    res.type('image/svg+xml').sendFile(path.join(publicPath, 'favicon.svg'));
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OneTapLink Store server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
