import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGetAllOrdersQuery, useUpdateOrderStatusMutation } from '@/store/api/ordersApi';
import { getApiErrorMessage } from '@/utils/apiError';

export default function AdminOrdersScreen() {
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const { data: orders = [], isLoading, isError, error, refetch } = useGetAllOrdersQuery();
  const [updateOrderStatus] = useUpdateOrderStatusMutation();

  const borderColor = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const danger = useThemeColor({}, 'danger');
  const muted = useThemeColor({}, 'muted');

  const loadError = isError
    ? getApiErrorMessage(error, 'Could not load orders.')
    : null;

  const handleUpdateOrderStatus = async (
    orderId: string,
    status: 'pending' | 'processing' | 'fulfilled' | 'cancelled',
  ) => {
    setBusy(true);
    setActionError(null);
    try {
      await updateOrderStatus({ id: orderId, status }).unwrap();
    } catch (err) {
      const message = getApiErrorMessage(err, 'Could not update order status.');
      setActionError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Admin Orders" />
        {loadError ? <ThemedText style={{ color: danger }}>{loadError}</ThemedText> : null}
        {actionError ? <ThemedText style={{ color: danger }}>{actionError}</ThemedText> : null}
        <Pressable style={[styles.secondaryButton, { borderColor }]} onPress={refetch}>
          <ThemedText>{isLoading ? 'Refreshing...' : 'Refresh Orders'}</ThemedText>
        </Pressable>
        {isLoading ? <ActivityIndicator /> : null}
        {!isLoading && !loadError && orders.length === 0 ? (
          <ThemedText style={{ color: muted }}>No orders yet.</ThemedText>
        ) : null}
        {orders.map((order) => (
          <ThemedView key={String(order.id)} style={[styles.card, { borderColor, backgroundColor: surface }]}>
            <ThemedText type="defaultSemiBold">Order #{order.id}</ThemedText>
            <ThemedText>Customer: {order.user?.email ?? order.userId ?? 'N/A'}</ThemedText>
            <ThemedText>Status: {order.status}</ThemedText>
            <ThemedText>Payment: {order.paymentMethod ?? 'N/A'} {order.walletProvider ? `(${order.walletProvider})` : ''}</ThemedText>
            <ThemedText>Address: {order.address}</ThemedText>
            <ThemedText>Total: Rs {order.total}</ThemedText>
            <View style={styles.statusRow}>
              <Pressable style={[styles.secondaryButton, { borderColor }]} onPress={() => handleUpdateOrderStatus(String(order.id), 'processing')} disabled={busy}>
                <ThemedText>Processing</ThemedText>
              </Pressable>
              <Pressable style={[styles.secondaryButton, { borderColor }]} onPress={() => handleUpdateOrderStatus(String(order.id), 'fulfilled')} disabled={busy}>
                <ThemedText>Fulfilled</ThemedText>
              </Pressable>
              <Pressable style={[styles.secondaryButton, { borderColor }]} onPress={() => handleUpdateOrderStatus(String(order.id), 'cancelled')} disabled={busy}>
                <ThemedText>Cancel</ThemedText>
              </Pressable>
            </View>
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
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
});
