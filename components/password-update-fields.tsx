import { Pressable, StyleSheet } from 'react-native';

import { ValidatingTextInput } from '@/components/validating-text-input';
import { ThemedText } from '@/components/themed-text';
import { FIELD_LIMITS } from '@/constants/fieldLimits';

type FieldErrors = {
  previousPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

type Props = {
  showPreviousPassword?: boolean;
  previousPassword?: string;
  newPassword: string;
  confirmPassword: string;
  showPassword: boolean;
  fieldErrors: FieldErrors;
  onPreviousPasswordChange?: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onToggleShowPassword: () => void;
};

export function PasswordUpdateFields({
  showPreviousPassword = false,
  previousPassword = '',
  newPassword,
  confirmPassword,
  showPassword,
  fieldErrors,
  onPreviousPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onToggleShowPassword,
}: Props) {
  return (
    <>
      {showPreviousPassword ? (
        <ValidatingTextInput
          label="Previous password"
          placeholder="Enter your current password"
          value={previousPassword}
          onChangeText={onPreviousPasswordChange ?? (() => undefined)}
          maxLength={FIELD_LIMITS.password}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          secureTextEntry={!showPassword}
          error={fieldErrors.previousPassword}
        />
      ) : null}
      <ValidatingTextInput
        label="New password"
        placeholder="At least 8 characters"
        value={newPassword}
        onChangeText={onNewPasswordChange}
        maxLength={FIELD_LIMITS.password}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
        secureTextEntry={!showPassword}
        error={fieldErrors.newPassword}
      />
      <ValidatingTextInput
        label="Confirm password"
        placeholder="Re-enter new password"
        value={confirmPassword}
        onChangeText={onConfirmPasswordChange}
        maxLength={FIELD_LIMITS.password}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
        secureTextEntry={!showPassword}
        error={fieldErrors.confirmPassword}
      />
      <Pressable style={styles.toggleButton} onPress={onToggleShowPassword}>
        <ThemedText>{showPassword ? 'Hide passwords' : 'Show passwords'}</ThemedText>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  toggleButton: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
  },
});
