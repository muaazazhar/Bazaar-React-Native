import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useGetReceiptQuery } from '@/store/api/ordersApi';
import { getApiErrorMessage } from '@/utils/apiError';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function ReceiptScreen({ orderId }: { orderId: string }) {
  const { data, isLoading, isError, error } = useGetReceiptQuery(
    { id: orderId },
    { skip: !orderId }
  );
  const danger = useThemeColor({}, 'danger');
  const loadError = isError
    ? getApiErrorMessage(error, 'Unable to load receipt.')
    : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ThemedView style={styles.container}>
        <ScreenHeader title="Receipt" />
        <ThemedText type="subtitle">Order Successful 🎉</ThemedText>
        {isLoading ? <ActivityIndicator /> : null}
        {loadError ? <ThemedText style={{ color: danger }}>{loadError}</ThemedText> : null}
        {data ? (
          <>
            <ThemedText type="subtitle">Receipt: {data.receiptNumber}</ThemedText>
            <ThemedText>Total: Rs {data.totalAmount}</ThemedText>
            <ThemedText>Status: {data.status}</ThemedText>
            <ThemedText>Address: {data.deliveryAddress}</ThemedText>
          </>
        ) : null}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    gap: 12,
    padding: 16,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
});
