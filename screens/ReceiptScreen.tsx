import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ReceiptScreen({ total }: { total: string }) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Order Successful 🎉</ThemedText>
      <ThemedText type="subtitle">Total: Rs {total}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
});
