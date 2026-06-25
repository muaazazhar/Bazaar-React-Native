import { router } from 'expo-router';

import type { Order } from '@/types/domain';
import type { AppDispatch } from '@/store/index';
import type { NotifyInput } from '@/context/NotificationContext';
import { buildReceiptRouteParams, isCustomOrder } from '@/utils/orderDisplay';
import { queueReceiptForOrder } from '@/utils/receiptSession';

type NotifyFn = (input: NotifyInput) => void;

/** Prefetch receipt after checkout; failures are non-fatal (user can open from My Orders). */
export async function prefetchOrderReceipt(
  dispatch: AppDispatch,
  orderId: string | number,
  onProgress?: (label: string) => void,
): Promise<void> {
  onProgress?.('Generating receipt...');
  try {
    await queueReceiptForOrder(dispatch, orderId);
  } catch {
    // Receipt may still be created server-side.
  }
}

/** Shared post-checkout flow: toast, then bank transfer or receipt. */
export function navigateAfterOrderPlaced(order: Order): void {
  if (order.paymentMethod === 'bank_transfer' && !isCustomOrder(order)) {
    router.replace({
      pathname: '/bank-transfer',
      params: {
        orderId: String(order.id),
        orderNo: order.orderNo,
        total: String(order.total),
      },
    });
    return;
  }

  router.replace({
    pathname: '/receipt',
    params: buildReceiptRouteParams(order),
  });
}

export async function completeOrderPlacement(
  dispatch: AppDispatch,
  order: Order,
  options: {
    notify: NotifyFn;
    notification: NotifyInput;
    onBeforeNavigate?: () => void;
    onProgress?: (label: string) => void;
  },
): Promise<void> {
  await prefetchOrderReceipt(dispatch, order.id, options.onProgress);
  options.onBeforeNavigate?.();
  options.notify(options.notification);
  navigateAfterOrderPlaced(order);
}
