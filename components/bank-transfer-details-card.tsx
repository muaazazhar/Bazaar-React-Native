import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { StoreSettings } from '@/types/domain';

type BankTransferDetailsCardProps = {
  settings: StoreSettings;
  /** Customer-facing order number (`orderNo`), not internal database id. */
  orderNo?: string | null;
  amount?: number;
  compact?: boolean;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  const muted = useThemeColor({}, 'muted');
  return (
    <View style={styles.row}>
      <ThemedText style={[styles.label, { color: muted }]}>{label}</ThemedText>
      <ThemedText style={styles.value} selectable>
        {value}
      </ThemedText>
    </View>
  );
}

export function BankTransferDetailsCard({
  settings,
  orderNo,
  amount,
  compact = false,
}: BankTransferDetailsCardProps) {
  const displayOrderNo = orderNo?.trim() || null;
  const borderColor = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const primary = useThemeColor({}, 'primary');
  const muted = useThemeColor({}, 'muted');

  return (
    <ThemedView style={[styles.card, { borderColor, backgroundColor: surface }, compact && styles.cardCompact]}>
      <ThemedText type="defaultSemiBold">Bank transfer details</ThemedText>
      <ThemedText style={{ color: muted, fontSize: 13 }}>
        Transfer the exact order amount to the account below. Use your order number as the payment reference.
      </ThemedText>
      {displayOrderNo ? <DetailRow label="Order no." value={displayOrderNo} /> : null}
      {amount != null && Number.isFinite(amount) ? (
        <DetailRow label="Amount to pay" value={`Rs ${amount.toLocaleString()}`} />
      ) : null}
      <DetailRow label="Bank" value={settings.bankName} />
      <DetailRow label="Account name" value={settings.accountTitle} />
      <DetailRow label="Account number" value={settings.accountNumber} />
      {settings.iban ? <DetailRow label="IBAN" value={settings.iban} /> : null}
      {settings.instructions ? (
        <View style={[styles.instructionsBox, { borderColor, backgroundColor: surface }]}>
          <ThemedText style={[styles.label, { color: muted }]}>Instructions</ThemedText>
          <ThemedText style={styles.value} selectable>
            {settings.instructions}
          </ThemedText>
        </View>
      ) : null}
      {displayOrderNo ? (
        <ThemedText style={{ color: primary, fontSize: 13, fontWeight: '600' }}>
          Important: include order number {displayOrderNo} in your transfer description or reference field.
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  cardCompact: {
    padding: 12,
    gap: 8,
  },
  row: {
    gap: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  value: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  instructionsBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
});
