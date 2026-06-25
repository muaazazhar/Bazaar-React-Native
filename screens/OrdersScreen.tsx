import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { DebouncedPressable } from '@/components/debounced-pressable';
import { ApiErrorBanner } from '@/components/api-feedback';
import { OrderListSkeleton } from '@/components/catalog-skeletons';
import { CustomOrderBadge } from '@/components/custom-order-badge';
import { ListEmptyPlaceholder } from '@/components/list-empty-placeholder';
import { OrderItemsList } from '@/components/order-items-list';
import { PaginatedFlatList, paginatedListStyles } from '@/components/paginated-flat-list';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { usePaginatedInfiniteList } from '@/hooks/use-paginated-infinite-list';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGetMyOrderPagesInfiniteQuery } from '@/store/api/ordersApi';
import type { Order } from '@/types/domain';
import { getApiErrorDetails } from '@/utils/apiError';
import {
  buildReceiptRouteParams,
  formatOrderHeading,
  formatOrderStatus,
  formatPaymentMethod,
  getOrderListMeta,
  orderNeedsBankTransferPayment,
} from '@/utils/orderDisplay';

export default function OrdersScreen() {
  const query = useGetMyOrderPagesInfiniteQuery();
  const { items, isInitialLoading, loadMore, isFetchingNextPage } = usePaginatedInfiniteList(query);

  const borderColor = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const primary = useThemeColor({}, 'primary');
  const primaryText = useThemeColor({}, 'primaryText');
  const muted = useThemeColor({}, 'muted');

  const errorMessage = query.isError
    ? getApiErrorDetails(query.error, 'Could not load order history.').message
    : null;

  const renderOrder = useCallback(
    ({ item: order }: { item: Order }) => {
      const { isCustom, itemLabels, totalLabel } = getOrderListMeta(order);
      const showBankDetails = orderNeedsBankTransferPayment(order);

      return (
        <ThemedView style={[styles.orderCard, { borderColor, backgroundColor: surface }]}>
          <ThemedText type="defaultSemiBold">{formatOrderHeading(order)}</ThemedText>
          {isCustom ? <CustomOrderBadge color={muted} /> : null}
          <ThemedText>Status: {formatOrderStatus(order.status)}</ThemedText>
          <ThemedText>Payment: {formatPaymentMethod(order.paymentMethod, order.walletProvider)}</ThemedText>
          <ThemedText>Total: {totalLabel}</ThemedText>
          <ThemedText>Address: {order.address}</ThemedText>
          <OrderItemsList title="Items" labels={itemLabels} />
          {itemLabels.length === 0 ? (
            <ThemedText>Items: {order.items?.length ?? 0}</ThemedText>
          ) : null}
          {order.status.toLowerCase() === 'cancelled' && order.cancellationReason ? (
            <ThemedText style={{ color: muted }}>
              Cancellation reason: {order.cancellationReason}
            </ThemedText>
          ) : null}
          <View style={styles.actionsRow}>
            <DebouncedPressable
              style={[styles.actionButton, { borderColor }]}
              onPress={() =>
                router.push({
                  pathname: '/receipt',
                  params: buildReceiptRouteParams(order),
                })
              }>
              <ThemedText>View receipt</ThemedText>
            </DebouncedPressable>
            {showBankDetails ? (
              <DebouncedPressable
                style={[styles.actionButton, styles.actionButtonPrimary, { backgroundColor: primary }]}
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
                <ThemedText style={[styles.actionButtonPrimaryText, { color: primaryText }]}>
                  Bank details
                </ThemedText>
              </DebouncedPressable>
            ) : null}
          </View>
        </ThemedView>
      );
    },
    [borderColor, muted, primary, primaryText, surface],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <PaginatedFlatList
        data={items}
        renderItem={renderOrder}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={loadMore}
        contentContainerStyle={paginatedListStyles.contentNarrow}
        ListHeaderComponent={
          <>
            <ScreenHeader title="My Orders" />
            <ThemedButton
              variant="secondary"
              label={query.isFetching && !isInitialLoading ? 'Refreshing...' : 'Refresh'}
              loading={query.isFetching && !isInitialLoading}
              onPress={() => void query.refetch()}
            />
            <ApiErrorBanner
              title="Could not load orders"
              message={errorMessage}
              onRetry={() => void query.refetch()}
            />
            {isInitialLoading ? <OrderListSkeleton count={3} /> : null}
          </>
        }
        ListEmptyComponent={
          <ListEmptyPlaceholder
            isLoading={isInitialLoading}
            isError={query.isError}
            loadingSkeleton={<OrderListSkeleton count={3} />}
            emptyLabel="No orders yet."
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  orderCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  actionButtonPrimary: {
    borderWidth: 0,
  },
  actionButtonPrimaryText: {
    fontWeight: '700',
    fontSize: 14,
  },
});
