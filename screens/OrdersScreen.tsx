import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getMyOrdersApi } from '@/services/storeApi';
import type { Order } from '@/types/domain';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const data = await getMyOrdersApi();
      setOrders(data);
    } catch {
      setError('Could not load order history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="title">My Orders</ThemedText>
      <Pressable style={styles.refreshButton} onPress={loadOrders}>
        <ThemedText>Refresh</ThemedText>
      </Pressable>

      {loading ? <ActivityIndicator /> : null}
      {!!error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

      {!loading && orders.length === 0 ? <ThemedText>No orders yet.</ThemedText> : null}
      {orders.map((order) => (
        <ThemedView key={order.id} style={styles.orderCard}>
          <ThemedText type="defaultSemiBold">Order #{order.id}</ThemedText>
          <ThemedText>Status: {order.status}</ThemedText>
          <ThemedText>Total: Rs {order.total}</ThemedText>
          <ThemedText>Address: {order.address}</ThemedText>
          <ThemedText>Items: {order.items?.length ?? 0}</ThemedText>
        </ThemedView>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  refreshButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  orderCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  error: {
    color: '#d32f2f',
  },
});
