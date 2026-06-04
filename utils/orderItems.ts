import type { Product } from '@/types/domain';

export type OrderLineItem = {
  productId: string | number;
  quantity: number;
};

type CartLine = {
  product: Product;
  quantity: number;
};

/** Coerces catalog product ids for POST /api/orders (numeric id or string). */
export function normalizeProductIdForOrder(id: string | number): string | number | null {
  if (id === '' || id == null) {
    return null;
  }
  if (typeof id === 'number' && Number.isFinite(id)) {
    return id;
  }
  const text = String(id).trim();
  if (!text) {
    return null;
  }
  const asNumber = Number(text);
  if (!Number.isNaN(asNumber) && Number.isFinite(asNumber) && String(asNumber) === text) {
    return asNumber;
  }
  return text;
}

export function buildOrderItemsFromCart(cart: CartLine[]): OrderLineItem[] {
  const items: OrderLineItem[] = [];
  for (const line of cart) {
    const productId = normalizeProductIdForOrder(line.product.id);
    if (productId == null) {
      continue;
    }
    items.push({
      productId,
      quantity: Math.max(1, Math.floor(line.quantity)),
    });
  }
  return items;
}
