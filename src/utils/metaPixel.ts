// Utility for Facebook / Meta Pixel tracking across OneTapLink SPA

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

export const META_PIXEL_ID = '4596582637297621';

/**
 * Safely trigger an fbq event if Meta Pixel script is loaded
 */
export const trackFbq = (action: 'track' | 'trackCustom', eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    try {
      if (params) {
        window.fbq(action, eventName, params);
      } else {
        window.fbq(action, eventName);
      }
    } catch (err) {
      console.warn('[Meta Pixel] Error tracking event:', eventName, err);
    }
  }
};

/**
 * Track PageView on route or tab transitions
 */
export const trackPageView = (pageName?: string) => {
  trackFbq('track', 'PageView', pageName ? { page_name: pageName } : undefined);
};

/**
 * Track ViewContent when a user views a specific template/product
 */
export const trackViewContent = (template: {
  id: string;
  title: string;
  price?: number;
  sale_price?: number;
  category?: string;
}) => {
  const value = template.sale_price ?? template.price ?? 0;
  trackFbq('track', 'ViewContent', {
    content_name: template.title,
    content_category: template.category,
    content_ids: [template.id],
    content_type: 'product',
    value: value,
    currency: 'INR'
  });
};

/**
 * Track InitiateCheckout when customer opens checkout or clicks Buy Now
 */
export const trackInitiateCheckout = (template: {
  id: string;
  title: string;
  price?: number;
  sale_price?: number;
}) => {
  const value = template.sale_price ?? template.price ?? 0;
  trackFbq('track', 'InitiateCheckout', {
    content_name: template.title,
    content_ids: [template.id],
    content_type: 'product',
    value: value,
    currency: 'INR',
    num_items: 1
  });
};

/**
 * Track Purchase when payment is verified and customer lands on Thank You page
 */
export const trackPurchase = (order: {
  id: string;
  template_id?: string;
  template_title?: string;
  amount: number;
  currency?: string;
}) => {
  trackFbq('track', 'Purchase', {
    content_name: order.template_title || 'Template Order',
    content_ids: [order.template_id || order.id],
    content_type: 'product',
    value: order.amount,
    currency: order.currency || 'INR',
    order_id: order.id
  });
};

/**
 * Track Contact event when inquiry/support form is submitted
 */
export const trackContact = (category?: string) => {
  trackFbq('track', 'Contact', {
    content_category: category || 'General Inquiry'
  });
};
