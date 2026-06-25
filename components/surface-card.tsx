import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

type SurfaceCardProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  nested?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function SurfaceCard({ children, title, subtitle, nested = false, style }: SurfaceCardProps) {
  const borderColor = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const muted = useThemeColor({}, 'muted');

  return (
    <ThemedView
      style={[
        styles.card,
        nested && styles.nested,
        { borderColor, backgroundColor: surface },
        style,
      ]}>
      {title ? <ThemedText type="defaultSemiBold">{title}</ThemedText> : null}
      {subtitle ? <ThemedText style={{ color: muted, fontSize: 13 }}>{subtitle}</ThemedText> : null}
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  nested: {
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
});
