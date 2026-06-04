import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemeMenuButton } from "@/components/theme-menu-button";
import { useThemeColor } from "@/hooks/use-theme-color";

export function ScreenHeader({
  title,
  showBack = true,
}: {
  title: string;
  showBack?: boolean;
}) {
  const showsBack = showBack && router.canGoBack();
  const border = useThemeColor({}, "border");
  const text = useThemeColor({}, "text");
  const surface = useThemeColor({}, "surface");

  return (
    <View style={styles.row}>
      {showsBack ? (
        <Pressable
          style={[
            styles.backButton,
            { borderColor: border, backgroundColor: surface },
          ]}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={18} color={text} />
        </Pressable>
      ) : null}

      <View style={styles.titleWrap}>
        <ThemedText
          type="title"
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[styles.title, showsBack && styles.titleCompact]}
        >
          {title}
        </ThemedText>
      </View>

      <ThemeMenuButton />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    flexShrink: 1,
  },
  titleCompact: {
    fontSize: 20,
    lineHeight: 26,
  },
  backButton: {
    height: 34,
    width: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
