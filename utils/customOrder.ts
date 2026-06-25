import { FIELD_LIMITS, validateAddress } from '@/constants/fieldLimits';

/** Each non-empty line is one requested item; leading bullets/dashes are stripped. */
export function parseCustomOrderLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s•\-*–—]+/, '').trim())
    .filter(Boolean);
}

export const CUSTOM_ORDER_MAX_ITEMS = 30;
export const CUSTOM_ORDER_MIN_ITEM_LENGTH = 2;

export type CustomOrderFieldErrors = {
  items?: string;
  address?: string;
};

export function validateCustomOrderItems(items: string[]): string | null {
  if (items.length === 0) {
    return 'Enter at least one item (one per line).';
  }
  if (items.length > CUSTOM_ORDER_MAX_ITEMS) {
    return `You can request up to ${CUSTOM_ORDER_MAX_ITEMS} items per order.`;
  }

  const maxLineLength = FIELD_LIMITS.customOrderLine;
  const tooLongIndex = items.findIndex((item) => item.length > maxLineLength);
  if (tooLongIndex !== -1) {
    return `Item ${tooLongIndex + 1} must be ${maxLineLength} characters or fewer.`;
  }

  const tooShortIndex = items.findIndex((item) => item.length < CUSTOM_ORDER_MIN_ITEM_LENGTH);
  if (tooShortIndex !== -1) {
    return `Item ${tooShortIndex + 1} must be at least ${CUSTOM_ORDER_MIN_ITEM_LENGTH} characters.`;
  }

  const seen = new Set<string>();
  for (let index = 0; index < items.length; index += 1) {
    const key = items[index].toLowerCase();
    if (seen.has(key)) {
      return `Item ${index + 1} is a duplicate. Remove repeated lines.`;
    }
    seen.add(key);
  }

  return null;
}

export function validateCustomOrderItemsInput(text: string): string | null {
  if (!text.trim()) {
    return 'Enter at least one item (one per line).';
  }

  const parsed = parseCustomOrderLines(text);
  if (parsed.length === 0) {
    return 'Enter at least one valid item. Blank lines and bullets alone do not count.';
  }

  return validateCustomOrderItems(parsed);
}

export function validateCustomOrderForm(
  itemsText: string,
  address: string,
): CustomOrderFieldErrors {
  const errors: CustomOrderFieldErrors = {};
  const itemsError = validateCustomOrderItemsInput(itemsText);
  const addressError = validateAddress(address);

  if (itemsError) errors.items = itemsError;
  if (addressError) errors.address = addressError;

  return errors;
}

export function buildCustomOrderBody(itemsText: string, address: string) {
  const errors = validateCustomOrderForm(itemsText, address);
  if (errors.items || errors.address) {
    throw new Error(errors.items ?? errors.address ?? 'Invalid custom order.');
  }

  return {
    address: address.trim(),
    customItems: parseCustomOrderLines(itemsText),
    paymentMethod: 'cash_on_delivery' as const,
  };
}
