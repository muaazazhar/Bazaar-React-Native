import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function WalletScreen() {
  const borderColor = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const primary = useThemeColor({}, 'primary');
  const primaryText = useThemeColor({}, 'primaryText');
  const muted = useThemeColor({}, 'muted');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Wallet" />
        <ThemedView style={[styles.heroCard, { borderColor, backgroundColor: surface }]}>
          <ThemedText style={[styles.heroLabel, { color: muted }]}>Your coins</ThemedText>
          <ThemedText type="title">0</ThemedText>
        </ThemedView>
        <ThemedView style={[styles.sectionCard, { borderColor, backgroundColor: surface }]}>
          <ThemedText type="subtitle">Wallet services</ThemedText>
          <Pressable style={[styles.actionButton, { borderColor }]}>
            <ThemedText>Coins history</ThemedText>
          </Pressable>
          <Pressable style={[styles.primaryButton, { backgroundColor: primary }]}>
            <ThemedText style={[styles.primaryText, { color: primaryText }]}>Top up (Coming Soon)</ThemedText>
          </Pressable>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: 16,
    gap: 12,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    gap: 6,
  },
  heroLabel: {
    fontSize: 15,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  actionButton: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  primaryButton: {
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  primaryText: {
    fontWeight: '700',
  },
});
