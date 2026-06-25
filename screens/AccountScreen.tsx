import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DebouncedPressable } from "@/components/debounced-pressable";
import { ScreenHeader } from "@/components/screen-header";
import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useSessionBusy } from "@/hooks/use-session-busy";
import { formatUserDisplayName } from "@/utils/userDisplay";
import { performSessionLogout } from "@/store/authSession";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export default function AccountScreen() {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const borderColor = useThemeColor({}, "border");
  const surface = useThemeColor({}, "surface");
  const muted = useThemeColor({}, "muted");

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
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Account" />

        <ThemedView
          style={[
            styles.profileCard,
            { borderColor, backgroundColor: surface },
          ]}
        >
          <ThemedText type="defaultSemiBold">
            {formatUserDisplayName(user, user?.username ?? "Customer")}
          </ThemedText>
          <ThemedText>{user?.email}</ThemedText>
          {user?.phone ? <ThemedText style={{ color: muted }}>{user.phone}</ThemedText> : null}
        </ThemedView>

        <ThemedView
          style={[styles.menuCard, { borderColor, backgroundColor: surface }]}
        >
          <ThemedText type="subtitle">Account & settings</ThemedText>
          <DebouncedPressable
            style={[styles.menuItem, { borderColor }]}
            onPress={() => router.push("/(tabs)/orders")}
            disabled={uiLocked}
          >
            <ThemedText>Orders</ThemedText>
          </DebouncedPressable>
          <DebouncedPressable
            style={[styles.menuItem, { borderColor }]}
            onPress={() => router.push("/edit-profile")}
            disabled={uiLocked}
          >
            <ThemedText>Edit profile</ThemedText>
          </DebouncedPressable>
          <DebouncedPressable style={[styles.menuItem, { borderColor }]} disabled={uiLocked}>
            <ThemedText>Connect Accounts</ThemedText>
          </DebouncedPressable>
          <DebouncedPressable style={[styles.menuItem, { borderColor }]} disabled={uiLocked}>
            <ThemedText>Share App</ThemedText>
          </DebouncedPressable>
        </ThemedView>

        <ThemedButton
          variant="danger"
          label={sessionBusy ? "Finishing tasks…" : "Logout"}
          loading={loggingOut}
          loadingLabel="Logging out…"
          onPress={() => void handleLogout()}
          disabled={uiLocked}
          style={styles.logoutButton}
        />
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
  profileCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  menuCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  menuItem: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  logoutButton: {
    alignSelf: "stretch",
  },
});
