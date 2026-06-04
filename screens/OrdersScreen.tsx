import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiErrorBanner } from '@/components/api-feedback';
import { QueryLoadBody } from '@/components/query-load-body';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useQueryLoadState } from '@/hooks/use-query-load-state';
import { useGetMyOrdersQuery } from '@/store/api/ordersApi';
import {
  formatOrderHeading,
  formatOrderStatus,
  formatPaymentMethod,
  orderNeedsBankTransferPayment,
} from '@/utils/orderDisplay';

export default function OrdersScreen() {
  const { data: orders = [], isLoading, isFetching, isError, error, refetch } = useGetMyOrdersQuery();
  const { errorMessage, showContent } = useQueryLoadState({
    isError,
    error,
    fallback: 'Could not load order history.',
    isLoading,
  });
  const borderColor = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const primary = useThemeColor({}, 'primary');
  const primaryText = useThemeColor({}, 'primaryText');
  const muted = useThemeColor({}, 'muted');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="My Orders" />
        <Pressable style={[styles.refreshButton, { borderColor }]} onPress={refetch}>
          <ThemedText>{isFetching ? 'Refreshing...' : 'Refresh'}</ThemedText>
        </Pressable>

        <ApiErrorBanner
          title="Could not load orders"
          message={errorMessage}
          onRetry={refetch}
        />

        {showContent && orders.length === 0 ? <ThemedText>No orders yet.</ThemedText> : null}
        {showContent
          ? orders.map((order) => {
          const showBankDetails = orderNeedsBankTransferPayment(order);
          return (
            <ThemedView key={String(order.id)} style={[styles.orderCard, { borderColor, backgroundColor: surface }]}>
              <ThemedText type="defaultSemiBold">{formatOrderHeading(order)}</ThemedText>
              <ThemedText>Status: {formatOrderStatus(order.status)}</ThemedText>
              <ThemedText>Payment: {formatPaymentMethod(order.paymentMethod, order.walletProvider)}</ThemedText>
              <ThemedText>Total: Rs {order.total.toLocaleString()}</ThemedText>
              <ThemedText>Address: {order.address}</ThemedText>
              <ThemedText>Items: {order.items?.length ?? 0}</ThemedText>
              {order.status.toLowerCase() === 'cancelled' && order.cancellationReason ? (
                <ThemedText style={{ color: muted }}>
                  Cancellation reason: {order.cancellationReason}
                </ThemedText>
              ) : null}
              {showBankDetails ? (
                <Pressable
                  style={[styles.bankDetailsButton, { backgroundColor: primary }]}
                  onPress={() =>
                    router.push({
                      pathname: '/bank-transfer',
                      params: {
                        orderId: String(order.id),
                        orderNo: order.orderNo,
                        total: String(order.total),
                      },
                    })
                  }>
                  <ThemedText style={[styles.bankDetailsButtonText, { color: primaryText }]}>
                    View bank details to pay
                  </ThemedText>
                </Pressable>
              ) : null}
            </ThemedView>
          );
        })
          : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 16,
    gap: 12,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  refreshButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  orderCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  bankDetailsButton: {
    marginTop: 8,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  bankDetailsButtonText: {
    fontWeight: '700',
    fontSize: 14,
  },
});
