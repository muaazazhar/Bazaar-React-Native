import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { CheckoutTotals } from '@/utils/delivery';

type Props = {
  totals: CheckoutTotals;
  compact?: boolean;
};

export function OrderTotalsBreakdown({ totals, compact }: Props) {
  const muted = useThemeColor({}, 'muted');
  const { subtotal, deliveryCharge, grandTotal, freeDelivery } = totals;

  const showSubtotal = !compact || deliveryCharge > 0 || freeDelivery;
  const showDeliveryLine = !freeDelivery;

  return (
    <View style={styles.wrap}>
      {showSubtotal ? (
        <View style={styles.row}>
          <ThemedText style={compact ? styles.compactLabel : styles.label}>Subtotal</ThemedText>
          <ThemedText style={compact ? styles.compactValue : styles.value}>
            Rs. {subtotal.toLocaleString()}
          </ThemedText>
        </View>
      ) : null}
      {showDeliveryLine ? (
        <View style={styles.row}>
          <ThemedText style={compact ? styles.compactLabel : styles.label}>Delivery</ThemedText>
          <ThemedText style={compact ? styles.compactValue : styles.value}>
            Rs. {deliveryCharge.toLocaleString()}
          </ThemedText>
        </View>
      ) : null}
      {freeDelivery ? (
        <ThemedText style={[styles.freeNote, { color: muted }]}>
          Free delivery on this order
        </ThemedText>
      ) : null}
      <View style={[styles.row, styles.grandRow]}>
        <ThemedText style={compact ? styles.compactGrandLabel : styles.grandLabel}>Total</ThemedText>
        <ThemedText type={compact ? 'defaultSemiBold' : 'title'} style={compact ? styles.compactGrandValue : styles.grandValue}>
          Rs. {grandTotal.toLocaleString()}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
  },
  value: {
    fontSize: 16,
  },
  compactLabel: {
    fontSize: 14,
  },
  compactValue: {
    fontSize: 14,
  },
  freeNote: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 2,
  },
  grandRow: {
    marginTop: 4,
  },
  grandLabel: {
    fontSize: 22,
  },
  grandValue: {
    fontSize: 28,
    lineHeight: 32,
  },
  compactGrandLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  compactGrandValue: {
    fontSize: 20,
  },
});
