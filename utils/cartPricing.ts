import type { Product } from '@/types/domain';

export function getProductBasePrice(product: Product): number {
  return typeof product.price === 'string' ? Number(product.price) : product.price;
}

export function getProductDiscountedPrice(product: Product): number {
  const basePrice = getProductBasePrice(product);
  const discount = Number(product.discountPercent ?? 0);
  if (!Number.isFinite(discount) || discount <= 0) {
    return basePrice;
  }
  return basePrice * (1 - Math.min(discount, 100) / 100);
}

export function getLineTotals(product: Product, quantity: number) {
  const basePrice = getProductBasePrice(product);
  const discounted = getProductDiscountedPrice(product);
  return {
    lineTotal: Math.round(discounted * quantity),
    originalLineTotal: Math.round(basePrice * quantity),
    savings: Math.max(0, Math.round((basePrice - discounted) * quantity)),
    hasDiscount: Number(product.discountPercent ?? 0) > 0,
  };
}
