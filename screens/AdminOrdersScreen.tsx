import { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiErrorBanner } from '@/components/api-feedback';
import { OrderItemsList } from '@/components/order-items-list';
import { useNotification } from '@/context/NotificationContext';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ValidatingTextInput } from '@/components/validating-text-input';
import { FIELD_LIMITS } from '@/constants/fieldLimits';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGetAllOrdersQuery, useUpdateOrderStatusMutation, type OrderStatus } from '@/store/api/ordersApi';
import { getApiErrorDetails } from '@/utils/apiError';
import { notifyApiFailure } from '@/utils/inAppNotify';
import {
  adminOrderStatusUpdatedMessage,
  orderStatusLockedMessage,
  orderStatusUpdateBusyMessage,
} from '@/utils/notificationMessages';
import {
  CUSTOM_ORDER_BADGE,
  formatOrderHeading,
  formatOrderStatus,
  formatPaymentMethod,
  getOrderCustomerLabel,
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

  const { data: orders = [], isLoading, isError, error, refetch } = useGetAllOrdersQuery();
  const [updateOrderStatus] = useUpdateOrderStatusMutation();

  const borderColor = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const primary = useThemeColor({}, 'primary');
  const primaryText = useThemeColor({}, 'primaryText');
  const danger = useThemeColor({}, 'danger');
  const muted = useThemeColor({}, 'muted');
  const text = useThemeColor({}, 'text');
  const surfaceAlt = useThemeColor({}, 'surfaceAlt');

  const loadErrorDetails = isError
    ? getApiErrorDetails(error, 'Could not load orders.')
    : null;

  const setActionFailure = (err: unknown, fallback: string, context: string) => {
    notifyApiFailure(notify, err, fallback, {
      title: 'Could not update order',
      context,
    });
  };

  const findOrder = (orderId: string) => orders.find((o) => String(o.id) === orderId);

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
      await refetch();
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
      await refetch();
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        automaticallyAdjustKeyboardInsets>
        <ScreenHeader title="Admin Orders" />
        <ApiErrorBanner
          title="Could not load orders"
          message={loadErrorDetails?.message}
          onRetry={refetch}
        />
        <Pressable style={[styles.secondaryButton, { borderColor }]} onPress={refetch} disabled={busy}>
          <ThemedText>{isLoading ? 'Refreshing...' : 'Refresh Orders'}</ThemedText>
        </Pressable>
        {isLoading ? <ActivityIndicator /> : null}
        {!isLoading && !loadErrorDetails && orders.length === 0 ? (
          <ThemedText style={{ color: muted }}>No orders yet.</ThemedText>
        ) : null}
        {orders.map((order) => {
          const terminal = isTerminalOrderStatus(order.status);
          const actionsDisabled = busy || terminal;
          const statusKey = normalizeOrderStatusKey(order.status);
          const { isCustom, itemLabels, totalLabel } = getOrderListMeta(order);
          return (
            <ThemedView key={String(order.id)} style={[styles.card, { borderColor, backgroundColor: surface }]}>
              <ThemedText type="defaultSemiBold">{formatOrderHeading(order)}</ThemedText>
              {isCustom ? (
                <ThemedText style={{ color: muted, fontSize: 13 }}>{CUSTOM_ORDER_BADGE}</ThemedText>
              ) : null}
              <ThemedText>Customer: {getOrderCustomerLabel(order)}</ThemedText>
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
                <Pressable
                  style={[
                    styles.statusButton,
                    actionsDisabled
                      ? { backgroundColor: surfaceAlt, borderColor }
                      : { borderColor, backgroundColor: surface },
                  ]}
                  onPress={() => handleStatusUpdate(String(order.id), 'processing', order.status)}
                  accessibilityState={{ disabled: actionsDisabled }}>
                  <ThemedText style={{ color: actionsDisabled ? muted : text }}>Processing</ThemedText>
                </Pressable>
                <Pressable
                  style={[
                    styles.statusButton,
                    actionsDisabled
                      ? { backgroundColor: surfaceAlt, borderColor }
                      : { borderColor, backgroundColor: surface },
                  ]}
                  onPress={() => handleStatusUpdate(String(order.id), 'fulfilled', order.status)}
                  accessibilityState={{ disabled: actionsDisabled }}>
                  <ThemedText style={{ color: actionsDisabled ? muted : text }}>Fulfilled</ThemedText>
                </Pressable>
                <Pressable
                  style={[
                    styles.statusButton,
                    actionsDisabled
                      ? { backgroundColor: surfaceAlt, borderColor }
                      : { borderColor: danger, backgroundColor: surface },
                  ]}
                  onPress={() => openCancelModal(String(order.id), order.status)}
                  accessibilityState={{ disabled: actionsDisabled }}>
                  <ThemedText style={{ color: actionsDisabled ? muted : danger }}>Cancel</ThemedText>
                </Pressable>
              </View>
            </ThemedView>
          );
        })}
      </ScrollView>

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
              <Pressable
                style={[styles.secondaryButton, { borderColor, flex: 1 }]}
                onPress={closeCancelModal}
                disabled={busy}>
                <ThemedText>Back</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.button, { backgroundColor: danger, flex: 1 }, busy && styles.buttonDisabled]}
                onPress={submitCancel}
                disabled={busy}>
                {busy ? (
                  <ActivityIndicator color={primaryText} />
                ) : (
                  <ThemedText style={[styles.buttonText, { color: primaryText }]}>Confirm cancel</ThemedText>
                )}
              </Pressable>
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
  container: {
    flexGrow: 1,
    padding: 16,
    gap: 12,
    width: '100%',
    maxWidth: 860,
    alignSelf: 'center',
  },
  card: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  statusButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 96,
  },
  terminalHint: {
    fontSize: 13,
    lineHeight: 18,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  button: {
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  buttonDisabled: {
    opacity: 0.7,
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
});
