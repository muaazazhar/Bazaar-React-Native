import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGetAllOrdersQuery, useUpdateOrderStatusMutation } from '@/store/api/ordersApi';

export default function AdminOrdersScreen() {
  const [busy, setBusy] = useState(false);
  const { data: orders = [], isLoading, refetch } = useGetAllOrdersQuery();
  const [updateOrderStatus] = useUpdateOrderStatusMutation();

  const borderColor = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');

  const handleUpdateOrderStatus = async (orderId: string, status: 'pending' | 'processing' | 'fulfilled' | 'cancelled') => {
    setBusy(true);
    try {
      await updateOrderStatus({ id: orderId, status }).unwrap();
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Admin Orders" />
        <Pressable style={[styles.secondaryButton, { borderColor }]} onPress={refetch}>
          <ThemedText>Refresh Orders</ThemedText>
        </Pressable>
        {isLoading ? <ActivityIndicator /> : null}
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
