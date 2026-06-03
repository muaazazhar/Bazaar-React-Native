import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/screen-header";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { clearStoredAuthSession } from "@/store/authStorage";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";

export default function AccountScreen() {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const borderColor = useThemeColor({}, "border");
  const surface = useThemeColor({}, "surface");
  const danger = useThemeColor({}, "danger");
  const muted = useThemeColor({}, "muted");

  const handleLogout = async () => {
    dispatch(logout());
    await clearStoredAuthSession();
    router.replace("/login");
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
            {user?.username ?? "Customer"}
          </ThemedText>
          <ThemedText>{user?.email}</ThemedText>
        </ThemedView>

        <ThemedView
          style={[styles.menuCard, { borderColor, backgroundColor: surface }]}
        >
          <ThemedText type="subtitle">Account & settings</ThemedText>
          <Pressable
            style={[styles.menuItem, { borderColor }]}
            onPress={() => router.push("/(tabs)/orders")}
          >
            <ThemedText>Orders</ThemedText>
          </Pressable>
          <Pressable style={[styles.menuItem, { borderColor }]}>
            <ThemedText>Connect Accounts</ThemedText>
          </Pressable>
          <Pressable style={[styles.menuItem, { borderColor }]}>
            <ThemedText>Settings</ThemedText>
          </Pressable>
          <Pressable style={[styles.menuItem, { borderColor }]}>
            <ThemedText>Share App</ThemedText>
          </Pressable>
        </ThemedView>

        <Pressable
          style={[styles.menuItem, { borderColor: danger }]}
          onPress={handleLogout}
        >
          <ThemedText style={{ color: danger }}>Logout</ThemedText>
        </Pressable>
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
});
