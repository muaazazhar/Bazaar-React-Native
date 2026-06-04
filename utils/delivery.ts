import type { StoreSettings } from '@/types/domain';

export type CheckoutTotals = {
  subtotal: number;
  deliveryCharge: number;
  grandTotal: number;
  freeDelivery: boolean;
};

export function getCheckoutTotals(
  subtotal: number,
  settings: StoreSettings | null | undefined,
): CheckoutTotals {
  const freeDelivery = settings?.freeDeliveryEnabled === true;
  const rawCharge = Number(settings?.deliveryCharge ?? 0);
  const deliveryCharge = freeDelivery
    ? 0
    : Math.max(0, Number.isFinite(rawCharge) ? Math.round(rawCharge) : 0);

  const roundedSubtotal = Math.max(0, Math.round(subtotal));

  return {
    subtotal: roundedSubtotal,
    deliveryCharge,
    grandTotal: roundedSubtotal + deliveryCharge,
    freeDelivery,
  };
}
