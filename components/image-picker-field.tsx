import { Pressable, StyleSheet, View } from 'react-native';

import { RemoteImage } from '@/components/remote-image';
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
  const borderColor = useThemeColor({}, 'border');
  const primary = useThemeColor({}, 'primary');
  const primaryText = useThemeColor({}, 'primaryText');
  const muted = useThemeColor({}, 'muted');
  const danger = useThemeColor({}, 'danger');

  const isPrimary = variant === 'primary';

  return (
    <>
      <View style={styles.labelRow}>
        <ThemedText style={styles.fieldLabel}>{label}</ThemedText>
        {optional ? (
          <ThemedText style={[styles.optionalSuffix, { color: muted }]}> (optional)</ThemedText>
        ) : null}
      </View>
      <Pressable
        style={[
          isPrimary ? styles.button : styles.secondaryButton,
          isPrimary ? { backgroundColor: primary } : { borderColor },
          disabled && styles.disabled,
        ]}
        onPress={onPress}
        disabled={disabled}>
        <ThemedText style={isPrimary ? [styles.buttonText, { color: primaryText }] : undefined}>
          {actionLabel}
        </ThemedText>
      </Pressable>
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
            <Pressable
              style={[styles.removeButton, { borderColor: danger }]}
              onPress={onRemove}
              disabled={disabled}>
              <ThemedText style={{ color: danger }}>Remove image</ThemedText>
            </Pressable>
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
  button: {
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '700',
  },
  sizeHint: {
    fontSize: 12,
    lineHeight: 16,
  },
  disabled: {
    opacity: 0.6,
  },
  removeButton: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
});
