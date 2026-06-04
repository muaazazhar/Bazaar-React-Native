import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiErrorBanner } from '@/components/api-feedback';
import { KeyboardAwareScroll } from '@/components/keyboard-aware-scroll';
import { formatOrderHeading } from '@/utils/orderDisplay';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSessionBusy } from '@/hooks/use-session-busy';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGetReceiptQuery } from '@/store/api/ordersApi';
import { useAppSelector } from '@/store/hooks';
import { useQueryLoadState } from '@/hooks/use-query-load-state';

type ReceiptScreenProps = {
  orderId: string;
  paymentMethod?: string;
};

export default function ReceiptScreen({ orderId, paymentMethod }: ReceiptScreenProps) {
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);
  const sessionBusy = useSessionBusy();
  const canLoadReceipt = Boolean(user && token && orderId);

  const { data, isLoading, isError, error, refetch } = useGetReceiptQuery(
    { id: orderId },
    { skip: !canLoadReceipt },
  );
  const { errorMessage } = useQueryLoadState({
    isError: canLoadReceipt && isError,
    error,
    fallback: 'Unable to load receipt.',
    isLoading,
  });

  const borderColor = useThemeColor({}, 'border');
  const primary = useThemeColor({}, 'primary');
  const primaryText = useThemeColor({}, 'primaryText');
  const muted = useThemeColor({}, 'muted');

  const isBankTransfer = paymentMethod === 'bank_transfer';

  if (!canLoadReceipt) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <KeyboardAwareScroll contentContainerStyle={styles.container}>
          <ScreenHeader title="Receipt" />
          <ThemedText style={{ color: muted }}>Sign in to view your receipt.</ThemedText>
          <Pressable style={[styles.secondaryButton, { borderColor }]} onPress={() => router.replace('/login')}>
            <ThemedText>Go to login</ThemedText>
          </Pressable>
        </KeyboardAwareScroll>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAwareScroll contentContainerStyle={styles.container}>
        <ScreenHeader title="Receipt" />
        <ThemedText type="subtitle">Order Successful</ThemedText>
        {isBankTransfer ? (
          <ThemedText style={{ color: muted }}>
            Complete your bank transfer using the store account details. You can open them again anytime from My
            Orders.
          </ThemedText>
        ) : null}
        {isLoading || sessionBusy ? <ActivityIndicator /> : null}
        <ApiErrorBanner
          enabled={canLoadReceipt}
          title="Could not load receipt"
          message={errorMessage}
          onRetry={refetch}
        />
        {data ? (
          <ThemedView style={[styles.card, { borderColor }]}>
            <ThemedText type="defaultSemiBold">Receipt: {data.receiptNumber}</ThemedText>
            <ThemedText>{formatOrderHeading({ orderNo: data.orderNo })}</ThemedText>
            <ThemedText>Total: Rs {data.totalAmount.toLocaleString()}</ThemedText>
            <ThemedText>Status: {data.status}</ThemedText>
            <ThemedText>Address: {data.deliveryAddress}</ThemedText>
          </ThemedView>
        ) : null}

        {isBankTransfer && orderId ? (
          <Pressable
            style={[styles.button, { backgroundColor: primary }]}
            onPress={() =>
              router.push({
                pathname: '/bank-transfer',
                params: {
                  orderId,
                  total: data ? String(data.totalAmount) : undefined,
                },
              })
            }>
            <ThemedText style={[styles.buttonText, { color: primaryText }]}>View bank transfer details</ThemedText>
          </Pressable>
        ) : null}

        <Pressable
          style={[styles.secondaryButton, { borderColor }]}
          onPress={() => router.push('/(tabs)/orders')}
          disabled={sessionBusy}>
          <ThemedText>Go to My Orders</ThemedText>
        </Pressable>
      </KeyboardAwareScroll>
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
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  button: {
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
});
