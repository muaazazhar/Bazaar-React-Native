import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { useThemePreference } from '@/context/ThemePreferenceContext';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

export function ScreenHeader({ title, showBack = true }: { title: string; showBack?: boolean }) {
  const { preference, resolvedTheme, setPreference } = useThemePreference();

  const isDark = resolvedTheme === 'dark';
  const label = preference === 'system' ? 'SYSTEM' : isDark ? 'NIGHT MODE' : 'DAY MODE';
  const surfaceAlt = useThemeColor({}, 'surfaceAlt');
  const border = useThemeColor({}, 'border');
  const text = useThemeColor({}, 'text');
  const primary = useThemeColor({}, 'primary');
  const primaryText = useThemeColor({}, 'primaryText');
  const surface = useThemeColor({}, 'surface');

  const handleToggleTheme = () => {
    setPreference(isDark ? 'light' : 'dark');
  };

  return (
    <View style={styles.row}>
      <View style={styles.leftSide}>
        {showBack && router.canGoBack() ? (
          <Pressable style={[styles.backButton, { borderColor: border, backgroundColor: surface }]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color={text} />
          </Pressable>
        ) : null}
        <ThemedText type="title" style={styles.title}>
          {title}
        </ThemedText>
      </View>
      <Pressable
        onPress={handleToggleTheme}
        onLongPress={() => setPreference('system')}
        style={[styles.toggle, { backgroundColor: isDark ? text : surfaceAlt, borderColor: border }]}>
        <ThemedText style={[styles.toggleLabel, { color: isDark ? primaryText : text }]}>{label}</ThemedText>
        <View style={[styles.iconCircle, { backgroundColor: isDark ? primary : surface }]}>
          <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={18} color={isDark ? primaryText : text} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  leftSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  title: {
    fontSize: 28,
    lineHeight: 32,
    flexShrink: 1,
  },
  backButton: {
    height: 34,
    width: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggle: {
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    minWidth: 148,
    justifyContent: 'space-between',
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  iconCircle: {
    height: 30,
    width: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
