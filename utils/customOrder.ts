/** Each non-empty line is one requested item; leading bullets/dashes are stripped. */
export function parseCustomOrderLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s•\-*–—]+/, '').trim())
    .filter(Boolean);
}

export const CUSTOM_ORDER_MAX_ITEMS = 30;
export const CUSTOM_ORDER_MAX_LINE_LENGTH = 200;

export function validateCustomOrderItems(items: string[]): string | null {
  if (items.length === 0) {
    return 'Enter at least one item (one per line).';
  }
  if (items.length > CUSTOM_ORDER_MAX_ITEMS) {
    return `You can request up to ${CUSTOM_ORDER_MAX_ITEMS} items per order.`;
  }
  const tooLong = items.find((item) => item.length > CUSTOM_ORDER_MAX_LINE_LENGTH);
  if (tooLong) {
    return `Each line must be ${CUSTOM_ORDER_MAX_LINE_LENGTH} characters or fewer.`;
  }
  return null;
}
