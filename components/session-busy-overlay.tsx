import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useSessionBusy } from '@/hooks/use-session-busy';
import { useThemeColor } from '@/hooks/use-theme-color';
import { isSessionLogoutInProgress } from '@/store/authSession';

export function SessionBusyOverlay() {
  const busy = useSessionBusy();
  const loggingOut = isSessionLogoutInProgress();
  const insets = useSafeAreaInsets();
  const surface = useThemeColor({}, 'surface');
  const muted = useThemeColor({}, 'muted');

  if (!busy && !loggingOut) {
    return null;
  }

  return (
    <View style={[styles.overlay, { paddingTop: insets.top }]} pointerEvents="auto">
      <View style={[styles.card, { backgroundColor: surface }]}>
        <ActivityIndicator size="small" />
        <ThemedText style={{ color: muted }}>
          {loggingOut ? 'Finishing up before sign out…' : 'Completing your order…'}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10000,
    elevation: 100,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 12,
    minWidth: 220,
  },
});
