import {
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputProps,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

type ValidatingTextInputProps = {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  maxLength: number;
  placeholder?: string;
  error?: string | null;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoCorrect?: boolean;
  secureTextEntry?: boolean;
  textContentType?: TextInputProps['textContentType'];
  editable?: boolean;
};

export function ValidatingTextInput({
  label,
  value,
  onChangeText,
  maxLength,
  placeholder,
  error,
  multiline,
  keyboardType,
  autoCapitalize,
  autoCorrect,
  secureTextEntry,
  textContentType,
  editable = true,
}: ValidatingTextInputProps) {
  const borderColor = useThemeColor({}, 'border');
  const inputBackground = useThemeColor({}, 'inputBackground');
  const inputText = useThemeColor({}, 'inputText');
  const muted = useThemeColor({}, 'muted');
  const danger = useThemeColor({}, 'danger');

  const count = value.length;
  const atLimit = count >= maxLength;

  return (
    <View style={styles.field}>
      {label ? <ThemedText style={styles.label}>{label}</ThemedText> : null}
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          {
            borderColor: error ? danger : borderColor,
            backgroundColor: inputBackground,
            color: inputText,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={muted}
        value={value}
        onChangeText={onChangeText}
        maxLength={maxLength}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        secureTextEntry={secureTextEntry}
        textContentType={textContentType}
        editable={editable}
      />
      <View style={styles.metaRow}>
        {error ? (
          <ThemedText style={[styles.errorText, { color: danger }]}>{error}</ThemedText>
        ) : (
          <View style={styles.errorSpacer} />
        )}
        <ThemedText style={[styles.counter, { color: atLimit ? danger : muted }]}>
          {count}/{maxLength}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  inputMultiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  errorSpacer: {
    flex: 1,
  },
  counter: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
});
