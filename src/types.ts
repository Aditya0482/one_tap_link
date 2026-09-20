export type CategoryType = 
  | 'Finance'
  | 'Business'
  | 'Productivity'
  | 'Content'
  | 'Planning'
  | 'Personal'
  | 'Marketing'
  | 'Real Estate';

export type TemplateStatus = 'Draft' | 'Published';
export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';
export type AccessStatus = 'Granted' | 'Pending' | 'Revoked';

export type SpreadsheetMockRow = Array<string | number> | { cells: Array<string | number> };

export interface SpreadsheetMockData {
  sheetName: string;
  tabs: string[];
  kpis: Array<{
    label: string;
    value: string;
    change?: string;
    isPositive?: boolean;
    color?: string;
  }>;
  headers: string[];
  rows: SpreadsheetMockRow[];
  chartType?: 'bar' | 'donut' | 'line';
  chartData?: Array<{ label: string; value: number; color?: string }>;
}

export interface TemplateFAQ {
  question: string;
  answer: string;
}

export interface Template {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: CategoryType | string;
  price: number;
  original_price?: number;
  sale_price?: number;
  thumbnail_url: string;
  demo_url?: string;
  access_url?: string; // Private, omitted in public listings, delivered only upon successful order
  features: string[];
  included_items: string[];
  faq: TemplateFAQ[];
  status: TemplateStatus;
  created_at: string;
  updated_at: string;
  sheet_preview?: SpreadsheetMockData;
  images?: string[];
}

export interface TemplateImage {
  id: string;
  template_id: string;
  image_url: string;
  sort_order: number;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  user_id?: string;
  template_id: string;
  template_title?: string;
  template_thumbnail?: string;
  amount: number;
  currency: string;
  payment_status: PaymentStatus;
  access_status: AccessStatus;
  payment_reference: string;
  payment_gateway?: 'instamojo' | 'razorpay' | 'test';
  instamojo_payment_request_id?: string;
  instamojo_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  created_at: string;
  updated_at: string;
  access_url?: string; // Included when payment is Paid
}

export interface PurchaseRecord {
  id?: string;
  userId: string;
  customerEmail?: string;
  userEmail?: string;
  customerName?: string;
  customerPhone?: string;
  productId: string;
  productName: string;
  amount: number;
  currency?: string;
  paymentGateway?: string;
  instamojoPaymentRequestId?: string;
  instamojoPaymentId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentStatus: string;
  purchasedAt: string;
  accessUrl?: string;
  thumbnailUrl?: string;
}


export interface RazorpayOrderResponse {
  success: boolean;
  key_id: string;
  order_id: string;
  amount: number;
  currency: string;
  product_id: string;
  product_name: string;
  internal_order_id: string;
  is_test_simulation?: boolean;
  warning?: string;
}

export interface RazorpayVerifyResponse {
  success: boolean;
  verified: boolean;
  order: Order;
  purchase: PurchaseRecord;
  message?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
}

export interface User {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  name?: string;
  phone?: string;
  created_at?: string;
}

export interface AdminDashboardStats {
  total_sales: number;
  total_orders: number;
  total_templates: number;
  published_templates: number;
  recent_orders: Order[];
}

export interface CheckoutPayload {
  customer_name: string;
  customer_email: string;
  template_id: string;
  payment_method?: string;
}

export interface ContactMessage {
  id: string;
  ticket_id: string;
  name: string;
  email: string;
  category: string;
  order_id?: string;
  subject?: string;
  message: string;
  created_at: string;
  synced_to_sheet?: boolean;
  sheet_sync_error?: string;
}

export interface AppSettings {
  google_sheet_webhook_url?: string;
  google_sheet_orders_webhook_url?: string;
  google_sheet_inquiry_webhook_url?: string;
}
