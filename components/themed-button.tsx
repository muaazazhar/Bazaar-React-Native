import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { DEFAULT_PRESS_DEBOUNCE_MS, useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { useThemeColor } from '@/hooks/use-theme-color';

type ThemedButtonVariant = 'primary' | 'secondary' | 'danger';

type ThemedButtonProps = {
  variant?: ThemedButtonVariant;
  size?: 'default' | 'large';
  label?: string;
  children?: React.ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
  debounceMs?: number;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function ThemedButton({
  variant = 'primary',
  size = 'default',
  label,
  children,
  loading = false,
  loadingLabel,
  disabled = false,
  debounceMs = DEFAULT_PRESS_DEBOUNCE_MS,
  onPress,
  style,
  accessibilityLabel,
}: ThemedButtonProps) {
  const primary = useThemeColor({}, 'primary');
  const primaryText = useThemeColor({}, 'primaryText');
  const border = useThemeColor({}, 'border');
  const danger = useThemeColor({}, 'danger');
  const text = useThemeColor({}, 'text');

  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const isDisabled = disabled || loading;
  const labelColor = isPrimary ? primaryText : isDanger ? danger : text;

  const debouncedOnPress = useDebouncedCallback(onPress, debounceMs);

  const content =
    children ??
    (loading ? (
      <View style={styles.loadingRow}>
        <ActivityIndicator color={labelColor} />
        {loadingLabel || label ? (
          <ThemedText
            style={[styles.text, size === 'large' && styles.largeText, { color: labelColor }]}>
            {loadingLabel ?? label}
          </ThemedText>
        ) : null}
      </View>
    ) : (
      <ThemedText
        style={[
          styles.text,
          size === 'large' && styles.largeText,
          isPrimary ? { color: primaryText } : isDanger ? { color: danger } : undefined,
        ]}>
        {label}
      </ThemedText>
    ));

  return (
    <Pressable
      style={[
        styles.base,
        size === 'large' && styles.large,
        isPrimary ? { backgroundColor: primary } : { borderColor: isDanger ? danger : border, borderWidth: 1 },
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={debouncedOnPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={accessibilityLabel ?? label}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  large: {
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  text: {
    fontWeight: '700',
  },
  largeText: {
    fontSize: 17,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  disabled: {
    opacity: 0.6,
  },
});
