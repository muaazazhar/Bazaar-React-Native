import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiErrorBanner } from '@/components/api-feedback';
import { OrderListSkeleton } from '@/components/catalog-skeletons';
import { CustomOrderBadge } from '@/components/custom-order-badge';
import { KeyboardAwareScroll } from '@/components/keyboard-aware-scroll';
import { OrderItemsList } from '@/components/order-items-list';
import { QueryLoadBody } from '@/components/query-load-body';
import { ScreenHeader } from '@/components/screen-header';
import { SurfaceCard } from '@/components/surface-card';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { useSessionBusy } from '@/hooks/use-session-busy';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGetReceiptQuery } from '@/store/api/ordersApi';
import { useAppSelector } from '@/store/hooks';
import { useQueryLoadState } from '@/hooks/use-query-load-state';
import { formatOrderHeading } from '@/utils/orderDisplay';
import {
  formatReceiptPaymentMethod,
  formatReceiptStatus,
  formatReceiptTotalLabel,
  getReceiptItemLabels,
  isCustomReceipt,
} from '@/utils/receipt';

type ReceiptScreenProps = {
  orderId: string;
  paymentMethod?: string;
  orderType?: string;
};

export default function ReceiptScreen({ orderId, paymentMethod, orderType }: ReceiptScreenProps) {
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

  const muted = useThemeColor({}, 'muted');

  const isBankTransfer = paymentMethod === 'bank_transfer';
  const isCustom = orderType === 'custom' || Boolean(data && isCustomReceipt(data));

  if (!canLoadReceipt) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <KeyboardAwareScroll contentContainerStyle={styles.container}>
          <ScreenHeader title="Receipt" />
          <ThemedText style={{ color: muted }}>Sign in to view your receipt.</ThemedText>
          <ThemedButton variant="secondary" label="Go to login" onPress={() => router.replace('/login')} />
        </KeyboardAwareScroll>
      </SafeAreaView>
    );
  }

  const itemLabels = data ? getReceiptItemLabels(data) : [];
  const paymentLabel = data
    ? formatReceiptPaymentMethod(data)
    : isCustom
      ? 'Cash on Delivery'
      : undefined;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAwareScroll contentContainerStyle={styles.container}>
        <ScreenHeader title="Receipt" />
        <ThemedText type="subtitle">Order Successful</ThemedText>
        {isCustom ? (
          <ThemedText style={{ color: muted }}>
            The store will confirm prices before delivery.
          </ThemedText>
        ) : null}
        {isBankTransfer && !isCustom ? (
          <ThemedText style={{ color: muted }}>
            Complete your bank transfer using the store account details. You can open them again anytime from My
            Orders.
          </ThemedText>
        ) : null}
        <QueryLoadBody
          isLoading={isLoading || sessionBusy}
          hasError={Boolean(errorMessage)}
          skeleton={<OrderListSkeleton count={1} />}>
          {data ? (
            <SurfaceCard style={styles.receiptCard}>
              <ThemedText type="defaultSemiBold">Receipt: {data.receiptNumber}</ThemedText>
              <ThemedText>{formatOrderHeading({ orderNo: data.orderNo })}</ThemedText>
              {isCustom ? <CustomOrderBadge color={muted} /> : null}
              <ThemedText>Status: {formatReceiptStatus(data.status)}</ThemedText>
              {paymentLabel ? <ThemedText>Payment: {paymentLabel}</ThemedText> : null}
              <ThemedText>Total: {formatReceiptTotalLabel(data)}</ThemedText>
              <ThemedText>Address: {data.deliveryAddress}</ThemedText>
              <OrderItemsList
                title={isCustom ? 'Requested items' : 'Items'}
                labels={itemLabels}
              />
            </SurfaceCard>
          ) : null}
        </QueryLoadBody>
        <ApiErrorBanner
          enabled={canLoadReceipt && Boolean(errorMessage) && !isLoading && !sessionBusy}
          title="Could not load receipt"
          message={errorMessage}
          onRetry={refetch}
        />

        {isBankTransfer && !isCustom && orderId ? (
          <ThemedButton
            variant="primary"
            label="View bank transfer details"
            onPress={() =>
              router.push({
                pathname: '/bank-transfer',
                params: {
                  orderId,
                  total: data ? String(data.totalAmount) : undefined,
                },
              })
            }
          />
        ) : null}

        <ThemedButton
          variant="secondary"
          label="Go to My Orders"
          onPress={() => router.push('/(tabs)/orders')}
          disabled={sessionBusy}
        />
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
  receiptCard: {
    gap: 6,
  },
});
