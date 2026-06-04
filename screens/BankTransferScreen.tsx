import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiErrorBanner } from '@/components/api-feedback';
import { QueryLoadBody } from '@/components/query-load-body';
import { BankTransferDetailsCard } from '@/components/bank-transfer-details-card';
import { KeyboardAwareScroll } from '@/components/keyboard-aware-scroll';
import { ScreenHeader } from '@/components/screen-header';
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

  const borderColor = useThemeColor({}, 'border');
  const primary = useThemeColor({}, 'primary');
  const primaryText = useThemeColor({}, 'primaryText');
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

        <QueryLoadBody isLoading={showSpinner} hasError={Boolean(errorMessage)}>
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
          <Pressable
            style={[styles.button, { backgroundColor: primary }]}
            onPress={() =>
              router.push({
                pathname: '/receipt',
                params: { orderId, paymentMethod: 'bank_transfer' },
              })
            }>
            <ThemedText style={[styles.buttonText, { color: primaryText }]}>View order receipt</ThemedText>
          </Pressable>
        ) : null}

        <Pressable style={[styles.secondaryButton, { borderColor }]} onPress={() => router.push('/(tabs)/orders')}>
          <ThemedText>Go to My Orders</ThemedText>
        </Pressable>
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
