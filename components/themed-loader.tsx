import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

type ThemedLoaderProps = {
  label?: string;
  size?: 'small' | 'large';
  minHeight?: number;
  style?: StyleProp<ViewStyle>;
};

export function ThemedLoader({ label, size = 'large', minHeight = 120, style }: ThemedLoaderProps) {
  const primary = useThemeColor({}, 'primary');
  const muted = useThemeColor({}, 'muted');

  return (
    <View style={[styles.wrap, { minHeight }, style]}>
      <ActivityIndicator size={size} color={primary} />
      {label ? <ThemedText style={{ color: muted, fontSize: 13 }}>{label}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
});
