import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiErrorBanner } from '@/components/api-feedback';
import { OrderListSkeleton } from '@/components/catalog-skeletons';
import { QueryLoadBody } from '@/components/query-load-body';
import { BankTransferDetailsCard } from '@/components/bank-transfer-details-card';
import { KeyboardAwareScroll } from '@/components/keyboard-aware-scroll';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGetStoreSettingsQuery } from '@/store/api/storeSettingsApi';
import { useQueryLoadState } from '@/hooks/use-query-load-state';
import { getDisplayOrderNo } from '@/utils/orderDisplay';
import { hasBankTransferDetails } from '@/utils/storeSettings';

type BankTransferScreenProps = {
  /** Internal id for API routes only — not shown in UI. */
  orderId?: string;
  orderNo?: string;
  total?: string;
};

export default function BankTransferScreen({ orderId, orderNo, total }: BankTransferScreenProps) {
  const {
    data: storeSettings,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetStoreSettingsQuery();

  const muted = useThemeColor({}, 'muted');

  const parsedTotal = total != null ? Number(total) : undefined;
  const amount = parsedTotal != null && Number.isFinite(parsedTotal) ? parsedTotal : undefined;
  const { errorMessage, showSpinner, showContent } = useQueryLoadState({
    isError,
    error,
    fallback: 'Could not load bank transfer details.',
    isLoading,
  });
  const bankReady = hasBankTransferDetails(storeSettings);
  const displayOrderNo = getDisplayOrderNo({ orderNo });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAwareScroll contentContainerStyle={styles.container}>
        <ScreenHeader title="Bank Transfer" />
        <ThemedText style={{ color: muted }}>
          {displayOrderNo
            ? `Complete payment for order ${displayOrderNo} using the account below.`
            : 'Use the account below to pay for your order.'}
        </ThemedText>

        <ApiErrorBanner
          title="Could not load bank details"
          message={errorMessage}
          onRetry={refetch}
        />

        <QueryLoadBody
          isLoading={showSpinner}
          hasError={Boolean(errorMessage)}
          skeleton={<OrderListSkeleton count={1} />}>
          {bankReady && storeSettings ? (
            <BankTransferDetailsCard settings={storeSettings} orderNo={orderNo} amount={amount} />
          ) : null}
        </QueryLoadBody>

        {showContent && !bankReady ? (
          <ThemedText style={{ color: muted }}>
            Bank transfer is not set up yet. Please contact the store or choose another payment method.
          </ThemedText>
        ) : null}

        {orderId ? (
          <ThemedButton
            variant="primary"
            label="View order receipt"
            onPress={() =>
              router.push({
                pathname: '/receipt',
                params: { orderId, paymentMethod: 'bank_transfer' },
              })
            }
          />
        ) : null}

        <ThemedButton variant="secondary" label="Go to My Orders" onPress={() => router.push('/(tabs)/orders')} />
      </KeyboardAwareScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 32,
    gap: 12,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
});
