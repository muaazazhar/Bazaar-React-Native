export const FIELD_LIMITS = {
  productName: 150,
  categoryName: 150,
  price: 12,
  discountPercent: 3,
  bankName: 100,
  accountTitle: 100,
  accountNumber: 30,
  iban: 34,
  address: 300,
  paymentReference: 100,
  deliveryCharge: 8,
  identifier: 150,
  username: 50,
  email: 150,
  phone: 20,
  password: 128,
  verificationCode: 6,
  customOrderNotes: 4000,
  customOrderLine: 200,
} as const;

export const MIN_PASSWORD_LENGTH = 8;

export function isEmpty(value: string): boolean {
  return !value.trim();
}

export function validateRequired(value: string, label: string): string | null {
  if (isEmpty(value)) {
    return `${label} is required.`;
  }
  return null;
}

export function validatePrice(value: string): string | null {
  const required = validateRequired(value, 'Price');
  if (required) return required;
  const price = Number(value);
  if (!Number.isFinite(price) || price <= 0) {
    return 'Price must be a positive number.';
  }
  return null;
}

/** Required when store uses fixed delivery (not free delivery). Must be > 0. */
export function validateDeliveryCharge(value: string): string | null {
  const required = validateRequired(value, 'Delivery charge');
  if (required) return required;
  const charge = Number(value);
  if (!Number.isFinite(charge) || charge <= 0) {
    return 'Delivery charge must be greater than zero.';
  }
  return null;
}

export function validateDiscount(value: string): string | null {
  const discount = Number(value || 0);
  if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
    return 'Discount must be between 0 and 100.';
  }
  return null;
}

export function validateEmail(value: string): string | null {
  const required = validateRequired(value, 'Email');
  if (required) return required;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    return 'Enter a valid email address.';
  }
  return null;
}

export function validatePhone(value: string): string | null {
  const required = validateRequired(value, 'Phone number');
  if (required) return required;
  const digits = value.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) {
    return 'Enter a valid phone number (e.g. 03001234567).';
  }
  return null;
}

export function validateUsername(value: string): string | null {
  const required = validateRequired(value, 'Username');
  if (required) return required;
  if (/\s/.test(value)) {
    return 'Username cannot contain spaces.';
  }
  return null;
}

export function validatePhoneOptional(value: string): string | null {
  if (!value.trim()) return null;
  return validatePhone(value);
}

export function validatePassword(value: string): string | null {
  const required = validateRequired(value, 'Password');
  if (required) return required;
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

export function validatePasswordConfirm(password: string, confirm: string): string | null {
  const required = validateRequired(confirm, 'Confirm password');
  if (required) return required;
  if (password !== confirm) {
    return 'Passwords do not match.';
  }
  return null;
}
