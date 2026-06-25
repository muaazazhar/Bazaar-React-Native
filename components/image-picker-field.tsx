import { Pressable, StyleSheet, View } from 'react-native';

import { RemoteImage } from '@/components/remote-image';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { MAX_IMAGE_SIZE_LABEL } from '@/utils/imageUpload';

type ImagePickerFieldProps = {
  label: string;
  optional?: boolean;
  onPress: () => void;
  onRemove?: () => void;
  imageUri?: string | null;
  imageError?: string | null;
  disabled?: boolean;
  recyclingKey?: string;
  variant?: 'primary' | 'secondary';
  actionLabel?: string;
  previewStyle?: { width: number; height: number; borderRadius: number };
};

export function ImagePickerField({
  label,
  optional = false,
  onPress,
  onRemove,
  imageUri,
  imageError,
  disabled,
  recyclingKey,
  variant = 'primary',
  actionLabel = 'Browse gallery',
  previewStyle = { width: 108, height: 108, borderRadius: 12 },
}: ImagePickerFieldProps) {
  const danger = useThemeColor({}, 'danger');
  const muted = useThemeColor({}, 'muted');

  return (
    <>
      <View style={styles.labelRow}>
        <ThemedText style={styles.fieldLabel}>{label}</ThemedText>
        {optional ? (
          <ThemedText style={[styles.optionalSuffix, { color: muted }]}> (optional)</ThemedText>
        ) : null}
      </View>
      <ThemedButton
        variant={variant}
        label={actionLabel}
        onPress={onPress}
        disabled={disabled}
      />
      <ThemedText style={[styles.sizeHint, { color: muted }]}>
        Maximum image size: {MAX_IMAGE_SIZE_LABEL}
      </ThemedText>
      {imageError ? (
        <ThemedText style={[styles.sizeHint, { color: danger }]}>{imageError}</ThemedText>
      ) : null}
      {imageUri ? (
        <>
          <RemoteImage uri={imageUri} style={previewStyle} recyclingKey={recyclingKey ?? imageUri} />
          {onRemove ? (
            <ThemedButton variant="danger" label="Remove image" onPress={onRemove} disabled={disabled} />
          ) : null}
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionalSuffix: {
    fontSize: 14,
    fontWeight: '400',
  },
  sizeHint: {
    fontSize: 12,
    lineHeight: 16,
  },
});
