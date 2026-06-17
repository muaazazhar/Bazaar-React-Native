import { router } from 'expo-router';
import { useState } from 'react';
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
import { ValidatingTextInput } from '@/components/validating-text-input';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FIELD_LIMITS, validateEmail } from '@/constants/fieldLimits';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useForgotPasswordMutation } from '@/store/api/authApi';
import { savePasswordResetSession } from '@/store/passwordResetStorage';
import { getApiErrorDetails } from '@/utils/apiError';
import { getResendCooldownSeconds, isResendCooldownError } from '@/utils/authApiErrors';

export default function ForgotPasswordScreen() {
  const [forgotPassword] = useForgotPasswordMutation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState<string | undefined>();

  const backgroundColor = useThemeColor({}, 'background');
  const primary = useThemeColor({}, 'primary');
  const primaryText = useThemeColor({}, 'primaryText');
  const muted = useThemeColor({}, 'muted');
  const borderColor = useThemeColor({}, 'border');

  const handleSubmit = async () => {
    const emailError = validateEmail(email);
    setFieldError(emailError ?? undefined);
    if (emailError) return;

    setLoading(true);
    setError('');
    try {
      const trimmed = email.trim();
      const result = await forgotPassword({ email: trimmed }).unwrap();
      await savePasswordResetSession(result.email || trimmed);
      router.replace({
        pathname: '/verify-reset-otp',
        params: {
          email: result.email || trimmed,
          resendIn: String(result.resendAvailableInSeconds ?? 30),
        },
      });
    } catch (err) {
      if (isResendCooldownError(err)) {
        const trimmed = email.trim();
        await savePasswordResetSession(trimmed);
        router.replace({
          pathname: '/verify-reset-otp',
          params: {
            email: trimmed,
            resendIn: String(getResendCooldownSeconds(err)),
          },
        });
        return;
      }
      const details = getApiErrorDetails(
        err,
        'Could not send reset code. Please try again.',
      );
      setError(details.message);
    } finally {
      setLoading(false);
    }
  };

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
              <ScreenHeader title="Forgot Password" />
              <ThemedText style={[styles.helperText, { color: muted }]}>
                Enter your account email. We will send a 6-digit code to reset your password.
              </ThemedText>

              <ValidatingTextInput
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (fieldError) setFieldError(undefined);
                  if (error) setError('');
                }}
                maxLength={FIELD_LIMITS.email}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                error={fieldError}
              />

              <ApiErrorBanner title="Reset password" message={error || null} />

              <Pressable
                style={[styles.button, { backgroundColor: primary }, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={primaryText} />
                ) : (
                  <ThemedText style={[styles.buttonText, { color: primaryText }]}>
                    Send reset code
                  </ThemedText>
                )}
              </Pressable>

              <Pressable
                style={[styles.secondaryButton, { borderColor }]}
                onPress={() => router.replace('/login')}>
                <ThemedText>Back to login</ThemedText>
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
  button: {
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  buttonText: { fontWeight: '700' },
  buttonDisabled: { opacity: 0.55 },
});
