import { ordersApi } from '@/store/api/ordersApi';
import type { AppDispatch } from '@/store/index';
import { registerPendingSessionTask } from '@/store/pendingSessionTasks';

const RECEIPT_TASK_PREFIX = 'receipt:';

export function receiptTaskId(orderId: string | number): string {
  return `${RECEIPT_TASK_PREFIX}${orderId}`;
}

export async function fetchReceiptForOrder(
  dispatch: AppDispatch,
  orderId: string | number,
): Promise<void> {
  const id = String(orderId);
  await dispatch(
    ordersApi.endpoints.getReceipt.initiate({ id }, { forceRefetch: true }),
  ).unwrap();
}

/** Ensures receipt API runs before logout; reuses the same promise if already queued. */
export function queueReceiptForOrder(dispatch: AppDispatch, orderId: string | number): Promise<void> {
  const taskId = receiptTaskId(orderId);
  const work = fetchReceiptForOrder(dispatch, orderId);
  registerPendingSessionTask(taskId, () => work);
  return work;
}
