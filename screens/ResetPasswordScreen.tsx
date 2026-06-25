import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { validatePassword, validatePasswordConfirm } from '@/constants/fieldLimits';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useResetPasswordMutation } from '@/store/api/authApi';
import {
  clearPasswordResetStorage,
  getPasswordResetToken,
} from '@/store/passwordResetStorage';
import { getApiErrorDetails } from '@/utils/apiError';
import { notifySuccessAfterNavigate } from '@/utils/inAppNotify';

export default function ResetPasswordScreen() {
  const [resetPassword] = useResetPasswordMutation();
  const { notify } = useNotification();

  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const backgroundColor = useThemeColor({}, 'background');
  const muted = useThemeColor({}, 'muted');
  const danger = useThemeColor({}, 'danger');

  useEffect(() => {
    void getPasswordResetToken().then((token) => {
      if (token) {
        setResetToken(token);
      } else {
        router.replace('/forgot-password');
      }
    });
  }, []);

  const handleSubmit = async () => {
    if (!resetToken) {
      setError('Reset session expired. Please request a new code.');
      return;
    }

    const errors: { newPassword?: string; confirmPassword?: string } = {};
    const newPasswordError = validatePassword(newPassword);
    if (newPasswordError) errors.newPassword = newPasswordError;
    const confirmError = validatePasswordConfirm(newPassword, confirmPassword);
    if (confirmError) errors.confirmPassword = confirmError;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    setError('');
    try {
      const result = await resetPassword({
        resetToken,
        newPassword,
        confirmPassword,
      }).unwrap();
      await clearPasswordResetStorage();
      notifySuccessAfterNavigate(
        notify,
        result.message || 'Password updated. You can sign in now.',
        () => router.replace('/login'),
        { title: 'Password reset' },
      );
    } catch (err) {
      const details = getApiErrorDetails(err, 'Could not update password. Please try again.');
      setError(details.message);
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <ThemedView style={[styles.container, { backgroundColor }]}>
          <ActivityIndicator />
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
              <ScreenHeader title="New Password" showBack={false} />
              <ThemedText style={[styles.helperText, { color: muted }]}>
                Choose a new password. You will sign in with it on the next screen.
              </ThemedText>

              <PasswordUpdateFields
                newPassword={newPassword}
                confirmPassword={confirmPassword}
                showPassword={showPassword}
                fieldErrors={fieldErrors}
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

              <ApiErrorBanner title="Reset password" message={error || null} />

              <ThemedButton
                variant="primary"
                label="Update password"
                loading={loading}
                onPress={handleSubmit}
              />

              <Pressable onPress={() => router.replace('/forgot-password')}>
                <ThemedText type="link" style={{ color: danger }}>
                  Start over
                </ThemedText>
              </Pressable>
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
