import { 
  Template, 
  Order, 
  AdminDashboardStats, 
  CheckoutPayload, 
  PaymentStatus, 
  AccessStatus,
  ContactMessage,
  AppSettings
} from '../types';

export const api = {
  // Public Storefront
  async getTemplates(): Promise<Template[]> {
    const res = await fetch('/api/templates');
    if (!res.ok) throw new Error('Failed to load templates');
    return res.json();
  },

  async getTemplate(slugOrId: string): Promise<Template> {
    const res = await fetch(`/api/templates/${encodeURIComponent(slugOrId)}`);
    if (!res.ok) throw new Error('Template not found');
    return res.json();
  },

  async checkout(payload: CheckoutPayload): Promise<{ success: boolean; order: Order }> {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Checkout failed' }));
      throw new Error(err.error || 'Checkout failed');
    }
    return res.json();
  },

  async getOrder(orderId: string): Promise<Order> {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
    if (!res.ok) throw new Error('Order not found');
    return res.json();
  },

  // Razorpay Payments
  async getRazorpayConfig(): Promise<{ key_id: string; is_configured: boolean }> {
    const res = await fetch('/api/razorpay/config');
    if (!res.ok) throw new Error('Failed to fetch payment configuration');
    return res.json();
  },

  async createRazorpayOrder(payload: {
    template_id: string;
    customer_name?: string;
    customer_email?: string;
    user_id?: string;
  }): Promise<{
    success: boolean;
    key_id: string;
    order_id: string;
    amount: number;
    currency: string;
    product_id: string;
    product_name: string;
    internal_order_id?: string;
    is_test_simulation?: boolean;
    warning?: string;
  }> {
    const res = await fetch('/api/razorpay/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({ error: 'Failed to create payment order' }));
    if (!res.ok) {
      throw new Error(data.error || data.details || 'Failed to initialize payment gateway');
    }
    return data;
  },

  async verifyRazorpayPayment(payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature?: string;
    template_id: string;
    user_id?: string;
    customer_name?: string;
    customer_email?: string;
  }): Promise<{
    success: boolean;
    verified: boolean;
    order: Order;
    purchase: any;
    message?: string;
  }> {
    const res = await fetch('/api/razorpay/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({ error: 'Payment verification failed' }));
    if (!res.ok) {
      throw new Error(data.error || 'Payment verification failed');
    }
    return data;
  },

  async getUserPurchases(userId: string, email?: string): Promise<{ success: boolean; purchases: Order[] }> {
    const query = email ? `?email=${encodeURIComponent(email)}` : '';
    const res = await fetch(`/api/user/purchases/${encodeURIComponent(userId)}${query}`);
    if (!res.ok) throw new Error('Failed to fetch purchases');
    return res.json();
  },

  async clearUserPurchases(userId: string, email?: string): Promise<{ success: boolean; cleared: number }> {
    const query = email ? `?email=${encodeURIComponent(email)}` : '';
    const res = await fetch(`/api/user/purchases/${encodeURIComponent(userId)}${query}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to clear purchases');
    return res.json();
  },

  // Contact Inquiries (Stores & Syncs to Google Sheet)
  async submitContact(payload: {
    name: string;
    email: string;
    category: string;
    orderId?: string;
    subject?: string;
    message: string;
  }): Promise<{ success: boolean; ticket_id: string; synced_to_sheet: boolean; message: string }> {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({ error: 'Network communication failure' }));
    if (!res.ok) {
      const err: any = new Error(data.error || 'Failed to submit inquiry');
      err.missingFields = data.missingFields;
      throw err;
    }
    return data;
  },

  // Admin Authentication
  async adminLogin(email: string, password: string): Promise<{ success: boolean; token: string; admin: { id: string; email: string } }> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Invalid credentials' }));
      const errorObj = new Error(err.error || 'Login failed') as any;
      if (err.not_registered) {
        errorObj.not_registered = true;
      }
      throw errorObj;
    }
    return res.json();
  },

  async adminSignUp(email: string, password: string, deleteOldDefault = true): Promise<{ success: boolean; token: string; admin: { id: string; email: string }; message?: string }> {
    const res = await fetch('/api/admin/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, deleteOldDefault })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create admin account' }));
      throw new Error(err.error || 'Failed to create admin account');
    }
    return res.json();
  },

  async adminSetPassword(email: string, password: string, deleteOldDefault = true): Promise<{ success: boolean; token: string; admin: { id: string; email: string }; message?: string }> {
    const res = await fetch('/api/admin/set-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, deleteOldDefault })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to set password' }));
      throw new Error(err.error || 'Failed to set password');
    }
    return res.json();
  },

  async adminFirebaseAuth(email: string, idToken?: string, uid?: string): Promise<{ success: boolean; token: string; admin: { id: string; email: string } }> {
    const res = await fetch('/api/admin/firebase-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, idToken, uid })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Firebase authentication failed' }));
      throw new Error(err.error || 'Firebase authentication failed');
    }
    return res.json();
  },

  async adminVerifySession(token: string): Promise<{ admin: { id: string; email: string } }> {
    const res = await fetch('/api/admin/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Session invalid');
    return res.json();
  },

  // Admin Data Management
  async adminGetStats(token: string): Promise<AdminDashboardStats> {
    const res = await fetch('/api/admin/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load admin stats');
    return res.json();
  },

  async adminGetTemplates(token: string): Promise<Template[]> {
    const res = await fetch('/api/admin/templates', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch admin templates');
    return res.json();
  },

  async adminCreateTemplate(token: string, data: Partial<Template>): Promise<Template> {
    const res = await fetch('/api/admin/templates', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create template' }));
      throw new Error(err.error || 'Failed to create template');
    }
    return res.json();
  },

  async adminUpdateTemplate(token: string, id: string, data: Partial<Template>): Promise<Template> {
    const res = await fetch(`/api/admin/templates/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update template' }));
      throw new Error(err.error || 'Failed to update template');
    }
    return res.json();
  },

  async adminDeleteTemplate(token: string, id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/admin/templates/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to delete template');
    return res.json();
  },

  async adminUploadImage(token: string, image: string, name?: string): Promise<{ url: string; success: boolean }> {
    const res = await fetch('/api/admin/upload-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ image, name })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Failed to upload image');
    }
    return res.json();
  },

  async adminGetOrders(token: string): Promise<Order[]> {
    const res = await fetch('/api/admin/orders', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load orders');
    return res.json();
  },

  async adminUpdateOrderStatus(
    token: string, 
    orderId: string, 
    paymentStatus: PaymentStatus, 
    accessStatus?: AccessStatus
  ): Promise<Order> {
    const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ payment_status: paymentStatus, access_status: accessStatus })
    });
    if (!res.ok) throw new Error('Failed to update order');
    return res.json();
  },

  // Admin Contact Messages
  async adminGetMessages(token: string): Promise<ContactMessage[]> {
    const res = await fetch('/api/admin/messages', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load contact messages');
    return res.json();
  },

  async adminDeleteMessage(token: string, id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/admin/messages/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json().catch(() => ({ error: 'Failed to delete message' }));
    if (!res.ok) throw new Error(data.error || 'Failed to delete message');
    return data;
  },

  // Admin Settings & Google Sheet Webhooks
  async adminGetSettings(token: string): Promise<{ 
    google_sheet_webhook_url: string; 
    google_sheet_orders_webhook_url: string; 
    google_sheet_inquiry_webhook_url: string; 
    env_configured: boolean;
  }> {
    const res = await fetch('/api/admin/settings', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load settings');
    return res.json();
  },

  async adminUpdateSettings(
    token: string, 
    settings: Partial<AppSettings>
  ): Promise<{ success: boolean; message?: string }> {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(settings)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update settings' }));
      throw new Error(err.error || 'Failed to update settings');
    }
    return res.json();
  },

  async adminTestSheetWebhook(token: string, webhook_url?: string, type?: 'orders' | 'inquiries'): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/admin/test-sheet-webhook', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ webhook_url, type })
    });
    const data = await res.json().catch(() => ({ error: 'Connection test failed' }));
    if (!res.ok) throw new Error(data.error || 'Connection test failed');
    return data;
  },

  async adminResyncMessage(token: string, id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/admin/resync-message/${id}`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}` 
      }
    });
    const data = await res.json().catch(() => ({ error: 'Resync failed' }));
    if (!res.ok) throw new Error(data.error || 'Resync failed');
    return data;
  },

  async adminClearTestData(token: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/admin/clear-test-data', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json().catch(() => ({ error: 'Failed to reset test data' }));
    if (!res.ok) throw new Error(data.error || 'Failed to reset test data');
    return data;
  },

  async adminDeleteOrder(token: string, orderId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json().catch(() => ({ error: 'Failed to delete order' }));
    if (!res.ok) throw new Error(data.error || 'Failed to delete order');
    return data;
  },

  async adminRestoreSampleTemplate(token: string): Promise<{ success: boolean; template: Template }> {
    const res = await fetch('/api/admin/restore-sample-template', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json().catch(() => ({ error: 'Failed to restore sample template' }));
    if (!res.ok) throw new Error(data.error || 'Failed to restore sample template');
    return data;
  }
};
