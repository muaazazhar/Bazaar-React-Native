import { router } from 'expo-router';
import { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiErrorBanner } from '@/components/api-feedback';
import { PasswordUpdateFields } from '@/components/password-update-fields';
import { useNotification } from '@/context/NotificationContext';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  validatePassword,
  validatePasswordConfirm,
  validateRequired,
} from '@/constants/fieldLimits';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useChangePasswordMutation, useVerifyPasswordMutation } from '@/store/api/usersApi';
import { useAppSelector } from '@/store/hooks';
import { getApiErrorDetails } from '@/utils/apiError';
import { getApiErrorData } from '@/utils/authApiErrors';
import { notifySuccessAfterNavigateBack } from '@/utils/inAppNotify';

export default function ChangePasswordScreen() {
  const token = useAppSelector((state) => state.auth.token);
  const [verifyPassword] = useVerifyPasswordMutation();
  const [changePassword] = useChangePasswordMutation();
  const { notify } = useNotification();

  const [previousPassword, setPreviousPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    previousPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const backgroundColor = useThemeColor({}, 'background');
  const muted = useThemeColor({}, 'muted');

  const handleSubmit = async () => {
    const errors: {
      previousPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    } = {};

    const previousError = validateRequired(previousPassword, 'Previous password');
    if (previousError) errors.previousPassword = previousError;

    const newPasswordError = validatePassword(newPassword);
    if (newPasswordError) errors.newPassword = newPasswordError;

    const confirmError = validatePasswordConfirm(newPassword, confirmPassword);
    if (confirmError) errors.confirmPassword = confirmError;

    if (
      previousPassword &&
      newPassword &&
      previousPassword === newPassword
    ) {
      errors.newPassword = 'New password must be different from your current password.';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    setError('');
    try {
      await verifyPassword({ password: previousPassword }).unwrap();

      const result = await changePassword({
        currentPassword: previousPassword,
        newPassword,
        confirmPassword,
      }).unwrap();

      notifySuccessAfterNavigateBack(
        notify,
        result.message || 'Password updated successfully.',
        { title: 'Password changed' },
      );
    } catch (err) {
      const code = getApiErrorData(err)?.code;
      if (code === 'INVALID_PASSWORD') {
        setError('Invalid password. Check your previous password and try again.');
        setFieldErrors((prev) => ({
          ...prev,
          previousPassword: 'Previous password is incorrect.',
        }));
      } else {
        const details = getApiErrorDetails(err, 'Could not update password. Please try again.');
        setError(details.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <ThemedView style={[styles.container, { backgroundColor }]}>
          <ScreenHeader title="Change Password" />
          <ThemedText style={{ color: muted }}>Sign in to change your password.</ThemedText>
          <ThemedButton variant="primary" label="Go to login" onPress={() => router.replace('/login')} />
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}>
          <Pressable style={styles.scrollContent} onPress={Keyboard.dismiss} accessible={false}>
            <ThemedView style={[styles.container, { backgroundColor }]}>
              <ScreenHeader title="Change Password" />
              <ThemedText style={[styles.helperText, { color: muted }]}>
                Enter your current password, then choose a new password twice.
              </ThemedText>

              <PasswordUpdateFields
                showPreviousPassword
                previousPassword={previousPassword}
                newPassword={newPassword}
                confirmPassword={confirmPassword}
                showPassword={showPassword}
                fieldErrors={fieldErrors}
                onPreviousPasswordChange={(text) => {
                  setPreviousPassword(text);
                  if (fieldErrors.previousPassword) {
                    setFieldErrors((prev) => ({ ...prev, previousPassword: undefined }));
                  }
                  if (error) setError('');
                }}
                onNewPasswordChange={(text) => {
                  setNewPassword(text);
                  if (fieldErrors.newPassword) {
                    setFieldErrors((prev) => ({ ...prev, newPassword: undefined }));
                  }
                }}
                onConfirmPasswordChange={(text) => {
                  setConfirmPassword(text);
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }
                }}
                onToggleShowPassword={() => setShowPassword((prev) => !prev)}
              />

              <ApiErrorBanner title="Change password" message={error || null} />

              <ThemedButton
                variant="primary"
                label="Update password"
                loading={loading}
                onPress={handleSubmit}
              />
            </ThemedView>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  container: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    padding: 16,
    gap: 12,
  },
  helperText: { lineHeight: 20 },
});
