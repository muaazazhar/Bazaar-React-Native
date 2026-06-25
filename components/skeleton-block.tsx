import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

type SkeletonBlockProps = {
  width?: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

export function SkeletonBlock({ width = '100%', height, borderRadius = 10, style }: SkeletonBlockProps) {
  const surfaceAlt = useThemeColor({}, 'surfaceAlt');
  const border = useThemeColor({}, 'border');

  return (
    <View
      style={[
        styles.block,
        { width, height, borderRadius, backgroundColor: surfaceAlt, borderColor: border },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  block: {
    borderWidth: 1,
    opacity: 0.9,
  },
});
