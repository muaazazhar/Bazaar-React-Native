import { useEffect, useRef } from 'react';

import { useNotification } from '@/context/NotificationContext';
import { useGetMyOrdersPreviewQuery } from '@/store/api/ordersApi';
import { useAppSelector } from '@/store/hooks';
import { orderStatusUpdatedMessage } from '@/utils/notificationMessages';

const POLL_INTERVAL_MS = 25_000;

/**
 * Polls the latest orders page and shows in-app notifications when status changes.
 */
export function OrderStatusWatcher() {
  const user = useAppSelector((state) => state.auth.user);
  const hydrated = useAppSelector((state) => state.auth.hydrated);
  const { notify } = useNotification();
  const skip = !hydrated || !user || user.role === 'admin';

  const { data: orders = [] } = useGetMyOrdersPreviewQuery(undefined, {
    skip,
    pollingInterval: POLL_INTERVAL_MS,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const initializedRef = useRef(false);
  const statusByOrderRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!user || user.role === 'admin') {
      initializedRef.current = false;
      statusByOrderRef.current = {};
      return;
    }

    if (!orders.length) {
      return;
    }

    if (!initializedRef.current) {
      for (const order of orders) {
        statusByOrderRef.current[String(order.id)] = order.status;
      }
      initializedRef.current = true;
      return;
    }

    for (const order of orders) {
      const orderId = String(order.id);
      const previous = statusByOrderRef.current[orderId];
      const next = order.status;

      if (previous && previous.toLowerCase() !== next.toLowerCase()) {
        notify(orderStatusUpdatedMessage(order.orderNo, next));
      }

      statusByOrderRef.current[orderId] = next;
    }
  }, [orders, notify, user]);

  return null;
}
