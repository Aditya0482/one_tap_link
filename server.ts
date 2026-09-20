import 'dotenv/config';

process.on('uncaughtException', (err) => {
  console.error('[CRITICAL UNCAUGHT EXCEPTION]', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[CRITICAL UNHANDLED REJECTION]', reason);
});
import express, { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createServer as createViteServer } from 'vite';
import { pgDb } from './src/server/pgDb';
import { sendOtpEmail } from './src/server/email';
import { TemplateStatus, PaymentStatus, AccessStatus } from './src/types';

// In-memory session store for tokens (both admin and user)
const sessions = new Map<string, { userId: string; email: string; role: 'admin' | 'user'; expiresAt: number }>();

function createSessionToken(userId: string, email: string, role: 'admin' | 'user' = 'admin'): string {
  const token = crypto.randomBytes(32).toString('hex');
  // 7-day session
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  sessions.set(token, { userId, email, role, expiresAt });
  return token;
}

function adminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.substring(7);
  const session = sessions.get(token);

  if (!session || session.expiresAt < Date.now() || session.role !== 'admin') {
    if (session) sessions.delete(token);
    return res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
  }

  (req as any).admin = session;
  next();
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Initialize PostgreSQL database & tables (with local store fallback)
  await pgDb.initialize();

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Basic API Health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      database: pgDb.isPostgres ? 'postgresql' : 'local-json',
      timestamp: new Date().toISOString() 
    });
  });

  // ==========================================
  // CUSTOMER AUTHENTICATION (POSTGRESQL)
  // ==========================================

  // Customer Sign Up
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { name, email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const existing = await pgDb.getUserByEmail(cleanEmail);
      if (existing) {
        return res.status(400).json({ error: 'An account with this email already exists. Please sign in.' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }

      const user = await pgDb.createUser({
        name: name?.trim() || cleanEmail.split('@')[0],
        email: cleanEmail,
        password: password.trim()
      });

      const token = createSessionToken(user.id, user.email, 'user');
      res.status(201).json({
        success: true,
        token,
        user
      });
    } catch (err: any) {
      console.error('Customer signup error:', err);
      res.status(500).json({ error: 'Failed to create customer account.' });
    }
  });

  // Customer Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const user = await pgDb.verifyUser(cleanEmail, password.trim());
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password. Please try again.' });
      }

      const token = createSessionToken(user.id, user.email, 'user');
      res.json({
        success: true,
        token,
        user
      });
    } catch (err: any) {
      console.error('Customer login error:', err);
      res.status(500).json({ error: 'Login failed.' });
    }
  });

  // ==========================================
  // FORGOT PASSWORD (RESEND EMAIL OTP)
  // ==========================================

  // 1. Send Password Reset OTP
  app.post('/api/auth/forgot-password/send-otp', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || !email.trim()) {
        return res.status(400).json({ error: 'Please enter your registered email address.' });
      }

      const cleanEmail = email.trim().toLowerCase();

      // Check if user or admin exists
      const user = await pgDb.getUserByEmail(cleanEmail);
      const isExistingAdmin = cleanEmail === 'admin@onetaplink.com' || (process.env.ADMIN_EMAIL && cleanEmail === process.env.ADMIN_EMAIL.toLowerCase());

      if (!user && !isExistingAdmin) {
        return res.status(404).json({ error: 'No account found with this email address. Please verify your email or sign up.' });
      }

      const userName = user?.displayName || cleanEmail.split('@')[0];
      // Generate 6-digit numeric code
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Store in DB / Memory (15 min validity)
      await pgDb.savePasswordResetOtp(cleanEmail, otp, 15);

      // Send live email via Resend API
      const emailResult = await sendOtpEmail({
        to: cleanEmail,
        otp,
        userName
      });

      res.json({
        success: true,
        message: 'A 6-digit verification code has been sent to your email.',
        simulated: emailResult.simulated || false
      });
    } catch (err: any) {
      console.error('Send OTP error:', err);
      res.status(500).json({ error: 'Failed to send verification code. Please try again.' });
    }
  });

  // 2. Verify OTP Code
  app.post('/api/auth/forgot-password/verify-otp', async (req, res) => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ error: 'Email and verification code are required.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanOtp = otp.trim();

      const isValid = await pgDb.verifyPasswordResetOtp(cleanEmail, cleanOtp);
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid or expired verification code. Please request a new code.' });
      }

      res.json({ success: true, message: 'OTP verified successfully.' });
    } catch (err: any) {
      console.error('Verify OTP error:', err);
      res.status(500).json({ error: 'Verification failed.' });
    }
  });

  // 3. Reset Password with Verified OTP
  app.post('/api/auth/forgot-password/reset', async (req, res) => {
    try {
      const { email, otp, newPassword } = req.body;
      if (!email || !otp || !newPassword) {
        return res.status(400).json({ error: 'Email, verification code, and new password are required.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanOtp = otp.trim();
      const cleanPassword = newPassword.trim();

      if (cleanPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }

      const result = await pgDb.resetPasswordWithOtp(cleanEmail, cleanOtp, cleanPassword);
      if (!result.success) {
        return res.status(400).json({ error: result.error || 'Failed to reset password.' });
      }

      res.json({
        success: true,
        message: 'Your password has been reset successfully! You can now sign in with your new password.'
      });
    } catch (err: any) {
      console.error('Reset password error:', err);
      res.status(500).json({ error: 'Failed to reset password. Please try again.' });
    }
  });

  // Customer / Admin Session Validation
  app.get('/api/auth/me', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const token = authHeader.substring(7);
      const session = sessions.get(token);
      if (!session || session.expiresAt < Date.now()) {
        if (session) sessions.delete(token);
        return res.status(401).json({ error: 'Session expired' });
      }

      if (session.role === 'admin') {
        const admin = await pgDb.getAdminById(session.userId);
        return res.json({ success: true, role: 'admin', user: admin });
      }

      const user = await pgDb.getUserById(session.userId) || await pgDb.getUserByEmail(session.email);
      if (!user) {
        return res.status(404).json({ error: 'User account not found' });
      }

      res.json({ success: true, role: 'user', user });
    } catch (err) {
      console.error('Session verify error:', err);
      res.status(500).json({ error: 'Failed to verify session' });
    }
  });

  // Logout
  app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      sessions.delete(authHeader.substring(7));
    }
    res.json({ success: true });
  });

  // ==========================================
  // PUBLIC STOREFRONT ENDPOINTS
  // ==========================================

  // 1. Get all published templates (access_url stripped)
  app.get('/api/templates', async (req, res) => {
    try {
      const templates = await pgDb.getPublishedTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({ error: 'Failed to fetch templates' });
    }
  });

  // 2. Get single template by slug or ID
  app.get('/api/templates/:slugOrId', async (req, res) => {
    try {
      const { slugOrId } = req.params;
      let template = await pgDb.getTemplateBySlug(slugOrId);
      if (!template) {
        template = await pgDb.getTemplateById(slugOrId);
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

  // 3b. Instamojo Configuration
  app.get('/api/instamojo/config', (_req, res) => {
    const creds = pgDb.getInstamojoCredentials();
    res.json({
      is_configured: creds.is_configured,
      sandbox: creds.sandbox,
      mode: creds.mode
    });
  });

  // 3c. Instamojo: Create Payment Request
  app.post('/api/instamojo/create-request', async (req, res) => {
    try {
      const { template_id, customer_name, customer_email, customer_phone, user_id } = req.body;

      if (!template_id) {
        return res.status(400).json({ error: 'Template ID is required.' });
      }

      // Always fetch product and price from trusted server DB
      const template = await pgDb.getTemplateById(template_id, true);
      if (!template || template.status !== 'Published') {
        return res.status(404).json({ error: 'Selected template is not available for purchase.' });
      }

      const trustedPrice = template.sale_price ?? template.price;
      const creds = pgDb.getInstamojoCredentials();

      let instamojoPaymentRequestId: string;
      let paymentUrl: string | null = null;
      let isSimulation = false;
      let warningMsg: string | undefined;

      // Clean phone number
      const cleanPhone = (customer_phone || '').trim().replace(/[^0-9+]/g, '');

      if (creds.is_configured) {
        // Real Instamojo API Request Creation
        try {
          const baseUrl = creds.sandbox 
            ? 'https://test.instamojo.com/api/1.1/' 
            : 'https://www.instamojo.com/api/1.1/';
          
          const host = req.get('host');
          const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
          const redirectUrl = `${protocol}://${host}/api/instamojo/callback`;
          const webhookUrl = `${protocol}://${host}/api/instamojo/webhook`;

          // Purpose limit in Instamojo is max 30 chars
          const cleanTitle = (template.title || 'Digital Template').replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
          const purpose = cleanTitle.length > 30 ? cleanTitle.substring(0, 30) : cleanTitle;

          const params = new URLSearchParams();
          params.append('purpose', purpose);
          params.append('amount', Number(trustedPrice).toFixed(2));
          params.append('buyer_name', (customer_name || 'Customer').trim().substring(0, 100));
          params.append('email', (customer_email || 'customer@example.com').trim().toLowerCase());
          if (cleanPhone) {
            params.append('phone', cleanPhone);
          }
          params.append('redirect_url', redirectUrl);
          params.append('webhook', webhookUrl);
          params.append('send_email', 'False');
          params.append('send_sms', 'False');
          params.append('allow_repeated_payments', 'False');

          const mojoResponse = await fetch(`${baseUrl}payment-requests/`, {
            method: 'POST',
            headers: {
              'X-Api-Key': creds.api_key,
              'X-Auth-Token': creds.auth_token,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
          });

          const mojoData = await mojoResponse.json().catch(() => ({}));

          if (!mojoResponse.ok || !mojoData.success) {
            console.error('Instamojo Payment Request API error:', mojoData);
            let userFriendlyMsg = 'Failed to create payment request with Instamojo.';
            const rawMsg = typeof mojoData.message === 'string' ? mojoData.message : JSON.stringify(mojoData.message || '');
            if (rawMsg.toLowerCase().includes('permission') || rawMsg.toLowerCase().includes('cannot accept payments')) {
              userFriendlyMsg = 'Instamojo Live Account: Bank Account / KYC verification is pending on your Instamojo dashboard before live payments can be accepted. Please visit your Instamojo Dashboard to verify your bank details.';
            } else if (typeof mojoData.message === 'string') {
              userFriendlyMsg = mojoData.message;
            }
            return res.status(502).json({
              error: userFriendlyMsg,
              details: mojoData.message || mojoData
            });
          }

          instamojoPaymentRequestId = mojoData.payment_request.id;
          paymentUrl = mojoData.payment_request.longurl;
        } catch (apiErr: any) {
          console.error('Failed to communicate with Instamojo API:', apiErr);
          return res.status(502).json({
            error: 'Network error communicating with Instamojo payment gateway.',
            details: apiErr.message
          });
        }
      } else {
        // Fallback Test Simulation mode when keys are not set
        isSimulation = true;
        instamojoPaymentRequestId = `mojo_req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        warningMsg = 'Instamojo API Key & Auth Token not set in .env. Running in Test Simulation mode.';
      }

      // Record pending order in DB
      const pendingOrder = await pgDb.createPendingInstamojoOrder({
        customer_name: customer_name || 'Customer',
        customer_email: customer_email || 'customer@example.com',
        customer_phone: cleanPhone,
        user_id,
        template_id: template.id,
        payment_request_id: instamojoPaymentRequestId
      });

      res.status(200).json({
        success: true,
        payment_request_id: instamojoPaymentRequestId,
        payment_url: paymentUrl,
        amount: Number(trustedPrice),
        currency: 'INR',
        product_id: template.id,
        product_name: template.title,
        internal_order_id: pendingOrder?.id,
        is_test_simulation: isSimulation,
        sandbox: creds.sandbox,
        mode: creds.mode,
        warning: warningMsg
      });
    } catch (error: any) {
      console.error('Instamojo request creation error:', error);
      res.status(500).json({ error: 'Internal server error while creating payment request.' });
    }
  });

  // 3d. Instamojo: Payment Redirect Callback (User is redirected back from Instamojo page)
  app.get('/api/instamojo/callback', async (req, res) => {
    try {
      const { payment_id, payment_status, payment_request_id } = req.query;

      if (!payment_id || !payment_request_id) {
        console.warn('[Instamojo Callback] Missing payment_id or payment_request_id in query params:', req.query);
        return res.redirect('/#checkout?error=invalid_callback');
      }

      const pId = String(payment_id).trim();
      const prId = String(payment_request_id).trim();
      const status = String(payment_status || '').trim();

      if (status.toLowerCase() === 'credit') {
        const verifiedOrder = await pgDb.markInstamojoOrderPaid({
          payment_request_id: prId,
          payment_id: pId
        });

        const orderRef = verifiedOrder?.id || prId;
        return res.redirect(`/#thankyou?order_id=${encodeURIComponent(orderRef)}`);
      } else {
        console.warn('[Instamojo Callback] Payment status was not Credit:', status);
        return res.redirect(`/#checkout?error=payment_${encodeURIComponent(status || 'failed')}`);
      }
    } catch (error: any) {
      console.error('[Instamojo Callback] Error handling callback:', error);
      return res.redirect('/#checkout?error=callback_processing_failed');
    }
  });

  // 3e. Instamojo: Webhook Event Notification
  app.post('/api/instamojo/webhook', async (req, res) => {
    try {
      const creds = pgDb.getInstamojoCredentials();
      const body = req.body || {};

      // If salt is provided, verify MAC
      if (creds.salt && body.mac) {
        const macReceived = body.mac;
        const dataToSign = { ...body };
        delete dataToSign.mac;

        const sortedKeys = Object.keys(dataToSign).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
        const message = sortedKeys.map(k => dataToSign[k]).join('|');
        const calculatedMac = crypto.createHmac('sha1', creds.salt).update(message).digest('hex');

        if (calculatedMac !== macReceived) {
          console.error('[Instamojo Webhook] MAC signature verification failed!');
          return res.status(400).send('MAC mismatch');
        }
      }

      if (body.status === 'Credit') {
        await pgDb.markInstamojoOrderPaid({
          payment_request_id: body.payment_request_id,
          payment_id: body.payment_id,
          customer_name: body.buyer_name,
          customer_email: body.buyer,
          customer_phone: body.buyer_phone
        });
        console.log(`[Instamojo Webhook] Successfully processed payment ${body.payment_id} for request ${body.payment_request_id}`);
      }

      res.status(200).send('OK');
    } catch (error: any) {
      console.error('[Instamojo Webhook] Error:', error);
      res.status(500).send('Internal Error');
    }
  });

  // 3f. Instamojo: Simulate Payment Completion (Test Simulation Mode)
  app.post('/api/instamojo/simulate-payment', async (req, res) => {
    try {
      const { payment_request_id, template_id, user_id, customer_name, customer_email, customer_phone } = req.body;

      if (!payment_request_id || !template_id) {
        return res.status(400).json({ error: 'payment_request_id and template_id are required.' });
      }

      const template = await pgDb.getTemplateById(template_id, true);
      if (!template) {
        return res.status(404).json({ error: 'Template not found.' });
      }

      const simulatedPaymentId = `MOJO_SIM_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const verifiedOrder = await pgDb.markInstamojoOrderPaid({
        payment_request_id,
        payment_id: simulatedPaymentId,
        template_id: template.id,
        user_id,
        customer_name,
        customer_email,
        customer_phone
      });

      if (!verifiedOrder) {
        return res.status(500).json({ error: 'Failed to record simulated purchase.' });
      }

      const purchaseRecord = {
        userId: user_id || verifiedOrder.user_id || 'anonymous',
        customerEmail: verifiedOrder.customer_email,
        customerName: verifiedOrder.customer_name,
        productId: template.id,
        productName: template.title,
        amount: verifiedOrder.amount,
        paymentGateway: 'instamojo',
        paymentRequestId: payment_request_id,
        paymentId: simulatedPaymentId,
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
        message: 'Test payment simulated successfully! Access unlocked.'
      });
    } catch (error: any) {
      console.error('Simulate payment error:', error);
      res.status(500).json({ error: 'Internal server error while simulating payment.' });
    }
  });

  // 3g. Single Order / Access Verification Lookup (by Order ID, Instamojo Request ID, or Payment ID)
  app.get('/api/orders/:id', async (req, res) => {
    try {
      const orderId = req.params.id;
      if (!orderId) {
        return res.status(400).json({ error: 'Order ID is required' });
      }

      const order = await pgDb.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.payment_status === 'Paid') {
        const template = await pgDb.getTemplateById(order.template_id, true);
        if (template) {
          order.access_url = template.access_url;
          order.template_title = template.title;
          order.template_thumbnail = template.thumbnail_url;
        }
      }

      res.json({ success: true, order });
    } catch (error: any) {
      console.error('Error fetching order by ID:', error);
      res.status(500).json({ error: 'Failed to fetch order details' });
    }
  });


  // 3e. Customer Purchases Lookup (Filtered by user ID or customer email across all devices)
  app.get(['/api/user/purchases', '/api/user/purchases-lookup', '/api/user/purchases/:userId'], async (req, res) => {
    try {
      const userId = (req.params.userId || req.query.userId || '').toString().trim();
      const email = (req.query.email || '').toString().trim();
      if (!userId && !email) {
        return res.status(400).json({ error: 'User ID or email is required.' });
      }

      // 1. Direct Reference / Order ID / Payment ID lookup support
      if (email && !email.includes('@')) {
        const directOrder = await pgDb.getOrderById(email);
        if (directOrder && directOrder.payment_status === 'Paid') {
          const tmpl = await pgDb.getTemplateById(directOrder.template_id, true);
          if (tmpl) directOrder.access_url = tmpl.access_url;
          return res.json({ success: true, purchases: [directOrder] });
        }
      }

      // 2. Active Reconciliation with Instamojo for any pending orders
      // (Guarantees safety if user's internet dropped after payment before redirecting)
      const creds = pgDb.getInstamojoCredentials();
      if (creds.is_configured) {
        try {
          const pendingOrders = await pgDb.getPendingInstamojoOrders(userId, email);
          if (pendingOrders.length > 0) {
            const baseUrl = creds.sandbox 
              ? 'https://test.instamojo.com/api/1.1/' 
              : 'https://www.instamojo.com/api/1.1/';

            for (const pOrder of pendingOrders) {
              const reqId = pOrder.instamojo_payment_request_id || pOrder.payment_reference;
              if (!reqId) continue;

              try {
                const checkRes = await fetch(`${baseUrl}payment-requests/${encodeURIComponent(reqId)}/`, {
                  headers: {
                    'X-Api-Key': creds.api_key,
                    'X-Auth-Token': creds.auth_token
                  }
                });
                if (checkRes.ok) {
                  const checkData = await checkRes.json().catch(() => ({}));
                  if (checkData.success && checkData.payment_request) {
                    const reqInfo = checkData.payment_request;
                    const successfulPayment = reqInfo.payments?.find((p: any) => p.status === 'Credit');
                    if (reqInfo.status === 'Completed' || successfulPayment) {
                      await pgDb.markInstamojoOrderPaid({
                        payment_request_id: reqId,
                        payment_id: successfulPayment?.payment_id || `MOJO_RECON_${Date.now()}`
                      });
                      console.log(`[Auto-Reconciliation] Recovered order ${pOrder.id} for ${email || userId}`);
                    }
                  }
                }
              } catch (recErr) {
                console.warn('[Reconciliation Notice] Failed to check status for request:', reqId, recErr);
              }
            }
          }
        } catch (reconcileErr) {
          console.warn('[Reconciliation Error]', reconcileErr);
        }
      }

      const orders = await pgDb.getUserOrders(userId, email);
      res.json({ success: true, purchases: orders });
    } catch (error) {
      console.error('Error fetching user purchases:', error);
      res.status(500).json({ error: 'Failed to fetch customer purchases' });
    }
  });

  // 3f. Auto-Prefill Customer Checkout Details from previous orders / database
  app.get('/api/user/checkout-details', async (req, res) => {
    try {
      const userId = (req.query.userId || '').toString().trim();
      const email = (req.query.email || '').toString().trim();

      if (!userId && !email) {
        return res.json({ success: true, found: false, details: null });
      }

      const details = await pgDb.getLastCustomerCheckoutDetails(userId, email);
      if (details) {
        return res.json({ success: true, found: true, details });
      }
      return res.json({ success: true, found: false, details: null });
    } catch (error) {
      console.error('Error fetching checkout profile details:', error);
      res.status(500).json({ error: 'Failed to fetch customer profile' });
    }
  });

  // 4. Contact Inquiries -> Stored directly in PostgreSQL
  app.post('/api/contact', async (req, res) => {
    try {
      const { name, email, category, orderId, subject, message } = req.body;

      const missingFields: string[] = [];
      if (!name || !name.trim()) missingFields.push('name');
      if (!email || !email.trim()) missingFields.push('email');
      if (!category || !category.trim()) missingFields.push('category');
      if (!message || !message.trim()) missingFields.push('message');

      if (missingFields.length > 0) {
        return res.status(400).json({
          error: 'Please fill in all required fields.',
          missingFields
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
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
        message: 'Your inquiry has been submitted successfully.'
      });
    } catch (error) {
      console.error('Contact submission error:', error);
      res.status(500).json({ error: 'Failed to submit inquiry.' });
    }
  });

  // ==========================================
  // ADMIN AUTHENTICATION & DASHBOARD (POSTGRESQL)
  // ==========================================

  // Admin Login
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      const admin = await pgDb.verifyAdmin(cleanEmail, cleanPassword);
      if (admin) {
        const token = createSessionToken(admin.id, admin.email, 'admin');
        return res.json({
          success: true,
          token,
          admin: {
            id: admin.id,
            email: admin.email
          }
        });
      }

      return res.status(401).json({ error: 'Invalid email or password. Access denied.' });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Admin Sign Up / Set Password
  app.post(['/api/admin/signup', '/api/admin/set-password'], async (req, res) => {
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

      const admin = await pgDb.setAdminPassword(cleanEmail, cleanPassword);

      if (deleteOldDefault && cleanEmail !== 'admin@onetaplink.com') {
        await pgDb.deleteAdmin('admin@onetaplink.com');
      }

      const token = createSessionToken(admin.id, admin.email, 'admin');
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
      console.error('Admin sign up error:', error);
      res.status(500).json({ error: error?.message || 'Failed to create admin account' });
    }
  });

  // Verify Admin Session
  app.get('/api/admin/me', adminAuthMiddleware, (req, res) => {
    const adminSession = (req as any).admin;
    res.json({
      admin: {
        id: adminSession.userId,
        email: adminSession.email
      }
    });
  });

  // Admin Dashboard Stats
  app.get('/api/admin/stats', adminAuthMiddleware, async (req, res) => {
    try {
      const orders = await pgDb.getAllOrders();
      const templates = await pgDb.getAllTemplates();

      const paidOrders = orders.filter(o => o.payment_status === 'Paid');
      const totalSales = paidOrders.reduce((sum, o) => sum + Number(o.amount || 0), 0);

      res.json({
        total_sales: totalSales,
        total_orders: orders.length,
        total_templates: templates.length,
        published_templates: templates.filter(t => t.status === 'Published').length,
        recent_orders: orders.slice(0, 10)
      });
    } catch (error) {
      console.error('Admin stats error:', error);
      res.status(500).json({ error: 'Failed to load stats' });
    }
  });

  // Admin Templates CRUD
  app.get('/api/admin/templates', adminAuthMiddleware, async (req, res) => {
    try {
      const templates = await pgDb.getAllTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching admin templates:', error);
      res.status(500).json({ error: 'Failed to fetch admin templates' });
    }
  });

  app.post('/api/admin/templates', adminAuthMiddleware, async (req, res) => {
    try {
      const created = await pgDb.createTemplate(req.body);
      res.status(201).json(created);
    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({ error: 'Failed to create template' });
    }
  });

  app.put('/api/admin/templates/:id', adminAuthMiddleware, async (req, res) => {
    try {
      const updated = await pgDb.updateTemplate(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Template not found' });
      }
      res.json(updated);
    } catch (error) {
      console.error('Error updating template:', error);
      res.status(500).json({ error: 'Failed to update template' });
    }
  });

  app.delete('/api/admin/templates/:id', adminAuthMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const { slug, title } = req.query;
      await pgDb.deleteTemplate(id, slug as string, title as string);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting template:', error);
      res.status(500).json({ error: 'Failed to delete template' });
    }
  });

  app.post('/api/admin/templates/cleanup-duplicates', adminAuthMiddleware, async (req, res) => {
    try {
      const count = await pgDb.cleanupDuplicateTemplates();
      const templates = await pgDb.getAllTemplates();
      res.json({ success: true, count, templates });
    } catch (error) {
      console.error('Error cleaning up templates:', error);
      res.status(500).json({ error: 'Failed to cleanup duplicate templates' });
    }
  });

  // Admin Orders
  app.get('/api/admin/orders', adminAuthMiddleware, async (req, res) => {
    try {
      const orders = await pgDb.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error('Error fetching admin orders:', error);
      res.status(500).json({ error: 'Failed to load orders' });
    }
  });

  app.patch('/api/admin/orders/:orderId/status', adminAuthMiddleware, async (req, res) => {
    try {
      const { orderId } = req.params;
      const { payment_status, access_status } = req.body;
      const updated = await pgDb.updateOrderStatus(orderId, payment_status, access_status);
      if (!updated) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json(updated);
    } catch (error) {
      console.error('Error updating order:', error);
      res.status(500).json({ error: 'Failed to update order status' });
    }
  });

  app.delete('/api/admin/orders/:orderId', adminAuthMiddleware, async (req, res) => {
    try {
      await pgDb.deleteOrder(req.params.orderId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting order:', error);
      res.status(500).json({ error: 'Failed to delete order' });
    }
  });

  app.post('/api/admin/clear-test-data', adminAuthMiddleware, async (req, res) => {
    try {
      await pgDb.clearAllOrders();
      res.json({ success: true, message: 'Orders cleared successfully' });
    } catch (error) {
      console.error('Error resetting test orders:', error);
      res.status(500).json({ error: 'Failed to reset test orders' });
    }
  });

  // Admin Messages
  app.get('/api/admin/messages', adminAuthMiddleware, async (req, res) => {
    try {
      const msgs = await pgDb.getAllMessages();
      res.json(msgs);
    } catch (error) {
      console.error('Error loading messages:', error);
      res.status(500).json({ error: 'Failed to load contact messages' });
    }
  });

  app.delete('/api/admin/messages/:id', adminAuthMiddleware, async (req, res) => {
    try {
      await pgDb.deleteMessage(req.params.id);
      res.json({ success: true, message: 'Message deleted' });
    } catch (error) {
      console.error('Error deleting message:', error);
      res.status(500).json({ error: 'Failed to delete message' });
    }
  });

  // Admin Image Upload
  app.post('/api/admin/upload-image', adminAuthMiddleware, async (req, res) => {
    try {
      const { image, name } = req.body;
      if (!image) {
        return res.status(400).json({ error: 'Image data is required' });
      }

      // If image is already a URL or Base64, return it directly or write to /uploads
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      if (image.startsWith('data:image/')) {
        const matches = image.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const base64Data = matches[2];
          const safeName = (name || `img_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_');
          const fileName = `${safeName}-${Date.now().toString().slice(-6)}.${ext}`;
          const filePath = path.join(uploadDir, fileName);
          fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
          return res.json({ success: true, url: `/uploads/${fileName}` });
        }
      }

      res.json({ success: true, url: image });
    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({ error: 'Failed to process image upload' });
    }
  });

  // Admin Settings: returns clean status
  app.get('/api/admin/settings', adminAuthMiddleware, (_req, res) => {
    res.json({
      database: pgDb.isPostgres ? 'PostgreSQL (Connected)' : 'Local Storage (Fallback)',
      database_connected: pgDb.isPostgres
    });
  });

  // ==========================================
  // STATIC ASSETS & VITE CLIENT MIDDLEWARE
  // ==========================================

  const publicPath = path.join(process.cwd(), 'public');
  app.use(express.static(publicPath));

  app.get('/favicon.ico', (_req, res) => {
    res.type('image/svg+xml').sendFile(path.join(publicPath, 'favicon.svg'));
  });

  // Explicitly handle /uploads static files so missing uploads return 404, NOT Vite index.html
  app.use('/uploads', (req, res, next) => {
    const filePath = path.join(publicPath, 'uploads', req.path);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return res.sendFile(filePath);
    }
    return res.status(404).json({ error: 'Image not found' });
  });

  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));
  const isProduction = process.env.NODE_ENV === 'production' || hasDist;

  if (!isProduction) {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        watch: {
          ignored: [
            '**/data/**',
            '**/data/*/**',
            '**/public/uploads/**',
            '**/.git/**',
            '**/node_modules/**',
            '**/dist/**'
          ]
        }
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  🚀 OneTapLink Store is running!`);
    console.log(`  ➜  Listening on PORT: ${PORT}`);
    console.log(`  ➜  Local:   http://localhost:${PORT}/`);
    console.log(`  ➜  Admin:   http://localhost:${PORT}/admin`);
    console.log(`  ➜  Database: ${pgDb.isPostgres ? 'PostgreSQL' : 'Local File Store'}\n`);
  });

  server.on('error', (err: any) => {
    console.error(`[Server Error on port ${PORT}]`, err?.message || err);
  });

  // If Railway assigned a dynamic PORT, also listen on 3000 so custom domain mapped to Port 3000 connects
  if (PORT !== 3000) {
    try {
      const p3000 = app.listen(3000, '0.0.0.0', () => {
        console.log(`  ➜  Also listening on port 3000 for Railway custom domain router.`);
      });
      p3000.on('error', (err: any) => {
        console.log(`[Notice] Port 3000 bind status:`, err?.message || err);
      });
    } catch (e: any) {
      console.log('[Notice] Could not bind port 3000:', e?.message || e);
    }
  }
}

startServer();
