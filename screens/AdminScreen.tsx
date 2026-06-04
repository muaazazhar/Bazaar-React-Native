import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useSessionBusy } from '@/hooks/use-session-busy';
import { performSessionLogout } from '@/store/authSession';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export default function AdminScreen() {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();

  const borderColor = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const primary = useThemeColor({}, 'primary');
  const primaryText = useThemeColor({}, 'primaryText');
  const muted = useThemeColor({}, 'muted');

  const [loggingOut, setLoggingOut] = useState(false);
  const sessionBusy = useSessionBusy();
  const uiLocked = loggingOut || sessionBusy;

  const handleLogout = async () => {
    if (uiLocked) return;
    setLoggingOut(true);
    try {
      await performSessionLogout(dispatch);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Admin Panel" showBack={false} />
        <ThemedText>Logged in as: {user?.email}</ThemedText>
        <ThemedText>Role: {user?.role}</ThemedText>
        <ThemedText style={[styles.helperText, { color: muted }]}>
          Keep operations clean with separate product and category modules.
        </ThemedText>

        <View style={styles.quickActionsRow}>
          <Pressable style={[styles.quickActionCard, { borderColor, backgroundColor: surface }]} onPress={() => router.push('/admin-products')}>
            <ThemedText type="defaultSemiBold">Manage Products</ThemedText>
            <ThemedText style={[styles.smallText, { color: muted }]}>Create, edit, delete, assign category, attach image.</ThemedText>
          </Pressable>
          <Pressable style={[styles.quickActionCard, { borderColor, backgroundColor: surface }]} onPress={() => router.push('/admin-categories')}>
            <ThemedText type="defaultSemiBold">Manage Categories</ThemedText>
            <ThemedText style={[styles.smallText, { color: muted }]}>Create, edit, delete categories with image.</ThemedText>
          </Pressable>
        </View>
        <Pressable style={[styles.quickActionCard, { borderColor, backgroundColor: surface }]} onPress={() => router.push('/admin-orders')}>
          <ThemedText type="defaultSemiBold">Manage Orders</ThemedText>
          <ThemedText style={[styles.smallText, { color: muted }]}>View and update order statuses in a separate screen.</ThemedText>
        </Pressable>
        <Pressable style={[styles.quickActionCard, { borderColor, backgroundColor: surface }]} onPress={() => router.push('/admin-store-settings')}>
          <ThemedText type="defaultSemiBold">Store Settings</ThemedText>
          <ThemedText style={[styles.smallText, { color: muted }]}>Payments, delivery, and popular products on the home screen.</ThemedText>
        </Pressable>

        <Pressable
          style={[styles.secondaryButton, { borderColor }, uiLocked && { opacity: 0.6 }]}
          onPress={handleLogout}
          disabled={uiLocked}>
          {loggingOut ? (
            <ActivityIndicator />
          ) : (
            <ThemedText>{sessionBusy ? 'Finishing tasks…' : 'Logout'}</ThemedText>
          )}
        </Pressable>
      </ScrollView>
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
    maxWidth: 860,
    alignSelf: 'center',
  },
  helperText: {
    marginBottom: 8,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  smallText: {
    fontSize: 13,
    lineHeight: 18,
  },
  button: {
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
});
