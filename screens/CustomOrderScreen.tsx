import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiErrorBanner } from '@/components/api-feedback';
import { KeyboardAwareScroll } from '@/components/keyboard-aware-scroll';
import { OrderItemsList } from '@/components/order-items-list';
import { ValidatingTextInput } from '@/components/validating-text-input';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FIELD_LIMITS, validateRequired } from '@/constants/fieldLimits';
import { useNotification } from '@/context/NotificationContext';
import { useSessionBusy } from '@/hooks/use-session-busy';
import { useThemeColor } from '@/hooks/use-theme-color';
import { usePlaceOrderMutation } from '@/store/api/ordersApi';
import { useAppDispatch } from '@/store/hooks';
import { getApiErrorDetails } from '@/utils/apiError';
import {
  CUSTOM_ORDER_MAX_ITEMS,
  parseCustomOrderLines,
  validateCustomOrderItems,
} from '@/utils/customOrder';
import { orderPlacedMessage } from '@/utils/notificationMessages';
import { completeOrderPlacement } from '@/utils/orderPlacement';

export default function CustomOrderScreen() {
  const dispatch = useAppDispatch();
  const { notify } = useNotification();
  const sessionBusy = useSessionBusy();
  const [placeOrder] = usePlaceOrderMutation();

  const [itemsText, setItemsText] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState('Place order');
  const [error, setError] = useState('');
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ address?: string }>({});

  const borderColor = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const surfaceAlt = useThemeColor({}, 'surfaceAlt');
  const primary = useThemeColor({}, 'primary');
  const primaryText = useThemeColor({}, 'primaryText');
  const muted = useThemeColor({}, 'muted');

  const parsedItems = useMemo(() => parseCustomOrderLines(itemsText), [itemsText]);

  const handlePlaceOrder = async () => {
    const addressError = validateRequired(address, 'Delivery address');
    const itemValidationError = validateCustomOrderItems(parsedItems);
    setFieldErrors(addressError ? { address: addressError } : {});
    setItemsError(itemValidationError);
    if (addressError || itemValidationError) return;

    setError('');
    setLoading(true);
    setLoadingLabel('Placing order...');
    try {
      const order = await placeOrder({
        kind: 'custom',
        body: {
          address: address.trim(),
          customItems: parsedItems,
          paymentMethod: 'cash_on_delivery',
        },
      }).unwrap();

      await completeOrderPlacement(dispatch, order, {
        notify,
        notification: orderPlacedMessage(order.orderNo),
        onProgress: setLoadingLabel,
      });
    } catch (err) {
      const details = getApiErrorDetails(err, 'Could not place your custom order. Please try again.');
      setError(details.message);
    } finally {
      setLoading(false);
      setLoadingLabel('Place order');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAwareScroll contentContainerStyle={styles.container}>
        <ScreenHeader title="Non-listed items" />
        <ThemedText style={{ color: muted }}>
          Type what you need — each new line is one item. Payment is cash on delivery only; the store
          will confirm the price when your order is processed.
        </ThemedText>

        <ThemedView style={[styles.card, { borderColor, backgroundColor: surface }]}>
          <ThemedText type="defaultSemiBold">Your list</ThemedText>
          <ThemedText style={{ color: muted, fontSize: 13 }}>
            Example: one item per line (bullets are optional)
          </ThemedText>
          <ValidatingTextInput
            label="Items to order"
            placeholder={'Organic honey 500g\nFresh coriander bunch\nBrand X detergent'}
            value={itemsText}
            onChangeText={(text) => {
              setItemsText(text);
              if (itemsError) setItemsError(null);
            }}
            maxLength={FIELD_LIMITS.customOrderNotes}
            multiline
            error={itemsError ?? undefined}
          />
          {parsedItems.length > 0 ? (
            <ThemedView style={[styles.previewCard, { borderColor, backgroundColor: surfaceAlt }]}>
              <ThemedText type="defaultSemiBold" style={styles.previewTitle}>
                Preview ({parsedItems.length}/{CUSTOM_ORDER_MAX_ITEMS})
              </ThemedText>
              <OrderItemsList labels={parsedItems} />
            </ThemedView>
          ) : null}
        </ThemedView>

        <ThemedView style={[styles.card, { borderColor, backgroundColor: surface }]}>
          <ThemedText type="defaultSemiBold">Payment</ThemedText>
          <ThemedView style={[styles.codChip, { borderColor: primary, backgroundColor: primary }]}>
            <ThemedText style={{ color: primaryText, fontWeight: '700' }}>Cash on Delivery</ThemedText>
          </ThemedView>
          <ThemedText style={{ color: muted, fontSize: 13 }}>
            No online payment or bank transfer for custom requests. Pay when your order is delivered.
          </ThemedText>
        </ThemedView>

        <ThemedView style={[styles.card, { borderColor, backgroundColor: surface }]}>
          <ValidatingTextInput
            label="Delivery address"
            placeholder="House 12, Street 4, City"
            value={address}
            onChangeText={(text) => {
              setAddress(text);
              if (fieldErrors.address) {
                setFieldErrors({});
              }
            }}
            maxLength={FIELD_LIMITS.address}
            multiline
            error={fieldErrors.address}
          />
        </ThemedView>

        <ApiErrorBanner title="Custom order" message={error || null} />

        <Pressable
          style={[
            styles.primaryButton,
            { backgroundColor: primary },
            (loading || sessionBusy) && styles.buttonDisabled,
          ]}
          onPress={handlePlaceOrder}
          disabled={loading || sessionBusy}>
          {loading ? <ActivityIndicator color={primaryText} /> : null}
          <ThemedText style={[styles.primaryButtonText, { color: primaryText }]}>
            {loading ? loadingLabel : 'Place custom order'}
          </ThemedText>
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
    paddingBottom: 40,
    gap: 12,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  previewCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  previewTitle: {
    marginBottom: 2,
  },
  codChip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
