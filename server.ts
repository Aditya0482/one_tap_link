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

// In-memory rate limiting store: key -> Array of timestamps
const rateLimits = new Map<string, number[]>();

function createRateLimiter(windowMs: number, maxRequests: number, message: string = 'Too many requests, please try again later.') {
  return (req: Request, res: Response, next: NextFunction) => {
    const rawIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${req.path}_${rawIp}`;
    const now = Date.now();
    const timestamps = rateLimits.get(key) || [];
    const validTimestamps = timestamps.filter(t => now - t < windowMs);

    if (validTimestamps.length >= maxRequests) {
      return res.status(429).json({ error: message });
    }

    validTimestamps.push(now);
    rateLimits.set(key, validTimestamps);
    next();
  };
}

// Track OTP verification attempts per email to prevent brute-force
const otpAttemptsMap = new Map<string, number>();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));
  const isProduction = process.env.NODE_ENV === 'production' || hasDist;

  // 1. HTTP Security Headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Rate Limiting Instances
  const authLimiter = createRateLimiter(15 * 60 * 1000, 15, 'Too many attempts. Please try again after 15 minutes.');
  const contactLimiter = createRateLimiter(15 * 60 * 1000, 5, 'Too many messages sent. Please wait a few minutes before submitting another inquiry.');
  const orderCreateLimiter = createRateLimiter(5 * 60 * 1000, 10, 'Too many order requests. Please wait a moment before trying again.');
  const otpSendLimiter = createRateLimiter(15 * 60 * 1000, 5, 'Too many verification code requests. Please wait a few minutes.');
  const otpVerifyLimiter = createRateLimiter(15 * 60 * 1000, 10, 'Too many verification attempts. Please try again later.');

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

  // Customer Sign Up (Protected by rate limiter)
  app.post('/api/auth/signup', authLimiter, async (req, res) => {
    try {
      const { name, email, password, phone } = req.body;
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
        password: password.trim(),
        phone: (phone || '').toString().trim()
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

  // Customer Login (Protected by rate limiter)
  app.post('/api/auth/login', authLimiter, async (req, res) => {
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

  // 1. Send Password Reset OTP (Rate limited + Secure Crypto OTP)
  app.post('/api/auth/forgot-password/send-otp', otpSendLimiter, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || !email.trim()) {
        return res.status(400).json({ error: 'Please enter your registered email address.' });
      }

      const cleanEmail = email.trim().toLowerCase();

      // Check if user exists
      const user = await pgDb.getUserByEmail(cleanEmail);

      // Check if admin exists — only from database (no hardcoded/env check)
      const dbAdmin = await pgDb.getAdminByEmail(cleanEmail).catch(() => null);

      if (!user && !dbAdmin) {
        return res.status(404).json({ error: 'No account found with this email address. Please verify your email or sign up.' });
      }

      const userName = user?.displayName || cleanEmail.split('@')[0];
      // Generate cryptographically secure 6-digit numeric code
      const otp = crypto.randomInt(100000, 1000000).toString();

      // Reset failed attempt count for new OTP
      otpAttemptsMap.delete(cleanEmail);

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

  // 2. Verify OTP Code (Rate limited + Brute force lockout after 5 attempts)
  app.post('/api/auth/forgot-password/verify-otp', otpVerifyLimiter, async (req, res) => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ error: 'Email and verification code are required.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanOtp = otp.trim();

      const failedAttempts = otpAttemptsMap.get(cleanEmail) || 0;
      if (failedAttempts >= 5) {
        await pgDb.invalidatePasswordResetOtp(cleanEmail).catch(() => {});
        return res.status(429).json({ 
          error: 'Too many incorrect attempts. For security, this verification code has been locked. Please request a new code.' 
        });
      }

      const isValid = await pgDb.verifyPasswordResetOtp(cleanEmail, cleanOtp);
      if (!isValid) {
        const nextAttempts = failedAttempts + 1;
        otpAttemptsMap.set(cleanEmail, nextAttempts);
        const remaining = 5 - nextAttempts;
        return res.status(400).json({ 
          error: remaining > 0 
            ? `Invalid or expired verification code. (${remaining} attempt${remaining === 1 ? '' : 's'} remaining)` 
            : 'Invalid verification code. Maximum attempts reached, code has been locked.'
        });
      }

      otpAttemptsMap.delete(cleanEmail);
      res.json({ success: true, message: 'OTP verified successfully.' });
    } catch (err: any) {
      console.error('Verify OTP error:', err);
      res.status(500).json({ error: 'Verification failed.' });
    }
  });

  // 3. Reset Password with Verified OTP (Rate limited + Attempt check)
  app.post('/api/auth/forgot-password/reset', otpVerifyLimiter, async (req, res) => {
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

      const failedAttempts = otpAttemptsMap.get(cleanEmail) || 0;
      if (failedAttempts >= 5) {
        await pgDb.invalidatePasswordResetOtp(cleanEmail).catch(() => {});
        return res.status(429).json({ 
          error: 'Too many failed attempts. Code locked for security. Please request a new code.' 
        });
      }

      const result = await pgDb.resetPasswordWithOtp(cleanEmail, cleanOtp, cleanPassword);
      if (!result.success) {
        otpAttemptsMap.set(cleanEmail, failedAttempts + 1);
        return res.status(400).json({ error: result.error || 'Failed to reset password.' });
      }

      otpAttemptsMap.delete(cleanEmail);
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

  // 3b. Razorpay Configuration (Public key info only)
  app.get('/api/razorpay/config', (_req, res) => {
    const creds = pgDb.getRazorpayCredentials();
    res.json({
      is_configured: creds.is_configured,
      key_id: creds.is_configured ? creds.key_id : '',
      test_mode: creds.test_mode,
      mode: creds.mode
    });
  });

  // 3c. Razorpay: Create Order (Rate limited against order flooding)
  app.post('/api/razorpay/create-order', orderCreateLimiter, async (req, res) => {
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
      const creds = pgDb.getRazorpayCredentials();

      let razorpayOrderId: string;
      let isSimulation = false;
      let warningMsg: string | undefined;

      const cleanPhone = (customer_phone || '').trim().replace(/[^0-9+]/g, '');

      if (creds.is_configured) {
        // Real Razorpay Order Creation
        try {
          const amountInPaise = Math.round(Number(trustedPrice) * 100); // Razorpay takes paise

          const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Basic ' + Buffer.from(`${creds.key_id}:${creds.key_secret}`).toString('base64')
            },
            body: JSON.stringify({
              amount: amountInPaise,
              currency: 'INR',
              receipt: `ord_${Date.now()}`,
              notes: {
                template_id: template.id,
                template_name: template.title,
                customer_name: (customer_name || 'Customer').trim(),
                customer_email: (customer_email || '').trim().toLowerCase(),
                customer_phone: cleanPhone,
                user_id: user_id || ''
              }
            })
          });

          const rzpData = await rzpResponse.json().catch(() => ({}));

          if (!rzpResponse.ok || !rzpData.id) {
            console.error('Razorpay Order API error:', rzpData);
            const errMsg = rzpData.error?.description || 'Failed to create order with Razorpay.';
            return res.status(502).json({ error: errMsg, details: rzpData.error || rzpData });
          }

          razorpayOrderId = rzpData.id;
        } catch (apiErr: any) {
          console.error('Failed to communicate with Razorpay API:', apiErr);
          return res.status(502).json({
            error: 'Network error communicating with Razorpay payment gateway.',
            details: apiErr.message
          });
        }
      } else {
        // Fallback Test Simulation mode when keys are not set
        isSimulation = true;
        razorpayOrderId = `rzp_sim_order_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        warningMsg = 'Razorpay Key ID & Key Secret not set in .env. Running in Test Simulation mode.';
      }

      // Record pending order in DB
      const pendingOrder = await pgDb.createPendingRazorpayOrder({
        customer_name: customer_name || 'Customer',
        customer_email: customer_email || 'customer@example.com',
        user_id,
        template_id: template.id,
        razorpay_order_id: razorpayOrderId
      });

      res.status(200).json({
        success: true,
        key_id: creds.key_id,
        order_id: razorpayOrderId,
        amount: Math.round(Number(trustedPrice) * 100), // in paise
        currency: 'INR',
        product_id: template.id,
        product_name: template.title,
        internal_order_id: pendingOrder?.id,
        is_test_simulation: isSimulation,
        test_mode: creds.test_mode,
        mode: creds.mode,
        warning: warningMsg
      });
    } catch (error: any) {
      console.error('Razorpay order creation error:', error);
      res.status(500).json({ error: 'Internal server error while creating payment order.' });
    }
  });

  // 3d. Razorpay: Verify Payment Signature (Called after user completes payment in popup)
  app.post('/api/razorpay/verify-payment', async (req, res) => {
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
        return res.status(400).json({ error: 'razorpay_order_id and razorpay_payment_id are required.' });
      }

      const creds = pgDb.getRazorpayCredentials();

      // Strictly verify HMAC-SHA256 signature when Razorpay is configured
      if (creds.is_configured) {
        if (!razorpay_signature || !razorpay_signature.trim()) {
          console.error('[Razorpay Verify] Rejected: razorpay_signature is strictly required.');
          return res.status(400).json({ error: 'Tampered payment: Signature missing or invalid.' });
        }

        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
          .createHmac('sha256', creds.key_secret)
          .update(body)
          .digest('hex');

        if (expectedSignature !== razorpay_signature.trim()) {
          console.error('[Razorpay Verify] Signature mismatch!');
          return res.status(400).json({ error: 'Payment signature verification failed. Please contact support.' });
        }
      } else {
        // If credentials are NOT configured, only allow simulation in development or if explicitly allowed
        if (isProduction && process.env.ENABLE_PAYMENT_SIMULATION !== 'true') {
          return res.status(403).json({ error: 'Live Razorpay payment credentials are not configured.' });
        }
      }

      const verifiedOrder = await pgDb.markRazorpayOrderPaid({
        razorpay_order_id,
        razorpay_payment_id,
        template_id: template_id || '',
        user_id,
        customer_name,
        customer_email,
        customer_phone
      });

      if (!verifiedOrder) {
        return res.status(500).json({ error: 'Failed to record payment. Please contact support.' });
      }

      const template = await pgDb.getTemplateById(verifiedOrder.template_id, true);

      const purchaseRecord = {
        userId: user_id || verifiedOrder.user_id || 'anonymous',
        customerEmail: verifiedOrder.customer_email,
        customerName: verifiedOrder.customer_name,
        productId: verifiedOrder.template_id,
        productName: verifiedOrder.template_title || template?.title,
        amount: verifiedOrder.amount,
        paymentGateway: 'razorpay',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        paymentStatus: 'paid',
        purchasedAt: verifiedOrder.created_at || new Date().toISOString(),
        accessUrl: template?.access_url || verifiedOrder.access_url,
        thumbnailUrl: template?.thumbnail_url || verifiedOrder.template_thumbnail
      };

      res.json({
        success: true,
        verified: true,
        order: verifiedOrder,
        purchase: purchaseRecord,
        message: 'Payment verified successfully! Access unlocked.'
      });
    } catch (error: any) {
      console.error('[Razorpay Verify] Error:', error);
      res.status(500).json({ error: 'Internal server error while verifying payment.' });
    }
  });

  // 3e. Razorpay: Simulate Payment Completion (Blocked in production unless explicitly enabled)
  app.post('/api/razorpay/simulate-payment', async (req, res) => {
    try {
      if (isProduction && process.env.ENABLE_PAYMENT_SIMULATION !== 'true') {
        return res.status(403).json({ error: 'Simulated payments are disabled in production mode.' });
      }

      const { razorpay_order_id, template_id, user_id, customer_name, customer_email, customer_phone } = req.body;

      if (!razorpay_order_id || !template_id) {
        return res.status(400).json({ error: 'razorpay_order_id and template_id are required.' });
      }

      const template = await pgDb.getTemplateById(template_id, true);
      if (!template) {
        return res.status(404).json({ error: 'Template not found.' });
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
        return res.status(500).json({ error: 'Failed to record simulated purchase.' });
      }

      const purchaseRecord = {
        userId: user_id || verifiedOrder.user_id || 'anonymous',
        customerEmail: verifiedOrder.customer_email,
        customerName: verifiedOrder.customer_name,
        productId: template.id,
        productName: template.title,
        amount: verifiedOrder.amount,
        paymentGateway: 'razorpay',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: simulatedPaymentId,
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

  // 3f. Razorpay: Webhook Event Notification (Strict Signature Verification)
  app.post('/api/razorpay/webhook', async (req, res) => {
    try {
      const creds = pgDb.getRazorpayCredentials();
      const signature = req.headers['x-razorpay-signature'] as string;
      const rawBody = JSON.stringify(req.body);

      // Strictly verify webhook signature if configured
      if (creds.is_configured) {
        if (!signature) {
          console.error('[Razorpay Webhook] Rejected: Missing x-razorpay-signature header');
          return res.status(400).send('Signature missing');
        }

        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || creds.key_secret;
        const expectedSig = crypto
          .createHmac('sha256', webhookSecret)
          .update(rawBody)
          .digest('hex');
        if (expectedSig !== signature) {
          console.error('[Razorpay Webhook] Signature mismatch!');
          return res.status(400).send('Signature mismatch');
        }
      }

      const event = req.body?.event;
      const payment = req.body?.payload?.payment?.entity;

      if (event === 'payment.captured' && payment) {
        const rzpOrderId = payment.order_id;
        const rzpPayId = payment.id;
        if (rzpOrderId && rzpPayId) {
          await pgDb.markRazorpayOrderPaid({
            razorpay_order_id: rzpOrderId,
            razorpay_payment_id: rzpPayId,
            template_id: payment.notes?.template_id || '',
            user_id: payment.notes?.user_id || '',
            customer_name: payment.notes?.customer_name || payment.email?.split('@')[0] || '',
            customer_email: payment.email || payment.notes?.customer_email || ''
          });
          console.log(`[Razorpay Webhook] Payment captured: ${rzpPayId} for order ${rzpOrderId}`);
        }
      }

      res.status(200).send('OK');
    } catch (error: any) {
      console.error('[Razorpay Webhook] Error:', error);
      res.status(500).send('Internal Error');
    }
  });

  // 3g. Single Order / Access Verification Lookup (Protected against IDOR & Data Leaks)
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

      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
      const session = token ? sessions.get(token) : null;

      const isAdmin = session && session.role === 'admin';
      const isOwner = session && (
        (order.user_id && session.userId === order.user_id) ||
        (order.customer_email && session.email.toLowerCase() === order.customer_email.toLowerCase())
      );
      const paymentRefQuery = (req.query.ref || req.query.payment_id || '').toString().trim();
      const hasPaymentProof = paymentRefQuery && (
        order.razorpay_payment_id === paymentRefQuery ||
        order.payment_reference === paymentRefQuery
      );

      // If requested by an unverified caller without session or payment proof, do not expose access_url or customer phone/email
      if (!isAdmin && !isOwner && !hasPaymentProof) {
        const safeOrder = {
          id: order.id,
          template_id: order.template_id,
          template_title: order.template_title,
          amount: order.amount,
          currency: order.currency,
          payment_status: order.payment_status,
          created_at: order.created_at,
          customer_name: order.customer_name ? `${order.customer_name.slice(0, 1)}***` : undefined
        };
        return res.json({ success: true, order: safeOrder });
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


  // 3e. Customer Purchases Lookup (Protected: requires session or exact Order ID reference)
  app.get(['/api/user/purchases', '/api/user/purchases-lookup', '/api/user/purchases/:userId'], async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
      const session = token ? sessions.get(token) : null;

      const userId = (req.params.userId || req.query.userId || '').toString().trim();
      const email = (req.query.email || '').toString().trim();
      if (!userId && !email) {
        return res.status(400).json({ error: 'User ID or email is required.' });
      }

      // Direct Reference / Order ID / Payment ID lookup support (single specific order reference)
      if (email && !email.includes('@')) {
        const directOrder = await pgDb.getOrderById(email);
        if (directOrder && directOrder.payment_status === 'Paid') {
          const tmpl = await pgDb.getTemplateById(directOrder.template_id, true);
          if (tmpl) directOrder.access_url = tmpl.access_url;
          return res.json({ success: true, purchases: [directOrder] });
        }
      }

      const isAuthorized = session && (
        session.role === 'admin' ||
        session.userId === userId ||
        (email && session.email.toLowerCase() === email.toLowerCase())
      );

      if (!isAuthorized) {
        return res.status(401).json({ error: 'Unauthorized: Please log in to view your purchases.' });
      }

      const orders = await pgDb.getUserOrders(userId, email);
      res.json({ success: true, purchases: orders });
    } catch (error) {
      console.error('Error fetching user purchases:', error);
      res.status(500).json({ error: 'Failed to fetch customer purchases' });
    }
  });

  // 3f. Auto-Prefill Customer Checkout Details (Protected against unauthenticated profile enumeration)
  app.get('/api/user/checkout-details', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
      const session = token ? sessions.get(token) : null;

      const userId = (req.query.userId || '').toString().trim();
      const email = (req.query.email || '').toString().trim().toLowerCase();

      if (!userId && !email) {
        return res.json({ success: true, found: false, details: null });
      }

      // Only allow pre-filling profile if user is authenticated and matches the requested user/email
      if (!session || (session.userId !== userId && session.email.toLowerCase() !== email)) {
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

  // 4. Contact Inquiries -> Stored directly in PostgreSQL (Rate limited against spam flood)
  app.post('/api/contact', contactLimiter, async (req, res) => {
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

  // Admin Login (Protected by rate limiter)
  app.post('/api/admin/login', authLimiter, async (req, res) => {
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

  // Admin Sign Up / Set Password (Protected against unauthenticated takeover)
  app.post(['/api/admin/signup', '/api/admin/set-password'], authLimiter, async (req, res) => {
    try {
      const { email, password, deleteOldDefault, admin_setup_secret } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanPassword = (password || '').trim();

      if (!cleanEmail || !cleanPassword) {
        return res.status(400).json({ error: 'Both email and password are required' });
      }

      if (cleanPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }

      // Security check: If admins already exist, require authenticated admin session OR ADMIN_SETUP_SECRET
      const hasExistingAdmins = await pgDb.hasAdmins();
      if (hasExistingAdmins) {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
        const session = token ? sessions.get(token) : null;
        const isAuthorizedAdmin = session && session.role === 'admin' && session.expiresAt > Date.now();

        const configuredSecret = process.env.ADMIN_SETUP_SECRET;
        const isValidSecret = configuredSecret && admin_setup_secret === configuredSecret;

        if (!isAuthorizedAdmin && !isValidSecret) {
          return res.status(403).json({ 
            error: 'Forbidden: Admin account already exists. You must be authenticated as an admin or provide the valid ADMIN_SETUP_SECRET to modify admin credentials.' 
          });
        }
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
        message: 'Admin account credentials updated successfully'
      });
    } catch (error: any) {
      console.error('Admin sign up error:', error);
      res.status(500).json({ error: error?.message || 'Failed to update admin account' });
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
          const rawExt = matches[1].toLowerCase();
          const allowed = ['png', 'jpg', 'jpeg', 'webp', 'gif'];
          if (!allowed.includes(rawExt)) {
            return res.status(400).json({ error: 'Invalid image format. Only PNG, JPG, WEBP, GIF are allowed.' });
          }
          const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
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

  // Explicitly handle /uploads static files strictly restricted to uploads directory
  const uploadsDir = path.resolve(publicPath, 'uploads');
  app.use('/uploads', (req, res, _next) => {
    const safeRelPath = path.normalize(req.path).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.resolve(uploadsDir, '.' + safeRelPath);

    if (!filePath.startsWith(uploadsDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return res.sendFile(filePath);
    }
    return res.status(404).json({ error: 'Image not found' });
  });

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
