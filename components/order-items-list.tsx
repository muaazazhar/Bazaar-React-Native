import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type OrderItemsListProps = {
  labels: string[];
  title?: string;
};

export const OrderItemsList = memo(function OrderItemsList({ labels, title }: OrderItemsListProps) {
  if (labels.length === 0) return null;

  return (
    <View style={styles.itemsBlock}>
      {title ? <ThemedText type="defaultSemiBold">{title}</ThemedText> : null}
      {labels.map((label, idx) => (
        <ThemedText key={`${idx}-${label}`} style={styles.itemLine}>
          • {label}
        </ThemedText>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  itemsBlock: {
    gap: 4,
    marginTop: 2,
  },
  itemLine: {
    fontSize: 14,
    lineHeight: 20,
  },
});
