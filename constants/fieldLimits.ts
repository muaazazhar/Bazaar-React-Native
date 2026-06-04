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
  password: 128,
  verificationCode: 6,
} as const;

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
