import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import {
  useThemePreference,
  type ThemePreference,
} from '@/context/ThemePreferenceContext';
import { useThemeColor } from '@/hooks/use-theme-color';

type ThemeOption = {
  value: ThemePreference;
  label: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const THEME_OPTIONS: ThemeOption[] = [
  {
    value: 'system',
    label: 'System',
    hint: 'Match device setting',
    icon: 'phone-portrait-outline',
  },
  {
    value: 'light',
    label: 'Light',
    hint: 'Always light mode',
    icon: 'sunny-outline',
  },
  {
    value: 'dark',
    label: 'Dark',
    hint: 'Always dark mode',
    icon: 'moon-outline',
  },
];

function themeIconForPreference(preference: ThemePreference): keyof typeof Ionicons.glyphMap {
  if (preference === 'light') return 'sunny-outline';
  if (preference === 'dark') return 'moon-outline';
  return 'contrast-outline';
}

type Props = {
  style?: StyleProp<ViewStyle>;
};

export function ThemeMenuButton({ style }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { preference, resolvedTheme, setPreference } = useThemePreference();

  const border = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const surfaceAlt = useThemeColor({}, 'surfaceAlt');
  const text = useThemeColor({}, 'text');
  const primary = useThemeColor({}, 'primary');
  const primaryText = useThemeColor({}, 'primaryText');
  const muted = useThemeColor({}, 'muted');

  const iconColor = resolvedTheme === 'dark' ? primaryText : text;
  const buttonBackground = resolvedTheme === 'dark' ? text : surfaceAlt;

  const selectTheme = (value: ThemePreference) => {
    setPreference(value);
    setMenuOpen(false);
  };

  const currentLabel =
    preference === 'system'
      ? `System (${resolvedTheme === 'dark' ? 'dark' : 'light'})`
      : preference === 'dark'
        ? 'Dark'
        : 'Light';

  return (
    <>
      <Pressable
        style={[styles.iconButton, { borderColor: border, backgroundColor: buttonBackground }, style]}
        onPress={() => setMenuOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Theme: ${currentLabel}. Tap to change.`}>
        <Ionicons name={themeIconForPreference(preference)} size={18} color={iconColor} />
      </Pressable>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}>
        <View style={[styles.modalRoot, { paddingTop: insets.top + 8, paddingRight: Math.max(insets.right, 16) }]}>
          <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)} accessibilityLabel="Close theme menu" />
          <View style={[styles.menu, { backgroundColor: surface, borderColor: border }]}>
            <ThemedText type="defaultSemiBold" style={styles.menuTitle}>
              Appearance
            </ThemedText>
            {THEME_OPTIONS.map((option) => {
              const selected = preference === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={[
                    styles.menuItem,
                    selected && { backgroundColor: surfaceAlt, borderColor: primary },
                  ]}
                  onPress={() => selectTheme(option.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}>
                  <View style={[styles.menuIconWrap, { backgroundColor: surfaceAlt }]}>
                    <Ionicons
                      name={option.icon}
                      size={20}
                      color={selected ? primary : text}
                    />
                  </View>
                  <View style={styles.menuTextWrap}>
                    <ThemedText type="defaultSemiBold">{option.label}</ThemedText>
                    <ThemedText style={{ color: muted, fontSize: 12 }}>{option.hint}</ThemedText>
                  </View>
                  {selected ? (
                    <Ionicons name="checkmark-circle" size={22} color={primary} />
                  ) : (
                    <View style={styles.checkPlaceholder} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    height: 34,
    width: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  menu: {
    width: 260,
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuTitle: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextWrap: {
    flex: 1,
    gap: 2,
  },
  checkPlaceholder: {
    width: 22,
    height: 22,
  },
});
