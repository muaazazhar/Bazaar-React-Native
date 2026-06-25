import { useCallback, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiErrorBanner } from '@/components/api-feedback';
import { OrderListSkeleton } from '@/components/catalog-skeletons';
import { ListEmptyPlaceholder } from '@/components/list-empty-placeholder';
import { PaginatedFlatList, paginatedListStyles } from '@/components/paginated-flat-list';
import { CustomOrderBadge } from '@/components/custom-order-badge';
import { OrderCustomerDetails } from '@/components/order-customer-details';
import { OrderItemsList } from '@/components/order-items-list';
import { useNotification } from '@/context/NotificationContext';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ValidatingTextInput } from '@/components/validating-text-input';
import { FIELD_LIMITS } from '@/constants/fieldLimits';
import { usePaginatedInfiniteList } from '@/hooks/use-paginated-infinite-list';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
  useGetAllOrderPagesInfiniteQuery,
  useUpdateOrderStatusMutation,
  type OrderStatus,
} from '@/store/api/ordersApi';
import type { Order } from '@/types/domain';
import { getApiErrorDetails } from '@/utils/apiError';
import { notifyApiFailure } from '@/utils/inAppNotify';
import {
  adminOrderStatusUpdatedMessage,
  orderStatusLockedMessage,
  orderStatusUpdateBusyMessage,
} from '@/utils/notificationMessages';
import {
  formatOrderHeading,
  formatOrderStatus,
  formatPaymentMethod,
  getOrderListMeta,
  isTerminalOrderStatus,
  normalizeOrderStatusKey,
} from '@/utils/orderDisplay';

const CANCEL_REASON_MAX = 300;

export default function AdminOrdersScreen() {
  const [busy, setBusy] = useState(false);
  const { notify } = useNotification();
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelReasonError, setCancelReasonError] = useState<string | null>(null);

  const query = useGetAllOrderPagesInfiniteQuery();
  const { items, isInitialLoading, loadMore, isFetchingNextPage } = usePaginatedInfiniteList(query);
  const [updateOrderStatus] = useUpdateOrderStatusMutation();

  const borderColor = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const muted = useThemeColor({}, 'muted');
  const surfaceAlt = useThemeColor({}, 'surfaceAlt');

  const loadErrorDetails = query.isError
    ? getApiErrorDetails(query.error, 'Could not load orders.')
    : null;

  const setActionFailure = (err: unknown, fallback: string, context: string) => {
    notifyApiFailure(notify, err, fallback, {
      title: 'Could not update order',
      context,
    });
  };

  const findOrder = (orderId: string) => items.find((o) => String(o.id) === orderId);

  const isStatusActionBlocked = (orderId: string | number, currentStatus: string): boolean => {
    if (busy) {
      notify(orderStatusUpdateBusyMessage());
      return true;
    }
    if (isTerminalOrderStatus(currentStatus)) {
      notify(orderStatusLockedMessage(findOrder(String(orderId))?.orderNo, currentStatus));
      return true;
    }
    return false;
  };

  const handleStatusUpdate = async (orderId: string, status: OrderStatus, currentStatus: string) => {
    if (isStatusActionBlocked(orderId, currentStatus)) {
      return;
    }
    setBusy(true);
    try {
      await updateOrderStatus({ id: orderId, status }).unwrap();
      await query.refetch();
      notify(adminOrderStatusUpdatedMessage(findOrder(orderId)?.orderNo, status));
    } catch (err) {
      setActionFailure(err, 'Could not update order status.', `PATCH /api/orders/${orderId}`);
    } finally {
      setBusy(false);
    }
  };

  const openCancelModal = (orderId: string, currentStatus: string) => {
    if (isStatusActionBlocked(orderId, currentStatus)) {
      return;
    }
    setCancelOrderId(orderId);
    setCancelReason('');
    setCancelReasonError(null);
    setCancelModalVisible(true);
  };

  const closeCancelModal = () => {
    setCancelModalVisible(false);
    setCancelOrderId(null);
    setCancelReason('');
    setCancelReasonError(null);
  };

  const submitCancel = async () => {
    if (!cancelOrderId) return;
    const trimmed = cancelReason.trim();
    if (!trimmed) {
      setCancelReasonError('Cancellation reason is required.');
      return;
    }

    setBusy(true);
    try {
      await updateOrderStatus({
        id: cancelOrderId,
        status: 'cancelled',
        cancellationReason: trimmed,
      }).unwrap();
      closeCancelModal();
      await query.refetch();
      notify(adminOrderStatusUpdatedMessage(findOrder(cancelOrderId)?.orderNo, 'cancelled'));
    } catch (err) {
      setActionFailure(
        err,
        'Could not cancel order. Check that a cancellation reason was provided.',
        `PATCH /api/orders/${cancelOrderId} (cancelled)`,
      );
    } finally {
      setBusy(false);
    }
  };

  const renderOrder = useCallback(
    ({ item: order }: { item: Order }) => {
      const terminal = isTerminalOrderStatus(order.status);
      const actionsDisabled = busy || terminal;
      const statusKey = normalizeOrderStatusKey(order.status);
      const { isCustom, itemLabels, totalLabel } = getOrderListMeta(order);
      return (
        <ThemedView style={[styles.card, { borderColor, backgroundColor: surface }]}>
          <ThemedText type="defaultSemiBold">{formatOrderHeading(order)}</ThemedText>
          {isCustom ? <CustomOrderBadge color={muted} /> : null}
          <OrderCustomerDetails order={order} />
          <ThemedText>
            Status: {formatOrderStatus(order.status)}
            {terminal ? (
              <ThemedText style={{ color: muted }}> (final)</ThemedText>
            ) : null}
          </ThemedText>
          <ThemedText>
            Payment: {formatPaymentMethod(order.paymentMethod, order.walletProvider)}
          </ThemedText>
          <ThemedText>Address: {order.address}</ThemedText>
          <ThemedText>Total: {totalLabel}</ThemedText>
          <OrderItemsList title={isCustom ? 'Requested items' : 'Items'} labels={itemLabels} />
          {order.status.toLowerCase() === 'cancelled' && order.cancellationReason ? (
            <ThemedText style={{ color: muted }}>
              Cancellation reason: {order.cancellationReason}
            </ThemedText>
          ) : null}
          {terminal ? (
            <ThemedText style={[styles.terminalHint, { color: muted, backgroundColor: surfaceAlt, borderColor }]}>
              This order is {statusKey === 'cancelled' || statusKey === 'canceled' ? 'cancelled' : 'fulfilled'}.
              Status can no longer be changed.
            </ThemedText>
          ) : null}
          <View style={styles.statusRow}>
            <ThemedButton
              variant="secondary"
              label="Processing"
              loading={busy && !terminal}
              disabled={actionsDisabled}
              onPress={() => handleStatusUpdate(String(order.id), 'processing', order.status)}
              style={styles.statusActionButton}
            />
            <ThemedButton
              variant="secondary"
              label="Fulfilled"
              loading={busy && !terminal}
              disabled={actionsDisabled}
              onPress={() => handleStatusUpdate(String(order.id), 'fulfilled', order.status)}
              style={styles.statusActionButton}
            />
            <ThemedButton
              variant="danger"
              label="Cancel"
              loading={busy && !terminal}
              disabled={actionsDisabled}
              onPress={() => openCancelModal(String(order.id), order.status)}
              style={styles.statusActionButton}
            />
          </View>
        </ThemedView>
      );
    },
    [borderColor, busy, muted, surface, surfaceAlt],
  );

  const listEmpty = (
    <ListEmptyPlaceholder
      isLoading={isInitialLoading}
      isError={Boolean(loadErrorDetails)}
      loadingSkeleton={<OrderListSkeleton count={3} />}
      emptyLabel="No orders yet."
    />
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <PaginatedFlatList
        data={items}
        renderItem={renderOrder}
        ListHeaderComponent={
          <>
            <ScreenHeader title="Admin Orders" />
            <ApiErrorBanner
              title="Could not load orders"
              message={loadErrorDetails?.message}
              onRetry={() => void query.refetch()}
            />
            <ThemedButton
              variant="secondary"
              label={query.isFetching && !query.isLoading ? 'Refreshing...' : 'Refresh Orders'}
              loading={query.isFetching && !isInitialLoading}
              onPress={() => void query.refetch()}
              disabled={busy}
            />
          </>
        }
        ListEmptyComponent={listEmpty}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={loadMore}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={paginatedListStyles.contentWide}
      />

      <Modal visible={cancelModalVisible} transparent animationType="fade" onRequestClose={closeCancelModal}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.modalOverlayInner}>
          <ThemedView style={[styles.modalCard, { borderColor, backgroundColor: surface }]}>
            <ThemedText type="subtitle">
              Cancel {cancelOrderId ? formatOrderHeading(findOrder(cancelOrderId) ?? { orderNo: '' }) : 'order'}
            </ThemedText>
            <ThemedText style={{ color: muted }}>
              Provide a reason. It will be visible to the customer on their orders.
            </ThemedText>
            <ValidatingTextInput
              label="Cancellation reason"
              placeholder="e.g. Out of stock"
              value={cancelReason}
              onChangeText={(text) => {
                setCancelReason(text);
                if (cancelReasonError) setCancelReasonError(null);
              }}
              maxLength={CANCEL_REASON_MAX}
              multiline
              error={cancelReasonError}
            />
            <View style={styles.modalActions}>
              <ThemedButton
                variant="secondary"
                label="Back"
                onPress={closeCancelModal}
                disabled={busy}
                style={styles.modalActionButton}
              />
              <ThemedButton
                variant="danger"
                label="Confirm cancel"
                loading={busy}
                onPress={submitCancel}
                disabled={busy}
                style={styles.modalActionButton}
              />
            </View>
          </ThemedView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  card: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusActionButton: {
    minWidth: 96,
    flexGrow: 1,
  },
  terminalHint: {
    fontSize: 13,
    lineHeight: 18,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalOverlay: {
    flex: 1,
  },
  modalOverlayInner: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalActionButton: {
    flex: 1,
  },
});
