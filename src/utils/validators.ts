// ============================================================
// validators.ts — Shared input validation utilities
// Used across: CustomerAuthModal, Checkout, ContactPage,
//              AdminLogin, TemplateFormModal
// ============================================================

export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
};

export const isValidPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/[^0-9]/g, '');
  return cleaned.length >= 10 && cleaned.length <= 13;
};

export const isValidUrl = (url: string): boolean => {
  if (!url.trim()) return true; // optional fields
  try {
    new URL(url.trim());
    return true;
  } catch {
    return false;
  }
};

export const isValidSlug = (slug: string): boolean => {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim());
};

// ─── Field-level validators (return error string or '') ───

export const validateName = (name: string): string => {
  if (!name.trim()) return 'Please enter your full name.';
  if (name.trim().length < 2) return 'Name must be at least 2 characters.';
  if (name.trim().length > 100) return 'Name must be under 100 characters.';
  return '';
};

export const validateEmail = (email: string): string => {
  if (!email.trim()) return 'Please enter your email address.';
  if (!isValidEmail(email)) return 'Please enter a valid email address (e.g. name@example.com).';
  return '';
};

export const validatePassword = (password: string, label = 'Password'): string => {
  if (!password.trim()) return `Please enter your ${label.toLowerCase()}.`;
  if (password.trim().length < 6) return `${label} must be at least 6 characters.`;
  if (password.trim().length > 128) return `${label} must be under 128 characters.`;
  return '';
};

export const validateConfirmPassword = (password: string, confirm: string): string => {
  if (!confirm.trim()) return 'Please confirm your password.';
  if (password.trim() !== confirm.trim()) return 'Passwords do not match.';
  return '';
};

export const validatePhone = (phone: string): string => {
  if (!phone.trim()) return 'Phone number is required.';
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length < 10) return 'Please enter a valid 10-digit mobile number.';
  if (cleaned.length > 13) return 'Phone number is too long.';
  return '';
};

export const validateOptionalPhone = (phone: string): string => {
  if (!phone || !phone.trim()) return '';
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length < 10) return 'Please enter a valid 10-digit mobile number.';
  if (cleaned.length > 13) return 'Phone number is too long.';
  return '';
};

export const validateOtp = (otp: string): string => {
  if (!otp.trim()) return 'Please enter the 6-digit verification code.';
  if (!/^\d{6}$/.test(otp.trim())) return 'Code must be exactly 6 digits.';
  return '';
};

export const validateMessage = (msg: string, min = 10, max = 2000): string => {
  if (!msg.trim()) return 'Message is required.';
  if (msg.trim().length < min) return `Message must be at least ${min} characters.`;
  if (msg.trim().length > max) return `Message must be under ${max} characters.`;
  return '';
};

export const validateRequired = (value: string, label: string): string => {
  if (!value.trim()) return `${label} is required.`;
  return '';
};

export const validateUrl = (url: string, label = 'URL', required = false): string => {
  if (!url.trim()) return required ? `${label} is required.` : '';
  if (!isValidUrl(url)) return `Please enter a valid ${label} (must start with https://).`;
  return '';
};

export const validateSlug = (slug: string): string => {
  if (!slug.trim()) return 'Slug is required.';
  if (!isValidSlug(slug)) return 'Slug must be lowercase letters, numbers, and hyphens only (e.g. my-template).';
  return '';
};

export const validatePrice = (price: string | number): string => {
  const val = Number(price);
  if (isNaN(val) || price === '') return 'Price is required.';
  if (val < 0) return 'Price cannot be negative.';
  return '';
};

export const validateSalePrice = (salePrice: string | number, price: string | number): string => {
  if (salePrice === '' || salePrice === null || salePrice === undefined) return '';
  const sale = Number(salePrice);
  const original = Number(price);
  if (isNaN(sale)) return 'Sale price must be a valid number.';
  if (sale < 0) return 'Sale price cannot be negative.';
  if (!isNaN(original) && sale >= original) return 'Sale price must be less than the original price.';
  return '';
};
