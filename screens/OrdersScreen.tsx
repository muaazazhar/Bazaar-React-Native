import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGetMyOrdersQuery } from '@/store/api/ordersApi';
import { getApiErrorMessage } from '@/utils/apiError';

export default function OrdersScreen() {
  const { data: orders = [], isLoading, isFetching, isError, error, refetch } = useGetMyOrdersQuery();
  const loadError = isError
    ? getApiErrorMessage(error, 'Could not load order history.')
    : null;
  const borderColor = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const danger = useThemeColor({}, 'danger');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="My Orders" />
        <Pressable style={[styles.refreshButton, { borderColor }]} onPress={refetch}>
          <ThemedText>Refresh</ThemedText>
        </Pressable>

      {(isLoading || isFetching) ? <ActivityIndicator /> : null}
      {loadError ? <ThemedText style={[styles.error, { color: danger }]}>{loadError}</ThemedText> : null}

      {!isLoading && orders.length === 0 ? <ThemedText>No orders yet.</ThemedText> : null}
        {orders.map((order) => (
          <ThemedView key={order.id} style={[styles.orderCard, { borderColor, backgroundColor: surface }]}>
            <ThemedText type="defaultSemiBold">Order #{order.id}</ThemedText>
            <ThemedText>Status: {order.status}</ThemedText>
            <ThemedText>Payment: {order.paymentMethod ?? 'N/A'} {order.walletProvider ? `(${order.walletProvider})` : ''}</ThemedText>
            <ThemedText>Total: Rs {order.total}</ThemedText>
            <ThemedText>Address: {order.address}</ThemedText>
            <ThemedText>Items: {order.items?.length ?? 0}</ThemedText>
          </ThemedView>
        ))}
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
  error: {
    // color set from theme token
  },
});
