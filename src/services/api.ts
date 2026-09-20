import { 
  Template, 
  Order, 
  AdminDashboardStats, 
  CheckoutPayload, 
  PaymentStatus, 
  AccessStatus,
  ContactMessage,
  AppSettings,
  User,
  InstamojoConfigResponse,
  InstamojoPaymentRequestResponse,
  InstamojoVerifyResponse
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
    const data = await res.json();
    return data.order || data;
  },

  // Instamojo Payments
  async getInstamojoConfig(): Promise<InstamojoConfigResponse> {
    const res = await fetch('/api/instamojo/config');
    if (!res.ok) throw new Error('Failed to fetch payment configuration');
    return res.json();
  },

  async getCheckoutDetails(userId?: string, email?: string): Promise<{
    success: boolean;
    found: boolean;
    details: { name?: string; email?: string; phone?: string } | null;
  }> {
    try {
      const params = new URLSearchParams();
      if (userId && userId !== 'guest-checkout') params.append('userId', userId);
      if (email) params.append('email', email);
      const res = await fetch(`/api/user/checkout-details?${params.toString()}`);
      if (!res.ok) return { success: false, found: false, details: null };
      return await res.json();
    } catch {
      return { success: false, found: false, details: null };
    }
  },

  async createInstamojoPaymentRequest(payload: {
    template_id: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    user_id?: string;
  }): Promise<InstamojoPaymentRequestResponse> {
    const res = await fetch('/api/instamojo/create-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({ error: 'Failed to create payment request' }));
    if (!res.ok) {
      throw new Error(data.error || data.details || 'Failed to initialize Instamojo payment');
    }
    return data;
  },

  async simulateInstamojoPayment(payload: {
    payment_request_id: string;
    template_id: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    user_id?: string;
  }): Promise<InstamojoVerifyResponse> {
    const res = await fetch('/api/instamojo/simulate-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({ error: 'Payment simulation failed' }));
    if (!res.ok) {
      throw new Error(data.error || 'Payment simulation failed');
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

  // Customer Authentication (PostgreSQL)
  async customerSignup(payload: { name?: string; email: string; password: string }): Promise<{ success: boolean; token: string; user: User }> {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({ error: 'Signup failed' }));
    if (!res.ok) throw new Error(data.error || 'Failed to create account');
    return data;
  },

  async customerLogin(payload: { email: string; password: string }): Promise<{ success: boolean; token: string; user: User }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({ error: 'Login failed' }));
    if (!res.ok) throw new Error(data.error || 'Invalid email or password');
    return data;
  },

  async sendPasswordResetOtp(email: string): Promise<{ success: boolean; message: string; simulated?: boolean }> {
    const res = await fetch('/api/auth/forgot-password/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json().catch(() => ({ error: 'Failed to send OTP' }));
    if (!res.ok) throw new Error(data.error || 'Failed to send OTP code');
    return data;
  },

  async verifyPasswordResetOtp(email: string, otp: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/auth/forgot-password/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    const data = await res.json().catch(() => ({ error: 'Failed to verify OTP' }));
    if (!res.ok) throw new Error(data.error || 'Invalid OTP code');
    return data;
  },

  async resetPasswordWithOtp(email: string, otp: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/auth/forgot-password/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword })
    });
    const data = await res.json().catch(() => ({ error: 'Failed to reset password' }));
    if (!res.ok) throw new Error(data.error || 'Failed to reset password');
    return data;
  },

  async getCurrentUser(token?: string): Promise<User | null> {
    const activeToken = token || localStorage.getItem('onetap_customer_token');
    if (!activeToken) return null;
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${activeToken}` }
    });
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('onetap_customer_token');
        localStorage.removeItem('onetap_customer_user');
      }
      return null;
    }
    const data = await res.json();
    return data.user || null;
  },

  async customerLogout(token?: string): Promise<{ success: boolean }> {
    const activeToken = token || localStorage.getItem('onetap_customer_token');
    localStorage.removeItem('onetap_customer_token');
    localStorage.removeItem('onetap_customer_user');
    if (activeToken) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${activeToken}` }
      }).catch(() => {});
    }
    return { success: true };
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

  async adminDeleteTemplate(token: string, id: string, slug?: string, title?: string): Promise<{ success: boolean }> {
    const params = new URLSearchParams();
    if (slug) params.append('slug', slug);
    if (title) params.append('title', title);
    const queryString = params.toString() ? `?${params.toString()}` : '';

    const res = await fetch(`/api/admin/templates/${encodeURIComponent(id)}${queryString}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to delete template');
    return res.json();
  },

  async adminCleanupTemplateDuplicates(token: string): Promise<{ success: boolean; count: number; templates: Template[] }> {
    const res = await fetch('/api/admin/templates/cleanup-duplicates', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to cleanup duplicate templates');
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

  // Admin Settings
  async adminGetSettings(token: string): Promise<{ 
    database: string;
    database_connected: boolean;
  }> {
    const res = await fetch('/api/admin/settings', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load settings');
    return res.json();
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
